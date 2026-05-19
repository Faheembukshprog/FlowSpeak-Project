using System;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FlowSpeak.Api.Hubs;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Api.Services.Telemetry
{
    public class TelemetryProcessingEngine : BackgroundService
    {
        private readonly Channel<TelemetryMessage> _inboundQueue;
        private readonly IHubContext<TelemetryHub, ITelemetryClient> _hubContext;
        private readonly ILogger<TelemetryProcessingEngine> _logger;

        public TelemetryProcessingEngine(
            Channel<TelemetryMessage> inboundQueue, 
            IHubContext<TelemetryHub, ITelemetryClient> hubContext,
            ILogger<TelemetryProcessingEngine> logger)
        {
            _inboundQueue = inboundQueue;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Telemetry Processing Engine started.");

            // Await telemetry arrival natively without polling loops or thread blockages
            await foreach (var currentTick in _inboundQueue.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    // Push message directly down the WebSockets pipe 
                    await _hubContext.Clients.All.ReceiveTelemetryMetrics(currentTick);
                }
                catch (OperationCanceledException)
                {
                    // Clean system shutdown signal caught safely
                    break;
                }
                catch (Exception ex)
                {
                    // Safeguard the application from crashing by handling parsing exceptions internally
                    _logger.LogError(ex, "Error processing telemetry tick.");
                }
            }

            _logger.LogInformation("Telemetry Processing Engine stopped.");
        }
    }
}
