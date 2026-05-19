using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FlowSpeak.Api.Hubs
{
    // Restrict hub access to authenticated users
    [Authorize]
    public class TelemetryHub : Hub<ITelemetryClient>
    {
        // Hub remains entirely stateless.
        // Connection events can be overridden here if needed for logging.
    }
}
