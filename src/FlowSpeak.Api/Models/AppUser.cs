using System;
using System.ComponentModel.DataAnnotations;

namespace FlowSpeak.Api.Models
{
    public class AppUser : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// BCrypt-hashed password. Raw passwords are NEVER stored.
        /// </summary>
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>
        /// Role for RBAC: "Admin", "Sales", "Viewer".
        /// </summary>
        [MaxLength(20)]
        public string Role { get; set; } = "Viewer";

        public bool IsActive { get; set; } = true;

        // Phone kept for legacy compatibility
        [MaxLength(50)]
        public string PhoneNumber { get; set; } = string.Empty;

        // ── Dual-Token System (Mistake #1 Avoided) ──
        /// <summary>
        /// The current refresh token. Stored in DB so it can be revoked on logout.
        /// </summary>
        public string? RefreshToken { get; set; }

        /// <summary>
        /// When the refresh token expires (7 days from issue). Null when revoked on logout.
        /// </summary>
        public DateTime? RefreshTokenExpiryTime { get; set; }

        // Navigation
        public virtual ICollection<SalesLog> SalesLogs { get; set; } = new List<SalesLog>();
    }
}
