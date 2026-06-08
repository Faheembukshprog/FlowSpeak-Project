using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FlowSpeak.Api.Services.Auth
{
    public interface IJwtService
    {
        string GenerateAccessToken(Guid userExternalId, string role);
        string GenerateRefreshToken();
        ClaimsPrincipal? ValidateAccessToken(string token);
    }

    /// <summary>
    /// JWT Service implementing a secure dual-token architecture.
    /// 
    /// SECURITY DECISIONS (Mapped to Mistake Avoidance):
    /// - Mistake #1: Access tokens live 15 minutes. Refresh tokens live 7 days and are stored in DB.
    /// - Mistake #2: Only ExternalId (Guid) and Role are in the payload. No email, no password, no DB ID.
    /// - Mistake #4: Key must be at least 256 bits (32+ chars). Enforced at startup.
    /// - Mistake #5: Only HmacSha256 is allowed. "none" algorithm is blocked.
    /// </summary>
    public class JwtService : IJwtService
    {
        private const string DevFallbackSecret = "CHANGE-ME-FlowSpeak-256bit-Secret-Key!!";

        private readonly byte[] _keyBytes;
        private readonly string _issuer;
        private readonly string _audience;

        public static string ResolveSecret(IConfiguration config)
        {
            var secret = config["JWT_SECRET"] ?? config["Jwt:Secret"];
            if (IsUsableSecret(secret)) return secret!;

            var env = config["ASPNETCORE_ENVIRONMENT"]
                   ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                   ?? "Production";
            if (env.Equals("Development", StringComparison.OrdinalIgnoreCase))
                return DevFallbackSecret;

            throw new InvalidOperationException(
                "JWT_SECRET must be at least 32 characters (256 bits) for HMAC-SHA256. " +
                "Set JWT_SECRET via environment variable or user secrets.");
        }

        private static bool IsUsableSecret(string? secret) =>
            !string.IsNullOrWhiteSpace(secret)
            && secret.Length >= 32
            && !secret.StartsWith("SET_VIA_", StringComparison.OrdinalIgnoreCase);

        public JwtService(IConfiguration config)
        {
            var secret = ResolveSecret(config);
            _keyBytes = Encoding.UTF8.GetBytes(secret);
            _issuer = config["Jwt:Issuer"] ?? "FlowSpeak.Api";
            _audience = config["Jwt:Audience"] ?? "FlowSpeak.Client";
        }

        /// <summary>
        /// Generates a short-lived access token (15 minutes).
        /// Payload contains ONLY: ExternalId (Guid) + Role. No PII.
        /// </summary>
        public string GenerateAccessToken(Guid userExternalId, string role)
        {
            var key = new SymmetricSecurityKey(_keyBytes);
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Mistake #2 Avoided: Only non-sensitive identifiers in the payload.
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userExternalId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // Mistake #1 Avoided: 15-minute expiry, not weeks.
            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Generates a cryptographically secure refresh token (random string).
        /// This is stored in the database, NOT in the JWT payload.
        /// </summary>
        public string GenerateRefreshToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Validates an access token. Returns claims if valid, null if not.
        /// </summary>
        public ClaimsPrincipal? ValidateAccessToken(string token)
        {
            var handler = new JwtSecurityTokenHandler();
            try
            {
                var principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = new SymmetricSecurityKey(_keyBytes),
                    // Mistake #5 Avoided: Only allow HMAC-SHA256.
                    ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
                    // Mistake #6 Avoided: Zero clock skew — expired means expired.
                    ClockSkew = TimeSpan.Zero,
                }, out _);
                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
