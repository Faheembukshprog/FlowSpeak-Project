using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FlowSpeak.Api.Services.Telemetry
{
    public class LowStockAlertService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly Channel<TelemetryMessage> _telemetryChannel;
        private readonly ILogger<LowStockAlertService> _logger;
        
        // Tracks product ID -> last alerted quantity to deduplicate alerts
        private readonly Dictionary<long, int> _alertedProducts = new();

        public LowStockAlertService(
            IServiceProvider serviceProvider,
            Channel<TelemetryMessage> telemetryChannel,
            ILogger<LowStockAlertService> logger)
        {
            _serviceProvider = serviceProvider;
            _telemetryChannel = telemetryChannel;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Low Stock Alert Background Service started.");

            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(60));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckStockLevelsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during background stock level verification.");
                }

                try
                {
                    // Await next 60s tick
                    await timer.WaitForNextTickAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Low Stock Alert Background Service stopped.");
        }

        private async Task CheckStockLevelsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Query active products with stock below 5
            var lowStockProducts = await db.Products
                .AsNoTracking()
                .Where(p => p.StockQuantity < 5 && !p.IsDeleted)
                .ToListAsync(stoppingToken);

            var currentLowStockIds = new HashSet<long>();

            foreach (var product in lowStockProducts)
            {
                currentLowStockIds.Add(product.Id);

                // Alert if product has not been alerted, or if the stock quantity has changed
                if (!_alertedProducts.TryGetValue(product.Id, out var lastAlertedQty) || lastAlertedQty != product.StockQuantity)
                {
                    var statusStr = product.StockQuantity == 0 ? "CRITICAL" : "WARNING";
                    var message = product.StockQuantity == 0
                        ? $"CRITICAL Alert: {product.Name} (SKU: {product.SKU}) is completely out of stock!"
                        : $"Low Stock Alert: {product.Name} (SKU: {product.SKU}) has only {product.StockQuantity} units remaining.";

                    var alertMsg = new TelemetryMessage
                    {
                        EventType = "LOW_STOCK_ALERT",
                        Entity = product.Name,
                        Intent = "SYSTEM",
                        Status = statusStr,
                        Payload = new
                        {
                            productId = product.Id,
                            sku = product.SKU,
                            name = product.Name,
                            stockQuantity = product.StockQuantity,
                            message = message
                        }
                    };

                    // Send alert via SignalR Channel
                    _telemetryChannel.Writer.TryWrite(alertMsg);
                    _logger.LogInformation("Dispatched low stock alert for product {ProductId} ({Name}). Stock: {Stock}", 
                        product.Id, product.Name, product.StockQuantity);

                    // Track alert state
                    _alertedProducts[product.Id] = product.StockQuantity;
                }
            }

            // Remove products that are no longer low-stock from alert list (so they can alert again if they fall below limit again)
            var resolvedIds = _alertedProducts.Keys.Where(id => !currentLowStockIds.Contains(id)).ToList();
            foreach (var id in resolvedIds)
            {
                _alertedProducts.Remove(id);
            }
        }
    }
}
