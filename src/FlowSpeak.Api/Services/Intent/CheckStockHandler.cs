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

            var products = await _productService.GetProductBySearchAsync(searchTerm);

            if (products != null && products.Any())
            {
                return new ActionResponse
                {
                    Success = true,
                    Message = $"Found {products.Count} product(s) matching '{searchTerm}'.",
                    Data = products
                };
            }

            return new ActionResponse
            {
                Success = false,
                Message = "Sorry, I couldn't find that item in the inventory.",
                Data = null
            };
        }
    }
}
