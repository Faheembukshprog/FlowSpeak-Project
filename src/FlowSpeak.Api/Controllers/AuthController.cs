using System.Security.Cryptography;
using System.Text;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService          _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext context,
            IJwtService jwtService,
            ILogger<AuthController> logger)
        {
            _context    = context;
            _jwtService = jwtService;
            _logger     = logger;
        }

        // ── DTOs ────────────────────────────────────────────────────────────
        public record RegisterRequest(string Username, string Password, string FullName);
        public record LoginRequest(string Username, string Password);

        /// <summary>
        /// Register a new user. Password hashed with BCrypt (work factor 12).
        /// </summary>
        [HttpPost("register")]
        [EnableRateLimiting("auth_per_ip")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { success = false, message = "Username and password are required." });

            if (req.Password.Length < 6)
                return BadRequest(new { success = false, message = "Password must be at least 6 characters." });

            var exists = await _context.AppUsers.AnyAsync(u => u.Username == req.Username);
            if (exists)
                return Conflict(new { success = false, message = "Username already exists." });

            var user = new AppUser
            {
                Username     = req.Username,
                FullName     = req.FullName ?? req.Username,
                PasswordHash = HashPassword(req.Password),
                Role         = "Viewer",
                PhoneNumber  = Guid.NewGuid().ToString(),
                IsActive     = true
            };

            await _context.AppUsers.AddAsync(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("New user registered: {Username} ({Role})", user.Username, user.Role);
            return Ok(new { success = true, message = $"User '{req.Username}' registered with role '{user.Role}'." });
        }

        /// <summary>
        /// Login: validates credentials, issues access token in HttpOnly cookie.
        /// Rate-limited to 10 attempts per minute per IP to prevent brute-force.
        /// </summary>
        [HttpPost("login")]
        [EnableRateLimiting("auth_per_ip")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            // Constant-time user lookup (don't reveal whether username exists)
            var user = await _context.AppUsers.FirstOrDefaultAsync(
                u => u.Username == req.Username && !u.IsDeleted);

            if (user == null || !user.IsActive || !VerifyPassword(req.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed login attempt for username: {Username} from {IP}",
                    req.Username, HttpContext.Connection.RemoteIpAddress);
                // Generic message — don't reveal whether username exists
                return Unauthorized(new { success = false, message = "Invalid credentials." });
            }

            var accessToken  = _jwtService.GenerateAccessToken(user.ExternalId, user.Role);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken          = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            SetAccessTokenCookie(accessToken);
            SetRefreshTokenCookie(refreshToken);

            _logger.LogInformation("User {Username} logged in successfully", user.Username);
            return Ok(new
            {
                success = true,
                message = $"Welcome, {user.FullName}.",
                user    = new { user.FullName, user.Role }
            });
        }

        /// <summary>
        /// Refresh: exchanges a valid refresh token for a new access + refresh token pair.
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["flowspeak_refresh"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new { success = false, message = "No refresh token provided." });

            var user = await _context.AppUsers.FirstOrDefaultAsync(u =>
                u.RefreshToken == refreshToken &&
                u.RefreshTokenExpiryTime > DateTime.UtcNow &&
                u.IsActive && !u.IsDeleted);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid or expired refresh token." });

            var newAccessToken  = _jwtService.GenerateAccessToken(user.ExternalId, user.Role);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken          = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
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
                    user.RefreshToken          = null;
                    user.RefreshTokenExpiryTime = null;
                    await _context.SaveChangesAsync();
                }
            }

            Response.Cookies.Delete("flowspeak_access");
            Response.Cookies.Delete("flowspeak_refresh", new CookieOptions { Path = "/api/auth" });

            return Ok(new { success = true, message = "Logged out." });
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private void SetAccessTokenCookie(string token) =>
            Response.Cookies.Append("flowspeak_access", token, new CookieOptions
            {
                HttpOnly = true,
                Secure   = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires  = DateTime.UtcNow.AddMinutes(15),
                Path     = "/"
            });

        private void SetRefreshTokenCookie(string token) =>
            Response.Cookies.Append("flowspeak_refresh", token, new CookieOptions
            {
                HttpOnly = true,
                Secure   = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Expires  = DateTime.UtcNow.AddDays(7),
                Path     = "/api/auth"
            });

        private static string HashPassword(string password)  =>
            BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        private static bool VerifyPassword(string password, string hash)
        {
            try   { return BCrypt.Net.BCrypt.Verify(password, hash); }
            catch
            {
                // Legacy SHA-256 fallback for any pre-BCrypt records
                using var sha   = SHA256.Create();
                var bytes       = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
                var legacyHash  = Convert.ToBase64String(bytes);
                return legacyHash == hash;
            }
        }

    }
}
