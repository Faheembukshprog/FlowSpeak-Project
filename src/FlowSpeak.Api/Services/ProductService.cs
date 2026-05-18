using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetProductBySearchAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return new List<Product>();

            // 1. INPUT CLEANING: Strip out accidental single or double quotes, and escape SQL wildcards
            var cleanSearchTerm = searchTerm.Replace("'", "").Replace("\"", "").Trim();
            var escapedTerm = cleanSearchTerm.Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
            
            // 2. BACKEND SAFETY: Use parameterized wildcards for SQL LIKE comparison
            var wildcardSearch = $"%{escapedTerm}%";

            // 3. EDGE CASES & TELEMETRY OUTPUT: 
            // Explicitly verify IsDeleted == false (0) and project only the required telemetry fields
            var products = await _context.Products
                .Where(p => p.IsDeleted == false && 
                            (EF.Functions.Like(p.Name, wildcardSearch) || 
                             EF.Functions.Like(p.SKU, wildcardSearch) || 
                             (p.SearchVector != null && EF.Functions.Like(p.SearchVector, wildcardSearch))))
                .ToListAsync();

            // Map into a clean model structure for the frontend JSON telemetry
            return products.Select(p => new Product
            {
                // Only mapping necessary fields as requested
                Name = p.Name,
                SKU = p.SKU,
                Price = p.Price,
                StockQuantity = p.StockQuantity
            }).ToList();
        }
    }
}
