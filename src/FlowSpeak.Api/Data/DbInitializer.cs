using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Data
{
    /// <summary>
    /// Seeds the database with foundational reference data and sample records.
    /// Called once at startup if the target tables are empty.
    /// Safe to run repeatedly — all checks are idempotent.
    /// </summary>
    public static class DbInitializer
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Ensure the database and all pending migrations are applied
            await context.Database.MigrateAsync();

            await SeedLookupStatusesAsync(context);
            await SeedUsersAsync(context);
            await SeedProductsAsync(context);
        }

        // ── Lookup Statuses ───────────────────────────────────────────────────────
        private static async Task SeedLookupStatusesAsync(ApplicationDbContext context)
        {
            if (await context.LookupStatuses.AnyAsync()) return;

            var statuses = new List<LookupStatus>
            {
                new() { Code = "SALE_COMPLETED",  DisplayName = "Sale Completed",  Description = "Transaction successfully recorded." },
                new() { Code = "SALE_REFUNDED",   DisplayName = "Sale Refunded",   Description = "Transaction reversed by manager." },
                new() { Code = "SALE_PENDING",    DisplayName = "Sale Pending",    Description = "Awaiting confirmation from caller." },
                new() { Code = "STOCK_LOW",       DisplayName = "Stock Low",       Description = "Product quantity below threshold." },
                new() { Code = "STOCK_CRITICAL",  DisplayName = "Stock Critical",  Description = "Product quantity is zero or near zero." },
            };

            await context.LookupStatuses.AddRangeAsync(statuses);
            await context.SaveChangesAsync();
        }

        // ── Users ─────────────────────────────────────────────────────────────────
        private static async Task SeedUsersAsync(ApplicationDbContext context)
        {
            if (await context.AppUsers.AnyAsync()) return;

            var users = new List<AppUser>
            {
                new()
                {
                    PhoneNumber = "+923001234567",
                    FullName    = "Admin User",
                    Role        = "Admin",
                    IsActive    = true
                },
                new()
                {
                    PhoneNumber = "+923009876543",
                    FullName    = "Sales Rep One",
                    Role        = "Sales",
                    IsActive    = true
                }
            };

            await context.AppUsers.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }

        // ── Products ──────────────────────────────────────────────────────────────
        private static async Task SeedProductsAsync(ApplicationDbContext context)
        {
            if (await context.Products.AnyAsync()) return;

            var products = new List<Product>
            {
                new()
                {
                    Name          = "Dell XPS 15 Laptop",
                    SKU           = "DELL-XPS15-001",
                    Price         = 249999.00m,
                    StockQuantity = 12,
                    SearchVector  = "dell xps laptop 15 ultrabook",
                    Metadata      = """{"brand":"Dell","category":"Laptop","warranty_years":2,"color":"Silver"}"""
                },
                new()
                {
                    Name          = "HP EliteBook 840 G10",
                    SKU           = "HP-ELT840-G10",
                    Price         = 189000.00m,
                    StockQuantity = 8,
                    SearchVector  = "hp elitebook 840 business laptop",
                    Metadata      = """{"brand":"HP","category":"Laptop","warranty_years":3,"color":"Silver"}"""
                },
                new()
                {
                    Name          = "Logitech MX Master 3S Mouse",
                    SKU           = "LGT-MXMS-3S",
                    Price         = 18500.00m,
                    StockQuantity = 34,
                    SearchVector  = "logitech mx master mouse wireless",
                    Metadata      = """{"brand":"Logitech","category":"Peripheral","connectivity":"Bluetooth/USB","color":"Graphite"}"""
                },
                new()
                {
                    Name          = "Samsung 27\" QHD Monitor",
                    SKU           = "SAM-MON27-QHD",
                    Price         = 67000.00m,
                    StockQuantity = 5,
                    SearchVector  = "samsung monitor 27 inch qhd display",
                    Metadata      = """{"brand":"Samsung","category":"Monitor","resolution":"2560x1440","panel":"IPS","refresh_hz":165}"""
                },
                new()
                {
                    Name          = "Keychron K2 Mechanical Keyboard",
                    SKU           = "KEY-K2-RGB",
                    Price         = 14500.00m,
                    StockQuantity = 20,
                    SearchVector  = "keychron k2 keyboard mechanical rgb wireless",
                    Metadata      = """{"brand":"Keychron","category":"Peripheral","switch_type":"Red","layout":"75%","backlight":"RGB"}"""
                },
                new()
                {
                    Name          = "WD 1TB External SSD",
                    SKU           = "WD-SSD1TB-EXT",
                    Price         = 27000.00m,
                    StockQuantity = 0,
                    SearchVector  = "western digital wd ssd external 1tb portable",
                    Metadata      = """{"brand":"WD","category":"Storage","capacity_gb":1000,"interface":"USB-C","read_mbps":1050}"""
                },
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }
    }
}
