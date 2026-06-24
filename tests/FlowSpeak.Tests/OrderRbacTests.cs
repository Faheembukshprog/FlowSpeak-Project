using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Channels;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.Intent;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace FlowSpeak.Tests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Builds an in-memory ApplicationDbContext pre-seeded with test data.
    /// Each call produces a uniquely-named DB so tests never share state.
    /// </summary>
    internal static class InMemoryDbFactory
    {
        public static ApplicationDbContext Create(string? dbName = null)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
                .Options;
            return new ApplicationDbContext(options);
        }
    }

    /// <summary>
    /// ICurrentUserContext implementation backed by a fixed AppUser —
    /// used in tests that need a resolved user without a real HTTP context.
    /// </summary>
    internal class StubCurrentUser : ICurrentUserContext
    {
        private readonly AppUser? _user;
        public StubCurrentUser(AppUser? user = null) => _user = user;
        public Task<AppUser?> GetCurrentUserAsync() => Task.FromResult(_user);
    }

    internal static class ChannelFactory
    {
        public static Channel<TelemetryMessage> Create() =>
            Channel.CreateBounded<TelemetryMessage>(new BoundedChannelOptions(100)
            {
                FullMode = BoundedChannelFullMode.DropOldest,
                SingleReader = true,
                SingleWriter = false,
            });
    }

    internal static class ResponseDataHelpers
    {
        public static int CountOrders(object? data)
        {
            if (data == null) return 0;
            var ordersProp = data.GetType().GetProperty("orders");
            if (ordersProp?.GetValue(data) is not System.Collections.IEnumerable orders) return 0;
            int count = 0;
            foreach (var _ in orders) count++;
            return count;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CurrentUserContext unit tests
    // ──────────────────────────────────────────────────────────────────────────

    public class CurrentUserContextTests
    {
        [Fact]
        public async Task GetCurrentUserAsync_ValidSubClaim_ReturnsUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var db = InMemoryDbFactory.Create();
            db.AppUsers.Add(new AppUser
            {
                ExternalId = userId,
                Username = "alice",
                PasswordHash = "hash",
                Role = "Viewer"
            });
            await db.SaveChangesAsync();

            var claims = new List<Claim> { new Claim("sub", userId.ToString()) };
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            };
            var accessor = new HttpContextAccessor { HttpContext = httpContext };

            var sut = new CurrentUserContext(accessor, db);

            // Act
            var user = await sut.GetCurrentUserAsync();

            // Assert
            Assert.NotNull(user);
            Assert.Equal("alice", user!.Username);
            Assert.Equal(userId, user.ExternalId);
        }

        [Fact]
        public async Task GetCurrentUserAsync_MissingSubClaim_ReturnsNull()
        {
            var db = InMemoryDbFactory.Create();
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            };
            var accessor = new HttpContextAccessor { HttpContext = httpContext };

            var sut = new CurrentUserContext(accessor, db);

            var user = await sut.GetCurrentUserAsync();

            Assert.Null(user);
        }

        [Fact]
        public async Task GetCurrentUserAsync_InvalidGuid_ReturnsNull()
        {
            var db = InMemoryDbFactory.Create();
            var claims = new List<Claim> { new Claim("sub", "not-a-guid") };
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            };
            var accessor = new HttpContextAccessor { HttpContext = httpContext };

            var sut = new CurrentUserContext(accessor, db);

            var user = await sut.GetCurrentUserAsync();

            Assert.Null(user);
        }

        [Fact]
        public async Task GetCurrentUserAsync_UserNotInDb_ReturnsNull()
        {
            var db = InMemoryDbFactory.Create();
            var unknownId = Guid.NewGuid();
            var claims = new List<Claim> { new Claim("sub", unknownId.ToString()) };
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            };
            var accessor = new HttpContextAccessor { HttpContext = httpContext };

            var sut = new CurrentUserContext(accessor, db);

            var user = await sut.GetCurrentUserAsync();

            Assert.Null(user);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ListMyOrdersHandler unit tests
    // ──────────────────────────────────────────────────────────────────────────

    public class ListMyOrdersHandlerTests
    {
        private static AppUser MakeUser(string role = "Viewer") => new AppUser
        {
            ExternalId = Guid.NewGuid(),
            Username = "testuser",
            PasswordHash = "hash",
            Role = role
        };

        private static Order MakeOrder(Guid userId) => new Order
        {
            ExternalId = Guid.NewGuid(),
            OrderNumber = $"FS-TEST-{Guid.NewGuid():N}",
            Status = "PENDING",
            TotalAmount = 42.00m,
            RequestedByUserId = userId
        };

        [Theory]
        [InlineData("Viewer")]
        [InlineData("Sales")]
        [InlineData("Admin")]
        public async Task HandleAsync_ReturnsOnlyCallerOrders_ForAnyRole(string role)
        {
            // Arrange: two users, three orders — two owned by caller, one by other
            var db = InMemoryDbFactory.Create();
            var caller = MakeUser(role);
            var other = MakeUser("Sales");

            db.AppUsers.AddRange(caller, other);
            db.Orders.AddRange(
                MakeOrder(caller.ExternalId),
                MakeOrder(caller.ExternalId),
                MakeOrder(other.ExternalId)  // should NOT appear
            );
            await db.SaveChangesAsync();

            var handler = new ListMyOrdersHandler(db, new StubCurrentUser(caller), ChannelFactory.Create());
            var request = new IntentRequest { Intent = "LIST_MY_ORDERS", Entity = "" };

            // Act
            var response = await handler.HandleAsync(request);

            // Assert
            Assert.True(response.Success);
            Assert.Equal(2, ResponseDataHelpers.CountOrders(response.Data));
        }

        [Fact]
        public async Task HandleAsync_NoUser_ReturnsFailure()
        {
            var db = InMemoryDbFactory.Create();
            var handler = new ListMyOrdersHandler(db, new StubCurrentUser(null), ChannelFactory.Create());
            var request = new IntentRequest { Intent = "LIST_MY_ORDERS", Entity = "" };

            var response = await handler.HandleAsync(request);

            Assert.False(response.Success);
            Assert.Contains("identify", response.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task HandleAsync_NoOrders_ReturnsFriendlyEmptyMessage()
        {
            var db = InMemoryDbFactory.Create();
            var caller = MakeUser();
            db.AppUsers.Add(caller);
            await db.SaveChangesAsync();

            var handler = new ListMyOrdersHandler(db, new StubCurrentUser(caller), ChannelFactory.Create());
            var request = new IntentRequest { Intent = "LIST_MY_ORDERS", Entity = "" };

            var response = await handler.HandleAsync(request);

            Assert.True(response.Success);
            Assert.Contains("no orders yet", response.Message, StringComparison.OrdinalIgnoreCase);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ListAllOrdersHandler unit tests
    // ──────────────────────────────────────────────────────────────────────────

    public class ListAllOrdersHandlerTests
    {
        private static AppUser MakeAdmin() => new AppUser
        {
            ExternalId = Guid.NewGuid(), Username = "admin", PasswordHash = "hash", Role = "Admin"
        };

        private static Order MakeOrder(Guid? userId = null) => new Order
        {
            ExternalId = Guid.NewGuid(),
            OrderNumber = $"FS-ALL-{Guid.NewGuid():N}",
            Status = "PENDING",
            TotalAmount = 10.00m,
            RequestedByUserId = userId
        };

        [Fact]
        public async Task HandleAsync_Admin_ReturnsAllOrders()
        {
            var db = InMemoryDbFactory.Create();
            var admin = MakeAdmin();
            var user2 = new AppUser { ExternalId = Guid.NewGuid(), Username = "bob", PasswordHash = "h", Role = "Sales" };

            db.AppUsers.AddRange(admin, user2);
            db.Orders.AddRange(
                MakeOrder(admin.ExternalId),
                MakeOrder(user2.ExternalId),
                MakeOrder(null)   // legacy order with no user
            );
            await db.SaveChangesAsync();

            var handler = new ListAllOrdersHandler(db, new StubCurrentUser(admin), ChannelFactory.Create());
            var request = new IntentRequest { Intent = "LIST_ALL_ORDERS", Entity = "" };

            var response = await handler.HandleAsync(request);

            Assert.True(response.Success);
            Assert.Contains("3", response.Message);
        }

        [Fact]
        public async Task HandleAsync_NonAdmin_ReturnsForbidden_WhenCalledDirectly()
        {
            var db = InMemoryDbFactory.Create();
            var viewer = new AppUser
            {
                ExternalId = Guid.NewGuid(),
                Username = "viewer",
                PasswordHash = "hash",
                Role = "Viewer"
            };
            db.AppUsers.Add(viewer);
            db.Orders.Add(MakeOrder(viewer.ExternalId));
            await db.SaveChangesAsync();

            var handler = new ListAllOrdersHandler(db, new StubCurrentUser(viewer), ChannelFactory.Create());
            var request = new IntentRequest { Intent = "LIST_ALL_ORDERS", Entity = "" };

            var response = await handler.HandleAsync(request);

            Assert.False(response.Success);
            Assert.Equal(ErrorCodes.Forbidden, response.ErrorCode);
        }

        [Fact]
        public async Task IntentDispatcher_BlocksNonAdmin_FromListAllOrders()
        {
            // Verify the RBAC guard in IntentDispatcher stops Viewer/Sales
            var services = new ServiceCollection();
            services.AddTestIntentInfrastructure(role: "Viewer");

            var db = InMemoryDbFactory.Create();
            services.AddSingleton(db);
            services.AddSingleton<ICurrentUserContext>(new StubCurrentUser(null));
            services.AddSingleton<ITelemetryService, NullTelemetryService>();
            services.AddScoped<IIntentHandler, ListAllOrdersHandler>();
            services.AddScoped<IIntentDispatcher, IntentDispatcher>();

            var sp = services.BuildServiceProvider();
            var dispatcher = sp.GetRequiredService<IIntentDispatcher>();

            var req = new IntentRequest { Intent = "LIST_ALL_ORDERS", Entity = "" };
            var resp = await dispatcher.DispatchAsync(req);

            Assert.False(resp.Success);
            Assert.Equal(ErrorCodes.Forbidden, resp.ErrorCode);
        }

        [Fact]
        public async Task IntentDispatcher_AllowsAdmin_ToListAllOrders()
        {
            var services = new ServiceCollection();
            services.AddTestIntentInfrastructure(role: "Admin");

            var db = InMemoryDbFactory.Create();
            services.AddSingleton(db);
            services.AddSingleton<ICurrentUserContext>(new StubCurrentUser(MakeAdmin()));
            services.AddSingleton<ITelemetryService, NullTelemetryService>();
            services.AddScoped<IIntentHandler, ListAllOrdersHandler>();
            services.AddScoped<IIntentDispatcher, IntentDispatcher>();

            var sp = services.BuildServiceProvider();
            var dispatcher = sp.GetRequiredService<IIntentDispatcher>();

            var req = new IntentRequest { Intent = "LIST_ALL_ORDERS", Entity = "" };
            var resp = await dispatcher.DispatchAsync(req);

            // Success=true (no orders = friendly empty, which is still success)
            Assert.True(resp.Success);
        }
    }
}
