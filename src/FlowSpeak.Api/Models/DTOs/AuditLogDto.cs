namespace FlowSpeak.Api.Models.DTOs
{
    public class AuditLogDto
    {
        public Guid   ExternalId    { get; set; }
        public string Intent        { get; set; } = string.Empty;
        public string? Entity       { get; set; }
        public bool   WasSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime ProcessedAt { get; set; }
    }
}
