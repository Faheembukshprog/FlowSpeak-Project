using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpeak.Api.Models
{
    public class Product : BaseEntity
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int StockQuantity { get; set; }

        // JSON Metadata for NoSQL flexibility
        public string? Metadata { get; set; }

        // For fast voice-search lookups
        [MaxLength(500)]
        public string? SearchVector { get; set; }
        
        // Navigation properties with virtual modifier for lazy loading
        public virtual ICollection<SalesLog> SalesLogs { get; set; } = new List<SalesLog>();
    }
}
