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
        public static async Task SeedAsync(ApplicationDbContext context, IConfiguration configuration)
        {
            // Ensure the database and all pending migrations are applied
            await context.Database.MigrateAsync();

            await SeedLookupStatusesAsync(context);
            await SeedUsersAsync(context, configuration);
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
        private static async Task SeedUsersAsync(ApplicationDbContext context, IConfiguration configuration)
        {
            if (await context.AppUsers.AnyAsync()) return;

            var adminUsername = configuration["PROD_ADMIN_USERNAME"];
            var adminPassword = configuration["PROD_ADMIN_PASSWORD"];

            if (string.IsNullOrWhiteSpace(adminUsername) || string.IsNullOrWhiteSpace(adminPassword))
            {
                // Static demo accounts ('admin' and 'sales') have been removed for security.
                // Configure PROD_ADMIN_USERNAME and PROD_ADMIN_PASSWORD to seed the first admin.
                return;
            }

            var adminUser = new AppUser
            {
                Username = adminUsername.Trim(),
                FullName = "Initial Administrator",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, workFactor: 12),
                Role = "Admin",
                PhoneNumber = Guid.NewGuid().ToString(),
                IsActive = true
            };

            await context.AppUsers.AddAsync(adminUser);
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
                    Name          = "Dell XPS 15",
                    SKU           = "DELL-XPS15",
                    Price         = 249999.00m,
                    StockQuantity = 12,
                    SearchVector  = "dell xps 15 laptop ultrabook premium",
                    Metadata      = """{"brand":"Dell","category":"Laptop","warranty_years":2,"color":"Silver"}"""
                },
                new()
                {
                    Name          = "MacBook Pro 16",
                    SKU           = "MAC-MP16",
                    Price         = 349999.00m,
                    StockQuantity = 5,
                    SearchVector  = "macbook pro 16 inch apple laptop m-series",
                    Metadata      = """{"brand":"Apple","category":"Laptop","warranty_years":1,"color":"Space Gray"}"""
                },
                new()
                {
                    Name          = "ThinkPad X1 Carbon",
                    SKU           = "LENO-X1C",
                    Price         = 189000.00m,
                    StockQuantity = 0,
                    SearchVector  = "lenovo thinkpad x1 carbon business laptop",
                    Metadata      = """{"brand":"Lenovo","category":"Laptop","warranty_years":3,"color":"Black"}"""
                },
                new()
                {
                    Name          = "HP Spectre x360",
                    SKU           = "HP-SPEC360",
                    Price         = 219999.00m,
                    StockQuantity = 22,
                    SearchVector  = "hp spectre x360 convertible laptop touchscreen",
                    Metadata      = """{"brand":"HP","category":"Laptop","warranty_years":2,"color":"Nightfall Black"}"""
                },
                new()
                {
                    Name          = "FlowSpeak Master Widget",
                    SKU           = "FLOW-WDGT",
                    Price         = 99.99m,
                    StockQuantity = 150,
                    SearchVector  = "flowspeak widget master tool utility",
                    Metadata      = """{"brand":"FlowSpeak","category":"Accessory","warranty_years":1,"color":"White"}"""
                },
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }
    }
}
