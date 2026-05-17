using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetProductBySearchAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return new List<Product>();

            var lowerSearchTerm = searchTerm.ToLower();

            // Global query filters in ApplicationDbContext automatically ensure we only query IsDeleted == false.
            return await _context.Products
                .Where(p => p.Name.ToLower().Contains(lowerSearchTerm) || 
                            p.SKU.ToLower().Contains(lowerSearchTerm) || 
                            (p.SearchVector != null && p.SearchVector.ToLower().Contains(lowerSearchTerm)))
                .ToListAsync();
        }
    }
}
