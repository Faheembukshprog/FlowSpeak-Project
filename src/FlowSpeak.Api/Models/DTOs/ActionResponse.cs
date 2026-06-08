namespace FlowSpeak.Api.Models.DTOs
{
    /// <summary>
    /// Structured response envelope for all intent execution results.
    /// </summary>
    public class ActionResponse
    {
        public bool   Success   { get; set; }
        public string Message   { get; set; } = string.Empty;
        public object? Data     { get; set; }
        public string Intent    { get; set; } = string.Empty;

        // ── Structured error fields ──────────────────────────────
        /// <summary>
        /// Machine-readable error code for client-side handling.
        /// Null on success.
        /// </summary>
        public string? ErrorCode  { get; set; }

        /// <summary>
        /// Correlation ID matching the ASP.NET Core trace identifier,
        /// allowing logs to be looked up by clients.
        /// </summary>
        public string? TraceId    { get; set; }

        /// <summary>
        /// UTC timestamp of the response — useful for audit and replay.
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // ── Factory helpers ──────────────────────────────────────
        public static ActionResponse Fail(
            string message,
            string errorCode,
            string? traceId  = null,
            string  intent   = "UNKNOWN_INTENT") => new()
        {
            Success   = false,
            Message   = message,
            ErrorCode = errorCode,
            TraceId   = traceId,
            Intent    = intent,
            Timestamp = DateTime.UtcNow
        };

        public static ActionResponse Ok(
            string  message,
            object? data   = null,
            string  intent = "") => new()
        {
            Success   = true,
            Message   = message,
            Data      = data,
            Intent    = intent,
            Timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Canonical error codes returned in ActionResponse.ErrorCode.
    /// </summary>
    public static class ErrorCodes
    {
        public const string EmptyInput      = "EMPTY_INPUT";
        public const string ValidationError = "VALIDATION_ERROR";
        public const string IntentUnknown   = "INTENT_UNKNOWN";
        public const string DispatchFailed  = "DISPATCH_FAILED";
        public const string AiFailure       = "AI_FAILURE";
        public const string ServerError     = "SERVER_ERROR";
        public const string RateLimited     = "RATE_LIMITED";
        public const string Forbidden       = "FORBIDDEN";
    }
}
