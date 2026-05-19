using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductLookupService _productLookupService;

        public ProductService(ApplicationDbContext context, IProductLookupService productLookupService)
        {
            _context = context;
            _productLookupService = productLookupService;
        }

        public async Task<List<Product>> GetProductBySearchAsync(string searchTerm)
        {
            var product = await _productLookupService.FindProductAsync(searchTerm);
            if (product == null) return new List<Product>();

            return new List<Product>
            {
                new Product
                {
                    Name = product.Name,
                    SKU = product.SKU,
                    Price = product.Price,
                    StockQuantity = product.StockQuantity
                }
            };
        }
        public async Task<Product?> ReserveStockAsync(string searchTerm, int quantity)
        {
            if (string.IsNullOrWhiteSpace(searchTerm) || quantity <= 0)
                return null;

            var product = await _productLookupService.FindProductAsync(searchTerm);

            if (product == null)
                return null;

            // Business logic: enforce bounds
            if (product.StockQuantity < quantity)
            {
                throw new InvalidOperationException($"Cannot reserve {quantity} units. Only {product.StockQuantity} left in stock for {product.Name}.");
            }

            product.StockQuantity -= quantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Map to clean model structure for return
            return new Product
            {
                Name = product.Name,
                SKU = product.SKU,
                Price = product.Price,
                StockQuantity = product.StockQuantity
            };
        }
    }
}
