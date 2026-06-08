using System.Text;
using System.Threading.Channels;
using System.Threading.RateLimiting;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Hubs;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var startedAt = DateTime.UtcNow;
var builder   = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
                    ?? builder.Configuration.GetConnectionString("DefaultConnection")
                    ?? "Server=DESKTOP-S4UPLER;Database=FlowSpeakDb;Integrated Security=True;TrustServerCertificate=True;Encrypt=True";

var useSqlite = connectionString.TrimStart().StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase)
             && !connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<FlowSpeak.Api.Data.ApplicationDbContext>(options =>
{
    if (useSqlite)
        options.UseSqlite(connectionString);
    else
        options.UseSqlServer(connectionString);
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Policy 1: intent_per_user — 20 requests / 60 s sliding window, keyed by JWT sub
// Policy 2: auth_per_ip    — 10 requests / 60 s fixed window,    keyed by remote IP
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Called when any request is rejected — return a structured ApiProblem body
    options.OnRejected = async (ctx, token) =>
    {
        ctx.HttpContext.Response.ContentType = "application/problem+json";
        ctx.HttpContext.Response.StatusCode  = 429;

        var retryAfter = ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra)
            ? (int?)ra.TotalSeconds
            : null;

        if (retryAfter.HasValue)
            ctx.HttpContext.Response.Headers["Retry-After"] = retryAfter.Value.ToString();

        await ctx.HttpContext.Response.WriteAsJsonAsync(new ApiProblem
        {
            Type    = "https://tools.ietf.org/html/rfc6585#section-4",
            Title   = "Too Many Requests",
            Status  = 429,
            Detail  = retryAfter.HasValue
                ? $"Rate limit exceeded. Retry after {retryAfter} seconds."
                : "Rate limit exceeded. Please slow down.",
            Code    = ErrorCodes.RateLimited,
            TraceId = ctx.HttpContext.TraceIdentifier,
        }, cancellationToken: token);
    };

    // ── Policy: intent endpoints (per authenticated user) ──────────────────
    options.AddPolicy("intent_per_user", httpCtx =>
        RateLimitPartition.GetSlidingWindowLimiter(
            // Key by JWT sub claim if authenticated, fall back to IP
            partitionKey: httpCtx.User.FindFirst("sub")?.Value
                       ?? httpCtx.Connection.RemoteIpAddress?.ToString()
                       ?? "anon",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit          = 20,
                Window               = TimeSpan.FromSeconds(60),
                SegmentsPerWindow    = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0,
            }));

    // ── Policy: auth endpoints (per remote IP, brute-force protection) ─────
    options.AddPolicy("auth_per_ip", httpCtx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpCtx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit          = 10,
                Window               = TimeSpan.FromSeconds(60),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit           = 0,
            }));
});

// ── Controllers ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── SignalR & Telemetry Pipeline ──────────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors    = false;
    options.MaximumReceiveMessageSize = 1024 * 32;
    options.StreamBufferCapacity    = 50;
})
.AddMessagePackProtocol();

builder.Services.AddSingleton(Channel.CreateBounded<TelemetryMessage>(
    new BoundedChannelOptions(20_000)
    {
        FullMode      = BoundedChannelFullMode.DropOldest,
        SingleReader  = true,
        SingleWriter  = false,
    }));

builder.Services.AddHostedService<TelemetryProcessingEngine>();
builder.Services.AddHostedService<FlowSpeak.Api.Services.Telemetry.LowStockAlertService>();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FlowSpeakCORS", policy =>
    {
        var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "";
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            policy.WithOrigins(frontendUrl,
                               "http://localhost:5000", "https://localhost:5000",
                               "http://localhost:5173", "https://localhost:5173")
                  .AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }
    });
});

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSecret   = FlowSpeak.Api.Services.Auth.JwtService.ResolveSecret(builder.Configuration);
var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"]   ?? "FlowSpeak.Api",
        ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "FlowSpeak.Client",
        IssuerSigningKey         = new SymmetricSecurityKey(jwtKeyBytes),
        ValidAlgorithms          = new[] { SecurityAlgorithms.HmacSha256 },
        ClockSkew                = TimeSpan.Zero,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Read token from HttpOnly cookie (not Authorization header)
            var cookie = context.Request.Cookies["flowspeak_access"];
            if (!string.IsNullOrEmpty(cookie)) context.Token = cookie;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── Service Registrations ─────────────────────────────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<FlowSpeak.Api.Services.IProductService,       FlowSpeak.Api.Services.ProductService>();
builder.Services.AddScoped<FlowSpeak.Api.Services.IOrderService,         FlowSpeak.Api.Services.OrderService>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentDispatcher, FlowSpeak.Api.Services.Intent.IntentDispatcher>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.CheckStockHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.ReserveStockHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.GetOrderStatusHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.CancelOrderHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.UpdateStockHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.AddProductHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.IProductLookupService, FlowSpeak.Api.Services.ProductLookupService>();
builder.Services.AddHttpClient<FlowSpeak.Api.Services.AI.IAIProvider, FlowSpeak.Api.Services.AI.LlmAIProvider>(
    client => { client.Timeout = TimeSpan.FromSeconds(10); });
