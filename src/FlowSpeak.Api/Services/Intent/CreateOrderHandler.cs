using System;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using System.Threading.Channels;

namespace FlowSpeak.Api.Services.Intent
{
    public class CreateOrderHandler : IIntentHandler
    {
        private readonly IOrderService _orderService;
        private readonly ICurrentUserContext _currentUser;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "CREATE_ORDER";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales", "Viewer" };

        public CreateOrderHandler(
            IOrderService orderService,
            ICurrentUserContext currentUser,
            Channel<TelemetryMessage> telemetryChannel)
        {
            _orderService = orderService;
            _currentUser = currentUser;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var productName = request.Entity;

            if (string.IsNullOrWhiteSpace(productName))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "Please specify which product you'd like to order.",
                    Data = null
                };
            }

            int quantity = 1;
            if (request.Parameters != null && request.Parameters.ContainsKey("quantity"))
            {
                if (int.TryParse(request.Parameters["quantity"], out int parsedQty))
                {
                    quantity = Math.Max(1, parsedQty);
                }
            }

            // Resolve current user — null is safe; the order is still created,
            // just with a null RequestedByUserId (legacy-compatible).
            var user = await _currentUser.GetCurrentUserAsync();

            try
            {
                var order = await _orderService.CreateReservationOrderAsync(
                    productName, quantity, user?.ExternalId);

                if (order == null)
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Could not find '{productName}' in our inventory. Please check the product name and try again.",
                        Data = null
                    };
                }

                var firstItem = order.Items.FirstOrDefault();
                var message = $"✓ Order {order.OrderNumber} created successfully! Reserved {quantity} unit(s) of {firstItem?.ProductName ?? productName}. Total: ${order.TotalAmount:F2}. Status: {order.Status}.";

                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "ORDER_CREATED",
                    Entity = firstItem?.ProductName ?? productName,
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
                        productName = firstItem?.ProductName,
                        quantity = quantity,
                        unitPrice = firstItem?.UnitPrice,
                        totalAmount = order.TotalAmount,
                        status = order.Status
                    }
                };
            }
            catch (InvalidOperationException ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Cannot complete order: {ex.Message}",
                    Data = null
                };
            }
            catch (Exception ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"An error occurred while creating the order: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
