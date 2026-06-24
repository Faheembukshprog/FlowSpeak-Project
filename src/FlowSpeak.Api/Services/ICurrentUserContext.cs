using System.Threading.Tasks;
using FlowSpeak.Api.Models;

namespace FlowSpeak.Api.Services
{
    /// <summary>
    /// Centralized service that resolves the currently authenticated AppUser
    /// by reading the 'sub' claim from the current HTTP request.
    /// Prevents duplicating IHttpContextAccessor + DB claim-parsing logic
    /// across multiple intent handlers.
    /// </summary>
    public interface ICurrentUserContext
    {
        Task<AppUser?> GetCurrentUserAsync();
    }
}