builder.Services.AddSingleton<FlowSpeak.Api.Services.Auth.IJwtService,   FlowSpeak.Api.Services.Auth.JwtService>();
builder.Services.AddSingleton<FlowSpeak.Api.Services.Telemetry.ITelemetryService, FlowSpeak.Api.Services.Telemetry.NullTelemetryService>();

// ── OpenAPI / Scalar ──────────────────────────────────────────────────────────
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info.Title       = "FlowSpeak API";
        document.Info.Version     = "v1";
        document.Info.Description = "AI-augmented intent execution engine. Rate-limited endpoints enforce per-user (intent) and per-IP (auth) policies.";

        var jwtScheme = new global::Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Type        = global::Microsoft.OpenApi.SecuritySchemeType.Http,
            Name        = "Authorization",
            In          = global::Microsoft.OpenApi.ParameterLocation.Header,
            Scheme      = "bearer",
            BearerFormat = "JWT",
            Description = "JWT access token (automatically read from HttpOnly cookie in browser flows)."
        };

        document.Components ??= new global::Microsoft.OpenApi.OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, global::Microsoft.OpenApi.IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = jwtScheme;

        document.Security ??= new List<global::Microsoft.OpenApi.OpenApiSecurityRequirement>();
        document.Security.Add(new global::Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [new global::Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
        });

        return Task.CompletedTask;
    });
});

// ═══════════════════════════════════════════════════════════════════
var app = builder.Build();

// ── Global exception handler (RFC 7807 Problem Details) ──────────────────────
app.UseExceptionHandler(appError =>
{
    appError.Run(async context =>
    {
        context.Response.StatusCode  = 500;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(new ApiProblem
        {
            Type    = "https://tools.ietf.org/html/rfc7807",
            Title   = "Internal Server Error",
            Status  = 500,
            Detail  = "An unexpected error occurred. Use the TraceId to correlate with server logs.",
            Code    = ErrorCodes.ServerError,
            TraceId = context.TraceIdentifier,
        });
    });
});

// ── Database seeding ──────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FlowSpeak.Api.Data.ApplicationDbContext>();
    await DbInitializer.SeedAsync(db);
}

// ── OpenAPI (dev only) ────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
        options.WithTitle("FlowSpeak API Documentation")
               .WithTheme(ScalarTheme.DeepSpace)
               .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient));
}

// ── Middleware pipeline (order is critical) ───────────────────────────────────
app.UseRouting();
app.UseCors("FlowSpeakCORS");
app.UseRateLimiter();       // ← rate limiting BEFORE auth
app.UseAuthentication();
app.UseAuthorization();

// ── Endpoints ─────────────────────────────────────────────────────────────────
app.MapControllers();
app.MapHub<TelemetryHub>("/hubs/telemetry");

// ── /api/health  (basic liveness) ────────────────────────────────────────────
app.MapGet("/api/health", () => Results.Ok(new
{
    status    = "ok",
    service   = "FlowSpeak.Api",
    timestamp = DateTime.UtcNow,
})).WithName("Liveness");

// ── /api/health/ready  (readiness — DB + subsystem checks) ───────────────────
app.MapGet("/api/health/ready", async (
    FlowSpeak.Api.Data.ApplicationDbContext db,
    IHostApplicationLifetime lifetime,
    IServiceProvider services) =>
{
    var checks = new List<object>();
    var allHealthy = true;

    // 1. Database connectivity
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        checks.Add(new { name = "database", status = "healthy", detail = useSqlite ? "SQLite ping ok" : "SQL Server ping ok" });
    }
    catch (Exception ex)
    {
        allHealthy = false;
        checks.Add(new { name = "database", status = "unhealthy", detail = ex.Message });
    }

    // 2. Telemetry channel backpressure
    var channel = services.GetService<System.Threading.Channels.Channel<TelemetryMessage>>();
    if (channel is not null)
    {
        var count  = channel.Reader.Count;
        var full   = count >= 18_000;     // >90% of capacity (20 000)
        if (full) allHealthy = false;
        checks.Add(new
        {
            name   = "telemetry_channel",
            status = full ? "degraded" : "healthy",
            detail = $"{count}/20000 messages queued",
        });
    }

    // 3. JWT secret presence
    var jwtOk = !string.IsNullOrEmpty(
        app.Configuration["JWT_SECRET"] ?? app.Configuration["Jwt:Secret"]);
    if (!jwtOk)
        checks.Add(new { name = "jwt_secret", status = "warning", detail = "Using insecure fallback secret" });
    else
        checks.Add(new { name = "jwt_secret", status = "healthy", detail = "Custom secret configured" });

    // ── Summary ──
    var uptime = DateTime.UtcNow - startedAt;
    var payload = new
    {
        status    = allHealthy ? "healthy" : "degraded",
        service   = "FlowSpeak.Api",
        version   = "1.0.0",
        environment = app.Environment.EnvironmentName,
        uptime    = $"{(int)uptime.TotalHours}h {uptime.Minutes}m {uptime.Seconds}s",
        uptimeSeconds = (long)uptime.TotalSeconds,
        timestamp = DateTime.UtcNow,
        checks,
        rateLimiting = new
        {
            intentPolicy = "20 req / 60s sliding window (per user)",
            authPolicy   = "10 req / 60s fixed window (per IP)",
        }
    };

    return allHealthy
        ? Results.Ok(payload)
        : Results.Json(payload, statusCode: StatusCodes.Status503ServiceUnavailable);
})
.WithName("Readiness");

app.Run();
