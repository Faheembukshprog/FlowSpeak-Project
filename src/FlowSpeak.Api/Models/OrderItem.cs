using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlowSpeak.Api.Models
{
    public class OrderItem : BaseEntity
    {
        public long OrderId { get; set; }

        public long ProductId { get; set; }

        [MaxLength(200)]
        public string ProductName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ProductSKU { get; set; } = string.Empty;

        public int Quantity { get; set; }

        /// <summary>
        /// Price per unit at the time of order (snapshot — decoupled from live pricing).
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }

        // Navigation properties
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }
    }
}
