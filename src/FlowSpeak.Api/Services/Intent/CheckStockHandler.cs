using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;

namespace FlowSpeak.Api.Services.Intent
{
    public class CheckStockHandler : IIntentHandler
    {
        private readonly IProductService _productService;

        public string IntentName => "CHECK_STOCK";

        public CheckStockHandler(IProductService productService)
        {
            _productService = productService;
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
                return new ActionResponse
                {
                    Success = true,
                    Message = $"Yes, we have {matchedProduct.StockQuantity} units of {matchedProduct.Name} available (SKU: {matchedProduct.SKU}).",
                    Data = new[] { matchedProduct }
                };
            }
            else
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Sorry, {matchedProduct.Name} is currently out of stock.",
                    Data = null
                };
            }
        }
    }
}
