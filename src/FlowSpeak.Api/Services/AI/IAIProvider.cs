using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Api.Services.AI
{
    public interface IAIProvider
    {
        Task<IntentRequest> ExtractIntentFromTextAsync(string text);
        Task<IntentRequest> ExtractIntentFromAudioAsync(byte[] audio, string contentType);
    }
}
