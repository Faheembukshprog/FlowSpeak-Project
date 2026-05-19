using System;

namespace FlowSpeak.Api.Models.DTOs
{
    public class TelemetryMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string EventType { get; set; } = string.Empty; // "ORDER_CREATED", "STOCK_CHECK", "ERROR"
        public string Entity { get; set; } = string.Empty;
        public string Intent { get; set; } = string.Empty;
        public string Status { get; set; } = "SUCCESS";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public object? Payload { get; set; }
    }
}
