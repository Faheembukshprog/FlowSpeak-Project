using System;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    public class SearchProductsHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "SEARCH_PRODUCTS";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales", "Viewer" };

        public SearchProductsHandler(ApplicationDbContext context, Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var searchTerm = request.Entity ?? "";

            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                // If no search term, return all products
                var allProducts = await _context.Products
                    .Where(p => !p.IsDeleted)
                    .OrderByDescending(p => p.StockQuantity)
                    .Take(20)
                    .ToListAsync();

                if (!allProducts.Any())
                {
                    return new ActionResponse
                    {
                        Success = true,
                        Message = "No products currently available.",
                        Data = new { products = new object[0] }
                    };
                }

                var allProductSummaries = allProducts.Select(p => new
                {
                    name = p.Name,
                    sku = p.SKU,
                    price = p.Price,
                    stockQuantity = p.StockQuantity,
                    available = p.StockQuantity > 0
                }).ToList();

                return new ActionResponse
                {
                    Success = true,
                    Message = $"Found {allProducts.Count} products available.",
                    Data = new { products = allProductSummaries }
                };
            }

            // Search by name or SKU
            var searchLower = searchTerm.ToLower();
            var matchedProducts = await _context.Products
                .Where(p => !p.IsDeleted && 
                    (p.Name.ToLower().Contains(searchLower) || p.SKU.ToLower().Contains(searchLower)))
                .OrderByDescending(p => p.StockQuantity)
                .Take(10)
                .ToListAsync();

            if (!matchedProducts.Any())
            {
                return new ActionResponse
                {
                    Success = true,
                    Message = $"No products found matching '{searchTerm}'. Try a different search term.",
                    Data = new { products = new object[0] }
                };
            }

            var productSummaries = matchedProducts.Select(p => new
            {
                name = p.Name,
                sku = p.SKU,
                price = p.Price,
                stockQuantity = p.StockQuantity,
                available = p.StockQuantity > 0
            }).ToList();

            var message = $"Found {matchedProducts.Count} product(s) matching '{searchTerm}'.";
            _telemetryChannel.Writer.TryWrite(new TelemetryMessage
            {
                EventType = "PRODUCT_SEARCH",
                Entity = searchTerm,
                Intent = IntentName,
                Payload = message
            });

            return new ActionResponse
            {
                Success = true,
                Message = message,
                Data = new { products = productSummaries }
            };
        }
    }
}
