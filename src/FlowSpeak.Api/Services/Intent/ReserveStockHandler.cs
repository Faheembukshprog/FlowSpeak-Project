using System;
using System.Text.Json;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using System.Threading.Channels;

namespace FlowSpeak.Api.Services.Intent
{
    public class ReserveStockHandler : IIntentHandler
    {
        private readonly IOrderService _orderService;
        private readonly Channel<TelemetryMessage> _telemetryChannel;

        public string IntentName => "RESERVE_STOCK";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales" };

        public ReserveStockHandler(IOrderService orderService, Channel<TelemetryMessage> telemetryChannel)
        {
            _orderService = orderService;
            _telemetryChannel = telemetryChannel;
        }

        public async Task<ActionResponse> HandleAsync(IntentRequest request)
        {
            var searchTerm = request.Entity;

            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = "No product name specified to reserve.",
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

            try
            {
                var order = await _orderService.CreateReservationOrderAsync(searchTerm, quantity);

                if (order == null)
                {
                    return new ActionResponse
                    {
                        Success = false,
                        Message = $"Could not locate a product matching '{searchTerm}' to reserve.",
                        Data = null
                    };
                }

                var firstItem = order.Items.FirstOrDefault();
                var remainingStock = firstItem != null ? $"Remaining stock will be updated." : "";

                var message = $"Order {order.OrderNumber} created. Reserved {quantity} units of {firstItem?.ProductName ?? searchTerm} (SKU: {firstItem?.ProductSKU}). Total: ${order.TotalAmount:F2}. Status: {order.Status}.";
                
                _telemetryChannel.Writer.TryWrite(new TelemetryMessage
                {
                    EventType = "ORDER_CREATED",
                    Entity = firstItem?.ProductName ?? searchTerm,
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
                        totalAmount = order.TotalAmount,
                        productName = firstItem?.ProductName,
                        productSKU = firstItem?.ProductSKU,
                        quantity = quantity
                    }
                };
            }
            catch (InvalidOperationException ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = ex.Message,
                    Data = null
                };
            }
            catch (Exception ex)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"An error occurred while reserving stock: {ex.Message}",
                    Data = null
                };
            }
        }
    }
}
