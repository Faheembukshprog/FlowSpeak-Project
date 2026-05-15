using System.Collections.Generic;
using System.Threading.Tasks;

namespace FlowSpeak.Api.Services.Telemetry
{
    public interface ITelemetryService
    {
        Task TrackMetricAsync(string name, double value, Dictionary<string, string>? tags = null);
    }
}
