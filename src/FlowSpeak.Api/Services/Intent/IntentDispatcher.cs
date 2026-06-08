using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.Http;

namespace FlowSpeak.Api.Services.Intent
{
    public class IntentDispatcher : IIntentDispatcher
    {
        private readonly Dictionary<string, IIntentHandler> _handlers;
        private readonly ITelemetryService _telemetry;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public IntentDispatcher(
            IEnumerable<IIntentHandler> handlers, 
            ITelemetryService telemetry,
            IHttpContextAccessor httpContextAccessor)
        {
            _handlers = handlers?.ToDictionary(h => h.IntentName.ToUpperInvariant())
                        ?? new Dictionary<string, IIntentHandler>();
            _telemetry = telemetry;
            _httpContextAccessor = httpContextAccessor;
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

            // Enforce RBAC permission checks
            var httpContext = _httpContextAccessor.HttpContext;
            var user = httpContext?.User;
            var userRole = user?.FindFirst(ClaimTypes.Role)?.Value
                           ?? user?.FindFirst("role")?.Value;

            if (handler.AllowedRoles != null && handler.AllowedRoles.Count > 0)
            {
                if (string.IsNullOrEmpty(userRole) || !handler.AllowedRoles.Contains(userRole, StringComparer.OrdinalIgnoreCase))
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Access denied: Your role '{userRole ?? "Guest"}' is not authorized to execute command '{handler.IntentName}'.",
                        ErrorCode = "FORBIDDEN",
                        Data = null,
                        Intent = intent
                    };
                }
            }

            var sw = Stopwatch.StartNew();
            var response = await handler.HandleAsync(request);
            sw.Stop();

            await _telemetry.TrackMetricAsync("intent_dispatch.latency_ms", sw.Elapsed.TotalMilliseconds, new Dictionary<string, string> { { "intent", intent }, { "handler", handler.IntentName } });

            return response;
        }
    }
}
