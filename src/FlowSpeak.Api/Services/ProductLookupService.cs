using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace FlowSpeak.Api.Services
{
    public interface IProductLookupService
    {
        Task<Product?> FindProductAsync(string searchTerm);
    }

    public class ProductLookupService : IProductLookupService
    {
        private readonly ApplicationDbContext _context;

        public ProductLookupService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Product?> FindProductAsync(string searchTerm)
        {
            var cleanedTerm = searchTerm.Replace("\"", "").Trim();
            var escapedTerm = cleanedTerm
                .Replace("[", "[[]")
                .Replace("%", "[%]")
                .Replace("_", "[_]");

            return await _context.Products
                .Where(p => p.IsDeleted == false &&
                            (EF.Functions.Like(p.Name, $"%{escapedTerm}%") ||
                             EF.Functions.Like(p.SKU, $"%{escapedTerm}%") ||
                             (p.SearchVector != null && EF.Functions.Like(p.SearchVector, $"%{escapedTerm}%"))))
                .FirstOrDefaultAsync();
        }
    }
}
