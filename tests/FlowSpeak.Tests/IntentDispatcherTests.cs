using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Channels;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.Intent;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FlowSpeak.Tests
{
    public class FakeProductService : IProductService
    {
        public Task<List<FlowSpeak.Api.Models.Product>> GetProductBySearchAsync(string searchTerm)
        {
            var list = new List<FlowSpeak.Api.Models.Product>();
            if (!string.IsNullOrWhiteSpace(searchTerm) &&
                (searchTerm.Contains("Widget", System.StringComparison.OrdinalIgnoreCase) ||
                 searchTerm.Equals("W-1", System.StringComparison.OrdinalIgnoreCase)))
            {
                list.Add(new FlowSpeak.Api.Models.Product
                {
                    Name = "Widget",
                    SKU = "W-1",
                    StockQuantity = 10,
                    Price = 9.99m
                });
            }

            return Task.FromResult(list);
        }

        public Task<FlowSpeak.Api.Models.Product?> ReserveStockAsync(string searchTerm, int quantity)
            => Task.FromResult<FlowSpeak.Api.Models.Product?>(null);
    }

    public static class TestServiceCollectionExtensions
    {
        public static IServiceCollection AddTestIntentInfrastructure(this IServiceCollection services, string role = "Viewer")
        {
            services.AddSingleton<ITelemetryService, NullTelemetryService>();
            services.AddSingleton(Channel.CreateBounded<TelemetryMessage>(new BoundedChannelOptions(100)
            {
                FullMode = BoundedChannelFullMode.DropOldest,
                SingleReader = true,
                SingleWriter = false,
            }));

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim("sub", System.Guid.NewGuid().ToString()),
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var httpContext = new DefaultHttpContext { User = principal };
            var accessor = new HttpContextAccessor { HttpContext = httpContext };

            services.AddSingleton<IHttpContextAccessor>(accessor);
            return services;
        }
    }

    public class IntentDispatcherTests
    {
        [Fact]
        public async Task Dispatch_CheckStock_ReturnsProducts()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IProductService, FakeProductService>();
            services.AddTestIntentInfrastructure(role: "Viewer");
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
            Assert.Contains("units of Widget", resp.Message);
        }

        [Fact]
        public async Task Dispatch_CheckStock_BySkuParameter_ReturnsProducts()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IProductService, FakeProductService>();
            services.AddTestIntentInfrastructure(role: "Viewer");
            services.AddScoped<IIntentHandler, CheckStockHandler>();
            services.AddScoped<IIntentDispatcher, IntentDispatcher>();

            var sp = services.BuildServiceProvider();
            var dispatcher = sp.GetRequiredService<IIntentDispatcher>();

            var req = new IntentRequest
            {
                Intent = "CHECK_STOCK",
                Entity = "product",
                Parameters = new Dictionary<string, string> { { "sku", "W-1" } }
            };

            var resp = await dispatcher.DispatchAsync(req);

            Assert.True(resp.Success);
            Assert.Contains("W-1", resp.Message);
        }

        [Fact]
        public async Task Dispatch_CheckStock_ForbiddenForUnauthorizedRole()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IProductService, FakeProductService>();
            services.AddTestIntentInfrastructure(role: "Guest");
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

            Assert.False(resp.Success);
            Assert.Equal(ErrorCodes.Forbidden, resp.ErrorCode);
        }
    }
}
