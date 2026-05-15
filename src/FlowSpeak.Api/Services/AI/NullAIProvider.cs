using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using System.Collections.Generic;

namespace FlowSpeak.Api.Services.AI
{
    /// <summary>
    /// A lightweight null implementation of <see cref="IAIProvider"/> used as a safe default during development.
    /// It does not call external services and returns a conservative UNKNOWN intent.
    /// </summary>
    public class NullAIProvider : IAIProvider
    {
        public Task<IntentRequest> ExtractIntentFromTextAsync(string text)
        {
            var req = new IntentRequest
            {
                Intent = "UNKNOWN",
                Entity = text ?? string.Empty,
                Parameters = new Dictionary<string, string>()
            };

            return Task.FromResult(req);
        }

        public Task<IntentRequest> ExtractIntentFromAudioAsync(byte[] audio, string contentType)
        {
            var req = new IntentRequest
            {
                Intent = "UNKNOWN",
                Entity = null,
                Parameters = new Dictionary<string, string>()
            };

            return Task.FromResult(req);
        }
    }
}
