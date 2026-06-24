using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpeak.Api.Models
{
    public class Order : BaseEntity
    {
        /// <summary>
        /// Human-readable order number (e.g., "FS-20260519-001").
        /// </summary>
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        /// <summary>
        /// Order status: PENDING, CONFIRMED, CANCELLED.
        /// </summary>
        [MaxLength(20)]
        public string Status { get; set; } = "PENDING";

        /// <summary>
        /// Total value of the order (sum of all line items).
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        /// <summary>
        /// The ExternalId (Guid) of the AppUser who placed this order.
        /// Stored as a Guid? FK so that deleting a user sets this to null
        /// rather than cascade-deleting all their orders.
        /// Null for any orders created before this feature was introduced.
        /// </summary>
        public Guid? RequestedByUserId { get; set; }

        /// <summary>
        /// Navigation property to the requesting user.
        /// May be null if the user has since been deleted or the order predates this column.
        /// </summary>
        public virtual AppUser? RequestedByUser { get; set; }

        /// <summary>
        /// Optional notes or context from the NLP interpretation.
        /// </summary>
        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation property
        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
