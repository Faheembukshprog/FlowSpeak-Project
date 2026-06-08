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
    public class CancelOrderHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "CANCEL_ORDER";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales" };

        public CancelOrderHandler(ApplicationDbContext context, Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var orderNumber = request.Entity;
            if (string.IsNullOrWhiteSpace(orderNumber) && request.Parameters != null && request.Parameters.ContainsKey("orderNumber"))
            {
                orderNumber = request.Parameters["orderNumber"];
            }

            if (string.IsNullOrWhiteSpace(orderNumber))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "No order number specified in the request to cancel.",
                    Data = null
                };
            }

            orderNumber = orderNumber.Trim();

            // Run database updates inside a serializable transaction for atomic safety
            await using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                var order = await _context.Orders
                    .Include(o => o.Items)
                    .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber || o.ExternalId.ToString() == orderNumber);

                if (order == null)
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Could not locate order matching '{orderNumber}' to cancel.",
                        Data = null
                    };
                }

                if (order.Status.Equals("CANCELLED", StringComparison.OrdinalIgnoreCase))
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Order {order.OrderNumber} is already cancelled.",
                        Data = null
                    };
                }

                // Restore stock for all products in the order
                foreach (var item in order.Items)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        product.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Update order status
                order.Status = "CANCELLED";
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var message = $"Order {order.OrderNumber} has been successfully cancelled and stock has been restored.";
                
                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "ORDER_CANCELLED",
                    Entity = order.OrderNumber,
                    Intent = IntentName,
                    Payload = message
                });

                return new ActionResponse
                {
                    Success = true,
                    Message = message,
                    Data = new
                    {
                        orderNumber = order.OrderNumber,
                        status = order.Status,
                        totalAmount = order.TotalAmount
                    }
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ActionResponse
                {
                    Success = false,
                    Message = $"An error occurred while canceling order: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
