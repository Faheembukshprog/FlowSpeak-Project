using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using System.Threading.Channels;

namespace FlowSpeak.Api.Services.Intent
{
    public class CheckStockHandler : IIntentHandler
    {
        private readonly IProductService _productService;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "CHECK_STOCK";

        public CheckStockHandler(IProductService productService, Channel<TelemetryMessage> telemetryChannel)
        {
            _productService = productService;
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
                    Message = "No product name or entity specified in the request.",
                    Data = null
                };
            }

            // Perform case-insensitive database lookup
            var products = await _productService.GetProductBySearchAsync(searchTerm);
            
            if (products == null || !products.Any())
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Could not locate a product matching '{searchTerm}' in our current inventory.",
                    Data = null
                };
            }

            // Get the first matching product
            var matchedProduct = products.First();

            // Check stock status
            if (matchedProduct.StockQuantity > 0)
            {
                var message = $"Yes, we have {matchedProduct.StockQuantity} units of {matchedProduct.Name} available (SKU: {matchedProduct.SKU}).";
                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "STOCK_CHECK",
                    Entity = matchedProduct.Name,
                    Intent = IntentName,
                    Payload = message
                });

                return new ActionResponse
                {
                    Success = true,
                    Message = message,
                    Data = new[] { matchedProduct }
                };
            }
            else
            {
                var message = $"Sorry, {matchedProduct.Name} is currently out of stock.";
                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "STOCK_CHECK_FAILED",
                    Entity = matchedProduct.Name,
                    Intent = IntentName,
                    Status = "FAILED",
                    Payload = message
                });

                return new ActionResponse
                {
                    Success = false,
                    Message = message,
                    Data = null
                };
            }
        }
    }
}
