using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpeak.Api.Models
{
    public class SalesLog : BaseEntity
    {
        public long ProductId { get; set; }
        
        [ForeignKey(nameof(ProductId))]
        public virtual Product Product { get; set; } = null!;

        public int QuantitySold { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(50)]
        public string SoldByPhoneNumber { get; set; } = string.Empty; // Links loosely to AppUser.PhoneNumber
        
        // Optional direct relation to User if needed later
        public long? AppUserId { get; set; }
        [ForeignKey(nameof(AppUserId))]
        public virtual AppUser? AppUser { get; set; }

        // Links to a lookup table for status/type (e.g., 'Completed', 'Refunded')
        public long? TransactionStatusId { get; set; }
        [ForeignKey(nameof(TransactionStatusId))]
        public virtual LookupStatus? TransactionStatus { get; set; }
    }
}
