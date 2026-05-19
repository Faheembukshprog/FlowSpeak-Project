using System;
using System.Security.Cryptography;
using System.Text;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthController(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // ── DTOs ──
        public record RegisterRequest(string Username, string Password, string FullName, string Role = "Viewer");
        public record LoginRequest(string Username, string Password);

        /// <summary>
        /// Register a new user. Passwords are hashed with SHA-256 + salt.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { success = false, message = "Username and password are required." });

            var exists = await _context.AppUsers.AnyAsync(u => u.Username == req.Username);
            if (exists)
                return Conflict(new { success = false, message = "Username already exists." });

            var user = new AppUser
            {
                Username = req.Username,
                FullName = req.FullName ?? req.Username,
                PasswordHash = HashPassword(req.Password),
                Role = ValidateRole(req.Role),
                PhoneNumber = Guid.NewGuid().ToString(), // Prevent unique constraint violation
                IsActive = true
            };

            await _context.AppUsers.AddAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"User '{req.Username}' registered with role '{user.Role}'." });
        }

        /// <summary>
        /// Login: validates credentials, issues access token in HttpOnly cookie,
        /// stores refresh token in DB.
        /// Mistake #8 Avoided: Tokens go in HttpOnly cookies, NOT localStorage.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.Username == req.Username && u.IsActive);
            if (user == null || !VerifyPassword(req.Password, user.PasswordHash))
                return Unauthorized(new { success = false, message = "Invalid credentials." });

            // Generate dual tokens
            var accessToken = _jwtService.GenerateAccessToken(user.ExternalId, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();

            // Store refresh token in DB (Mistake #1 Avoided: can be revoked server-side)
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            // Mistake #8 Avoided: Set tokens as HttpOnly Secure cookies
            SetAccessTokenCookie(accessToken);
            SetRefreshTokenCookie(refreshToken);

            return Ok(new
            {
                success = true,
                message = $"Welcome, {user.FullName}.",
                user = new { user.FullName, user.Role }
            });
        }

        /// <summary>
        /// Refresh: exchanges a valid refresh token for a new access token.
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["flowspeak_refresh"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new { success = false, message = "No refresh token provided." });

            var user = await _context.AppUsers.FirstOrDefaultAsync(u =>
                u.RefreshToken == refreshToken &&
                u.RefreshTokenExpiresAt > DateTime.UtcNow &&
                u.IsActive);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid or expired refresh token." });

            // Rotate tokens
            var newAccessToken = _jwtService.GenerateAccessToken(user.ExternalId, user.Role);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            SetAccessTokenCookie(newAccessToken);
            SetRefreshTokenCookie(newRefreshToken);

            return Ok(new { success = true, message = "Tokens refreshed." });
        }

        /// <summary>
        /// Logout: clears cookies and revokes the refresh token from the database.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["flowspeak_refresh"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
                if (user != null)
                {
                    user.RefreshToken = null;
                    user.RefreshTokenExpiresAt = null;
                    await _context.SaveChangesAsync();
                }
            }

            // Clear Cookies
            Response.Cookies.Delete("flowspeak_access");
            Response.Cookies.Delete("flowspeak_refresh", new CookieOptions { Path = "/api/auth" });

            return Ok(new { success = true, message = "Logged out." });
        }

        // ── Helpers ──

        private void SetAccessTokenCookie(string token)
        {
            Response.Cookies.Append("flowspeak_access", token, new CookieOptions
            {
                HttpOnly = true,      // Mistake #8: JS cannot read this
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(15),
                Path = "/"
            });
        }

        private void SetRefreshTokenCookie(string token)
        {
            Response.Cookies.Append("flowspeak_refresh", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/api/auth"    // Only sent to auth endpoints
            });
        }

        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private static bool VerifyPassword(string password, string hash)
        {
            // If the existing hash is old SHA-256 (length typically 44 base64 chars), this will fail verification gracefully.
            // In a real migration, we would catch it, verify with old SHA, re-hash with BCrypt, and update DB.
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch
            {
                // Fallback for legacy SHA-256 if needed, but for greenfield we just return false
                using var sha = System.Security.Cryptography.SHA256.Create();
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
                var legacyHash = Convert.ToBase64String(bytes);
                return legacyHash == hash;
            }
        }

        private static string ValidateRole(string role)
        {
            return role switch
            {
                "Admin" => "Admin",
                "Sales" => "Sales",
                _ => "Viewer"
            };
        }
    }
}
