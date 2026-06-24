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
    public class ListMyOrdersHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUser;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "LIST_MY_ORDERS";
        // All roles get access — filtering is always by the caller's own identity.
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales", "Viewer" };

        public ListMyOrdersHandler(
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
                var user = await _currentUser.GetCurrentUserAsync();

                if (user == null)
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = "Could not identify the current user. Please log in and try again.",
                        Data = null
                    };
                }

                // Always filter by caller's ExternalId, regardless of role.
                // Admins wanting the global list should use LIST_ALL_ORDERS.
                var myOrders = await _context.Orders
                    .Where(o => o.RequestedByUserId == user.ExternalId)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(10)
                    .Include(o => o.Items)
                    .ToListAsync();

                if (!myOrders.Any())
                {
                    return new ActionResponse
                    {
                        Success = true,
                        Message = "You have no orders yet. Create your first order by saying 'I want to order [product name]'.",
                        Data = new { orders = new object[0] }
                    };
                }

                var orderSummaries = myOrders.Select(o => new
                {
                    orderNumber = o.OrderNumber,
                    status = o.Status,
                    totalAmount = o.TotalAmount,
                    createdAt = o.CreatedAt,
                    items = o.Items.Select(i => new
                    {
                        productName = i.ProductName,
                        quantity = i.Quantity,
                        unitPrice = i.UnitPrice,
                        lineTotal = i.LineTotal
                    }).ToList()
                }).ToList();

                var message = $"Found {myOrders.Count} order(s) placed by you:";

                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "LIST_ORDERS",
                    Entity = $"{myOrders.Count} orders",
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
                    Message = $"Could not retrieve orders: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
