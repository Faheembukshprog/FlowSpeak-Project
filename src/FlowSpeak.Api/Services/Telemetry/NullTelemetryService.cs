using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlowSpeak.Api.Services.Telemetry
{
    /// <summary>
    /// Minimal telemetry sink used for development. Replace with a Prometheus/OTel exporter in production.
    /// </summary>
    public class NullTelemetryService : ITelemetryService
    {
        public Task TrackMetricAsync(string name, double value, Dictionary<string, string>? tags = null)
        {
            // Lightweight console output for visibility during local development.
            Console.WriteLine($"[Telemetry] {name}={value} tags={(tags == null ? "none" : string.Join(',', tags))}");
            return Task.CompletedTask;
        }
    }
}
