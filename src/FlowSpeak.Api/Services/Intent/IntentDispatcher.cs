using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services.Telemetry;

namespace FlowSpeak.Api.Services.Intent
{
    public class IntentDispatcher : IIntentDispatcher
    {
        private readonly Dictionary<string, IIntentHandler> _handlers;
        private readonly ITelemetryService _telemetry;

        public IntentDispatcher(IEnumerable<IIntentHandler> handlers, ITelemetryService telemetry)
        {
            _handlers = handlers?.ToDictionary(h => h.IntentName.ToUpperInvariant())
                        ?? new Dictionary<string, IIntentHandler>();
            _telemetry = telemetry;
        }

        public async Task<ActionResponse> DispatchAsync(IntentRequest request)
        {
            var intent = (request.Intent ?? "UNKNOWN").ToUpperInvariant();

            if (!_handlers.TryGetValue(intent, out var handler))
            {
                await _telemetry.TrackMetricAsync("intent_dispatch.unknown", 1, new Dictionary<string, string> { { "intent", intent } });
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Unknown intent: {request.Intent}",
                    Data = null
                };
            }

            var sw = Stopwatch.StartNew();
            var response = await handler.HandleAsync(request);
            sw.Stop();

            await _telemetry.TrackMetricAsync("intent_dispatch.latency_ms", sw.Elapsed.TotalMilliseconds, new Dictionary<string, string> { { "intent", intent }, { "handler", handler.IntentName } });

            return response;
        }
    }
}
