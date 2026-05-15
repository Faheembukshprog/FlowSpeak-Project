using System.ComponentModel.DataAnnotations;

namespace FlowSpeak.Api.Models
{
    /// <summary>
    /// Immutable audit trail for every intent processed by the AI action layer.
    /// Append-only — never update or hard-delete rows from this table.
    /// No FK constraints by design: survives schema refactors over a 20-year lifespan.
    /// </summary>
    public class AiCommandLog : BaseEntity
    {
        /// <summary>Intent name as received from n8n / Groq (e.g. "CHECK_STOCK").</summary>
        [Required]
        [MaxLength(100)]
        public string Intent { get; set; } = string.Empty;

        /// <summary>The spoken entity resolved by the AI (e.g. "Dell XPS 15").</summary>
        [MaxLength(200)]
        public string? Entity { get; set; }

        /// <summary>Full raw JSON payload received from n8n / Groq.</summary>
        public string? RawPayload { get; set; }

        /// <summary>Full JSON payload returned by this API to n8n.</summary>
        public string? ResponsePayload { get; set; }

        /// <summary>Phone number of the caller — links loosely to AppUser.PhoneNumber.</summary>
        [MaxLength(50)]
        public string? CallerPhone { get; set; }

        /// <summary>Whether the intent was processed successfully.</summary>
        public bool WasSuccessful { get; set; } = true;

        /// <summary>Error message captured if WasSuccessful is false.</summary>
        [MaxLength(1000)]
        public string? ErrorMessage { get; set; }

        /// <summary>UTC timestamp the intent was processed by the API (set at insert time).</summary>
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    }
}
