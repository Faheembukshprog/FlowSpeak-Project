using System.ComponentModel.DataAnnotations;

namespace FlowSpeak.Api.Models
{
    public class AppUser : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string PhoneNumber { get; set; } = string.Empty; // Maps to Telegram/WhatsApp ID
        
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string Role { get; set; } = "User"; // e.g., Admin, Manager, Sales
        
        public bool IsActive { get; set; } = true;
        
        // Example Navigation to represent logs sold by this user
        public virtual ICollection<SalesLog> SalesLogs { get; set; } = new List<SalesLog>();
    }
}
