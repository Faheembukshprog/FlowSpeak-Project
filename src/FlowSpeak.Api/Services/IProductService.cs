using FlowSpeak.Api.Models;

namespace FlowSpeak.Api.Services
{
    public interface IProductService
    {
        Task<List<Product>> GetProductBySearchAsync(string searchTerm);
        Task<Product?> ReserveStockAsync(string searchTerm, int quantity);
    }
}
