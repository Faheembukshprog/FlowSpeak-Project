using FlowSpeak.Api.Models.DTOs;
using System.Threading.Tasks;

namespace FlowSpeak.Api.Services.Intent
{
    public interface IIntentDispatcher
    {
        Task<ActionResponse> DispatchAsync(IntentRequest request);
    }
}
