using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Api.Hubs
{
    public interface ITelemetryClient
    {
        Task ReceiveTelemetryMetrics(TelemetryMessage message);
    }
}
