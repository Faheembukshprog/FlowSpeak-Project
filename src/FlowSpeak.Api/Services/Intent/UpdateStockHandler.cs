using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Channels;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    public class UpdateStockHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductLookupService _productLookupService;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "UPDATE_STOCK";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin" };

        public UpdateStockHandler(
            ApplicationDbContext context,
            IProductLookupService productLookupService,
            Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _productLookupService = productLookupService;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var searchTerm = request.Entity;
            if (string.IsNullOrWhiteSpace(searchTerm) && request.Parameters != null && request.Parameters.ContainsKey("productName"))
            {
                searchTerm = request.Parameters["productName"];
            }

            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "No product name or SKU specified to update stock.",
                    Data = null
                };
            }

            int quantity = 0;
            bool qtyFound = false;

            if (request.Parameters != null)
            {
                // Try different common keys for quantity/stock
                var keys = new[] { "quantity", "stock", "stockQuantity", "value", "count" };
                foreach (var key in keys)
                {
                    if (request.Parameters.ContainsKey(key) && int.TryParse(request.Parameters[key], out int parsedQty))
                    {
                        quantity = parsedQty;
                        qtyFound = true;
                        break;
                    }
                }
            }

            if (!qtyFound)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "No valid stock quantity specified in parameters.",
                    Data = null
                };
            }

            // Find product using lookup service (handles fuzzy name/SKU lookup)
            var product = await _productLookupService.FindProductAsync(searchTerm);

            if (product == null)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Could not locate a product matching '{searchTerm}' to update.",
                    Data = null
                };
            }

            // Enforce non-negative stock quantity
            if (quantity < 0)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "Stock quantity cannot be negative.",
                    Data = null
                };
            }

            var oldStock = product.StockQuantity;
            product.StockQuantity = quantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var message = $"Stock updated for {product.Name} (SKU: {product.SKU}) from {oldStock} to {quantity}.";

            _telemetryChannel.Writer.TryWrite(new TelemetryMessage
            {
                EventType = "STOCK_UPDATED",
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
                    productSKU = product.SKU,
                    oldStock = oldStock,
                    newStock = product.StockQuantity
                }
            };
        }
    }
}
