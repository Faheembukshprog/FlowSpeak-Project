using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Services.Intent
{
    public class GetOrderStatusHandler : IIntentHandler
    {
        private readonly ApplicationDbContext _context;

        public string IntentName => "GET_ORDER_STATUS";
        public IReadOnlyList<string> AllowedRoles => new[] { "Admin", "Sales", "Viewer" };

        public GetOrderStatusHandler(ApplicationDbContext context)
        {
            _context = context;
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
                    Message = "No order number specified in the request.",
                    Data = null
                };
            }

            orderNumber = orderNumber.Trim();

            // Find the order, including its items and requesting user
            var order = await _context.Orders
                .Include(o => o.Items)
                .Include(o => o.RequestedByUser)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber || o.ExternalId.ToString() == orderNumber);

            if (order == null)
            {
                return new ActionResponse
                {
                    Success = false,
                    Message = $"Could not locate order matching '{orderNumber}'.",
                    Data = null
                };
            }

            var itemsDetail = string.Join(", ", order.Items.Select(i => $"{i.Quantity}x {i.ProductName}"));
            var message = $"Order {order.OrderNumber} status is {order.Status}. Items: {itemsDetail}. Total amount: ${order.TotalAmount:F2}. Created at: {order.CreatedAt.ToLocalTime():yyyy-MM-dd HH:mm:ss}.";

            return new ActionResponse
            {
                Success = true,
                Message = message,
                Data = new
                {
                    orderNumber = order.OrderNumber,
                    status = order.Status,
                    totalAmount = order.TotalAmount,
                    requestedBy = order.RequestedByUser?.Username ?? "(legacy / unknown)",
                    notes = order.Notes,
                    createdAt = order.CreatedAt,
                    items = order.Items.Select(i => new
                    {
                        productName = i.ProductName,
                        productSKU = i.ProductSKU,
                        quantity = i.Quantity,
                        unitPrice = i.UnitPrice,
                        lineTotal = i.LineTotal
                    }).ToList()
                }
            };
        }
    }
}
