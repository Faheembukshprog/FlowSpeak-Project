namespace FlowSpeak.Api.Models.DTOs
{
    /// <summary>
    /// RFC 7807-aligned problem detail envelope used by the global
    /// exception handler and rate-limit rejection responses.
    /// </summary>
    public class ApiProblem
    {
        public string  Type     { get; set; } = "about:blank";
        public string  Title    { get; set; } = string.Empty;
        public int     Status   { get; set; }
        public string  Detail   { get; set; } = string.Empty;
        public string? TraceId  { get; set; }
        public string? Code     { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
