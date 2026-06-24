using System;
using System.Security.Claims;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services
{
    /// <summary>
    /// Reads the 'sub' JWT claim (user ExternalId) from the current HttpContext,
    /// then performs a single DB lookup to return the AppUser entity.
    /// Returns null gracefully if the claim is missing or no matching user exists.
    ///
    /// Future optimization: embed username/role directly in JWT claims to
    /// eliminate this DB round-trip per request.
    /// </summary>
    public class CurrentUserContext : ICurrentUserContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApplicationDbContext _context;

        public CurrentUserContext(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        public async Task<AppUser?> GetCurrentUserAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            var userExternalIdStr =
                httpContext.User?.FindFirst("sub")?.Value
                ?? httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userExternalIdStr, out var externalId))
                return null;

            // EF Core's global soft-delete query filter on AppUser is applied automatically
            return await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ExternalId == externalId);
        }
    }
}
