using System;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    public class RequestQuoteHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "REQUEST_QUOTE";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales" };

        public RequestQuoteHandler(ApplicationDbContext context, Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var productName = request.Entity;

            if (string.IsNullOrWhiteSpace(productName))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "Please specify which product you'd like a quote for.",
                    Data = null
                };
            }

            int quantity = 100; // Default bulk quantity
            if (request.Parameters != null && request.Parameters.ContainsKey("quantity"))
            {
                if (int.TryParse(request.Parameters["quantity"], out int parsedQty))
                {
                    quantity = Math.Max(10, parsedQty); // Minimum 10 for bulk pricing
                }
            }

            try
            {
                var searchLower = productName.ToLower();
                var products = await _context.Products
                    .Where(p => !p.IsDeleted && 
                         (p.Name.ToLower().Contains(searchLower) || p.SKU.ToLower().Contains(searchLower)))
                    .ToListAsync();

                var product = products.FirstOrDefault();

                if (product == null)
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Could not find product '{productName}' for quote.",
                        Data = null
                    };
                }

                // Calculate bulk pricing (10% discount for bulk orders)
                decimal unitPrice = product.Price;
                decimal discountedPrice = unitPrice * 0.9m; // 10% bulk discount
                decimal totalPrice = discountedPrice * quantity;
                decimal savings = (unitPrice * quantity) - totalPrice;

                var message = $"📊 Quote for {quantity} units of {product.Name}: ${totalPrice:F2} (${discountedPrice:F2}/unit, save ${savings:F2} with bulk discount).";
                
                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "QUOTE_REQUESTED",
                    Entity = product.Name,
                    Intent = IntentName,
                    Payload = message
                });

                return new ActionResponse
                {
                    Success = true,
                    Message = message,
                    Data = new
                    {
                        productName = product.Name,
                        sku = product.SKU,
                        quantity = quantity,
                        regularUnitPrice = unitPrice,
                        bulkUnitPrice = discountedPrice,
                        totalPrice = totalPrice,
                        totalSavings = savings,
                        discountPercentage = 10,
                        inStock = product.StockQuantity >= quantity,
                        availableStock = product.StockQuantity
                    }
                };
            }
            catch (Exception ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Could not generate quote: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
