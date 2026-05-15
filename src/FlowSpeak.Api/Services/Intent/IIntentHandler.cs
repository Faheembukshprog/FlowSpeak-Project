using FlowSpeak.Api.Models.DTOs;
using System.Threading.Tasks;

namespace FlowSpeak.Api.Services.Intent
{
    public interface IIntentHandler
    {
        string IntentName { get; }
        Task<ActionResponse> HandleAsync(IntentRequest request);
    }
}
