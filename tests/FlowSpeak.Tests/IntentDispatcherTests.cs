using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.Intent;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Tests
{
    public class FakeProductService : IProductService
    {
        public Task<List<FlowSpeak.Api.Models.Product>> GetProductBySearchAsync(string searchTerm)
        {
            var list = new List<FlowSpeak.Api.Models.Product>();
            if (!string.IsNullOrWhiteSpace(searchTerm) && searchTerm.Contains("Widget"))
            {
                list.Add(new FlowSpeak.Api.Models.Product { Name = "Widget", SKU = "W-1" });
            }

            return Task.FromResult(list);
        }
    }

    public class IntentDispatcherTests
    {
        [Fact]
        public async Task Dispatch_CheckStock_ReturnsProducts()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IProductService, FakeProductService>();
            services.AddSingleton<FlowSpeak.Api.Services.Telemetry.ITelemetryService, FlowSpeak.Api.Services.Telemetry.NullTelemetryService>();
            services.AddScoped<IIntentHandler, CheckStockHandler>();
            services.AddScoped<IIntentDispatcher, IntentDispatcher>();

            var sp = services.BuildServiceProvider();

            var dispatcher = sp.GetRequiredService<IIntentDispatcher>();

            var req = new IntentRequest
            {
                Intent = "CHECK_STOCK",
                Entity = "Widget",
                Parameters = new Dictionary<string, string>()
            };

            var resp = await dispatcher.DispatchAsync(req);

            Assert.True(resp.Success);
            Assert.Contains("Found", resp.Message);
        }
    }
}
