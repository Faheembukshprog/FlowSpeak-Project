using System;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductLookupService _productLookupService;

        public OrderService(ApplicationDbContext context, IProductLookupService productLookupService)
        {
            _context = context;
            _productLookupService = productLookupService;
        }

        public async Task<Order?> CreateReservationOrderAsync(string searchTerm, int quantity)
        {
            if (string.IsNullOrWhiteSpace(searchTerm) || quantity <= 0)
                return null;

            // Start an explicit transaction to prevent race conditions during check-and-deduct
            await using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            try
            {
                var product = await _productLookupService.FindProductAsync(searchTerm);

                if (product == null)
                    return null;

                if (product.StockQuantity < quantity)
                {
                    throw new InvalidOperationException(
                        $"Cannot reserve {quantity} units. Only {product.StockQuantity} left in stock for {product.Name}.");
                }

                // Deduct stock
                product.StockQuantity -= quantity;
                product.UpdatedAt = DateTime.UtcNow;

                // Generate order number: FS-YYYYMMDD-GUID
                var today = DateTime.UtcNow.ToString("yyyyMMdd");
                var suffix = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
                var orderNumber = $"FS-{today}-{suffix}";

                var lineTotal = product.Price * quantity;

                var order = new Order
                {
                    OrderNumber = orderNumber,
                    Status = "PENDING",
                    TotalAmount = lineTotal,
                    Notes = $"Reserved via FlowSpeak Command Center"
                };

                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    ProductSKU = product.SKU,
                    Quantity = quantity,
                    UnitPrice = product.Price,
                    LineTotal = lineTotal
                };

                order.Items.Add(orderItem);

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();
                
                await transaction.CommitAsync();

                return order;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
