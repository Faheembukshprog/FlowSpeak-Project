using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Channels;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    public class AddProductHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "ADD_PRODUCT";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin" };

        public AddProductHandler(ApplicationDbContext context, Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var productName = request.Entity;
            if (string.IsNullOrWhiteSpace(productName) && request.Parameters != null && request.Parameters.ContainsKey("productName"))
            {
                productName = request.Parameters["productName"];
            }

            if (string.IsNullOrWhiteSpace(productName))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "No product name specified in the request to create.",
                    Data = null
                };
            }

            productName = productName.Trim();

            // Extract SKU, price, quantity
            string sku = string.Empty;
            decimal price = 0.0m;
            int stockQuantity = 0;

            if (request.Parameters != null)
            {
                if (request.Parameters.ContainsKey("sku"))
                {
                    sku = request.Parameters["sku"].Trim().ToUpper();
                }

                if (request.Parameters.ContainsKey("price") && decimal.TryParse(request.Parameters["price"], out decimal parsedPrice))
                {
                    price = parsedPrice;
                }

                var stockKeys = new[] { "quantity", "stock", "stockQuantity", "initialStock" };
                foreach (var key in stockKeys)
                {
                    if (request.Parameters.ContainsKey(key) && int.TryParse(request.Parameters[key], out int parsedQty))
                    {
                        stockQuantity = Math.Max(0, parsedQty);
                        break;
                    }
                }
            }

            // Generate SKU if missing
            if (string.IsNullOrWhiteSpace(sku))
            {
                var cleanedName = new string(productName.Where(char.IsLetterOrDigit).ToArray());
                var prefix = cleanedName.Length >= 4 ? cleanedName.Substring(0, 4).ToUpper() : cleanedName.ToUpper();
                var suffix = Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper();
                sku = $"{prefix}-{suffix}";
            }

            // Check if SKU already exists
            var existingProduct = await _context.Products.FirstOrDefaultAsync(p => p.SKU == sku);
            if (existingProduct != null)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"A product with SKU '{sku}' already exists ({existingProduct.Name}).",
                    Data = null
                };
            }

            // Validate price
            if (price <= 0)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "Price must be a positive number.",
                    Data = null
                };
            }

            var product = new Product
            {
                Name = productName,
                SKU = sku,
                Price = price,
                StockQuantity = stockQuantity,
                SearchVector = $"{productName.ToLower()} {sku.ToLower()} product",
                Metadata = "{}"
            };

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();

            var message = $"Successfully created product '{product.Name}' with SKU '{product.SKU}' at price ${product.Price:F2} and initial stock {product.StockQuantity}.";

            _telemetryChannel.Writer.TryWrite(new TelemetryMessage
            {
                EventType = "PRODUCT_CREATED",
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
                    price = product.Price,
                    stockQuantity = product.StockQuantity
                }
            };
        }
    }
}
