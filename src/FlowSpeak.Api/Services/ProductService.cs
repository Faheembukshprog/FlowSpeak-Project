using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlowSpeak.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductLookupService _productLookupService;
        private readonly ILogger<ProductService> _logger;

        public ProductService(ApplicationDbContext context, IProductLookupService productLookupService, ILogger<ProductService> logger)
        {
            _context = context;
            _productLookupService = productLookupService;
            _logger = logger;
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

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency conflict during stock reservation for {SKU}", product.SKU);
                throw new InvalidOperationException("Inventory was updated by another user. Please retry.", ex);
            }

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
