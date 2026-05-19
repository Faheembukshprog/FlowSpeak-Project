using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<SalesLog> SalesLogs { get; set; }
        public DbSet<LookupStatus> LookupStatuses { get; set; }
        public DbSet<AiCommandLog> AiCommandLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Global Filter for Soft Delete
            modelBuilder.Entity<AppUser>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Product>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Order>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<OrderItem>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<SalesLog>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<LookupStatus>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<AiCommandLog>().HasQueryFilter(x => !x.IsDeleted);

            // Indexes
            modelBuilder.Entity<AppUser>().HasIndex(u => u.PhoneNumber).IsUnique();
            modelBuilder.Entity<AppUser>().HasIndex(u => u.ExternalId).IsUnique();
            
            modelBuilder.Entity<Product>().HasIndex(p => p.ExternalId).IsUnique();
            modelBuilder.Entity<Product>().HasIndex(p => p.Name);
            
            modelBuilder.Entity<SalesLog>().HasIndex(s => s.ExternalId).IsUnique();
            
            modelBuilder.Entity<LookupStatus>().HasIndex(l => l.Code).IsUnique();
            modelBuilder.Entity<LookupStatus>().HasIndex(l => l.ExternalId).IsUnique();

            // Order indexes
            modelBuilder.Entity<Order>().HasIndex(o => o.ExternalId).IsUnique();
            modelBuilder.Entity<Order>().HasIndex(o => o.OrderNumber).IsUnique();
            modelBuilder.Entity<Order>().HasIndex(o => o.Status);
            modelBuilder.Entity<OrderItem>().HasIndex(oi => oi.ExternalId).IsUnique();

            // AiCommandLog — append-only audit table
            modelBuilder.Entity<AiCommandLog>().HasIndex(a => a.ExternalId).IsUnique();
            modelBuilder.Entity<AiCommandLog>().HasIndex(a => a.ProcessedAt);
            modelBuilder.Entity<AiCommandLog>().HasIndex(a => a.CallerPhone);
            modelBuilder.Entity<AiCommandLog>().HasIndex(a => a.Intent);
            modelBuilder.Entity<AiCommandLog>().ToTable("AI_CommandLogs");
        }
    }
}
