using System.Collections.Generic;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Api.Services.Intent
{
    public interface IIntentHandler
    {
        string IntentName { get; }
        IReadOnlyList<string> AllowedRoles { get; }
        Task<ActionResponse> HandleAsync(IntentRequest request);
    }
}
