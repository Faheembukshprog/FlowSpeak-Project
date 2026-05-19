using FlowSpeak.Api.Models;

namespace FlowSpeak.Api.Services
{
    public interface IOrderService
    {
        /// <summary>
        /// Creates a new order by reserving stock for a given product.
        /// Returns the created Order with its items, or null if the product was not found.
        /// Throws InvalidOperationException if insufficient stock.
        /// </summary>
        Task<Order?> CreateReservationOrderAsync(string searchTerm, int quantity);
    }
}
