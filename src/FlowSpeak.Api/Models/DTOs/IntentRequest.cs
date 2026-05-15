namespace FlowSpeak.Api.Models.DTOs
{
    public class IntentRequest
    {
        public string Intent { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public Dictionary<string, string> Parameters { get; set; } = new();
    }
}
