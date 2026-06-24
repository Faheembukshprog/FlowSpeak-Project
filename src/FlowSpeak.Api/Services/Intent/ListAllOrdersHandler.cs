using System;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    /// <summary>
    /// Admin-only handler: returns the global recent-orders list.
    /// Triggered by phrases like "show all orders", "show every order".
    /// Viewers and Sales users cannot invoke this intent — the IntentDispatcher
    /// enforces AllowedRoles before calling HandleAsync, and the handler
    /// double-checks internally as a defence-in-depth measure.
    /// </summary>
    public class ListAllOrdersHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUser;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "LIST_ALL_ORDERS";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin" };

        public ListAllOrdersHandler(
            ApplicationDbContext context,
            ICurrentUserContext currentUser,
            Channel<TelemetryMessage> telemetryChannel)
        {
            _context = context;
            _currentUser = currentUser;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            try
            {
                // Defence-in-depth: do not rely on IntentDispatcher RBAC alone.
                var user = await _currentUser.GetCurrentUserAsync();
                if (user == null || !string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = "Access denied: only administrators may view the global order ledger.",
                        ErrorCode = ErrorCodes.Forbidden,
                        Data = null
                    };
                }

                var allOrders = await _context.Orders
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(20)
                    .Include(o => o.Items)
                    .Include(o => o.RequestedByUser)
                    .ToListAsync();

                if (!allOrders.Any())
                {
                    return new ActionResponse
                    {
                        Success = true,
                        Message = "No orders exist in the system yet.",
                        Data = new { orders = new object[0] }
                    };
                }

                var orderSummaries = allOrders.Select(o => new
                {
                    orderNumber = o.OrderNumber,
                    status = o.Status,
                    totalAmount = o.TotalAmount,
                    createdAt = o.CreatedAt,
                    requestedBy = o.RequestedByUser?.Username ?? "(legacy / unknown)",
                    items = o.Items.Select(i => new
                    {
                        productName = i.ProductName,
                        quantity = i.Quantity,
                        unitPrice = i.UnitPrice,
                        lineTotal = i.LineTotal
                    }).ToList()
                }).ToList();

                var message = $"Global order ledger: {allOrders.Count} recent order(s) across all users.";

                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "LIST_ALL_ORDERS",
                    Entity = $"{allOrders.Count} orders",
                    Intent = IntentName,
                    Payload = message
                });

                return new ActionResponse
                {
                    Success = true,
                    Message = message,
                    Data = new { orders = orderSummaries }
                };
            }
            catch (Exception ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Could not retrieve global order list: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
