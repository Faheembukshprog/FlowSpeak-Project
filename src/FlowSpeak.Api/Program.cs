using System.Text;
using System.Threading.Channels;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Hubs;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
                       ?? builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Server=localhost\\SQLEXPRESS;Database=FlowSpeakDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddControllers();

// ── SignalR & Telemetry Pipeline (Zero-Leak Blueprint) ──
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = false;
    options.MaximumReceiveMessageSize = 1024 * 32;
    options.StreamBufferCapacity = 50;
})
.AddMessagePackProtocol();

builder.Services.AddSingleton(Channel.CreateBounded<TelemetryMessage>(new BoundedChannelOptions(20000)
{
    FullMode = BoundedChannelFullMode.DropOldest,
    SingleReader = true,
    SingleWriter = false
}));

builder.Services.AddHostedService<TelemetryProcessingEngine>();

// ── CORS (Mistake #10 Avoided: explicit origin + AllowCredentials, NO wildcards) ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("FlowSpeakCORS", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Essential for HttpOnly cookie propagation
    });
});

// ── JWT Authentication (Mistakes #3, #4, #5, #6, #7 Avoided) ──
var jwtSecret = builder.Configuration["JWT_SECRET"]
                ?? builder.Configuration["Jwt:Secret"]
                ?? "CHANGE-ME-FlowSpeak-256bit-Secret-Key!!"; // Fallback for dev only

var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Mistake #6 Avoided: ALL validations are TRUE. No shortcuts.
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FlowSpeak.Api",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FlowSpeak.Client",
        IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes),
        // Mistake #5 Avoided: Only HMAC-SHA256 allowed. "none" algorithm is BLOCKED.
        ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
        // Mistake #6 Avoided: Zero clock skew — expired means expired immediately.
        ClockSkew = TimeSpan.Zero,
    };

    // Mistake #8 Avoided: Read access token from HttpOnly cookie, NOT Authorization header
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var cookie = context.Request.Cookies["flowspeak_access"];
            if (!string.IsNullOrEmpty(cookie))
            {
                context.Token = cookie;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── Service Registrations ──
builder.Services.AddScoped<FlowSpeak.Api.Services.IProductService, FlowSpeak.Api.Services.ProductService>();
builder.Services.AddScoped<FlowSpeak.Api.Services.IOrderService, FlowSpeak.Api.Services.OrderService>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentDispatcher, FlowSpeak.Api.Services.Intent.IntentDispatcher>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.CheckStockHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.ReserveStockHandler>();
builder.Services.AddScoped<FlowSpeak.Api.Services.IProductLookupService, FlowSpeak.Api.Services.ProductLookupService>();
builder.Services.AddHttpClient<FlowSpeak.Api.Services.AI.IAIProvider, FlowSpeak.Api.Services.AI.LlmAIProvider>(client => 
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddSingleton<FlowSpeak.Api.Services.Auth.IJwtService, FlowSpeak.Api.Services.Auth.JwtService>();
builder.Services.AddSingleton<FlowSpeak.Api.Services.Telemetry.ITelemetryService, FlowSpeak.Api.Services.Telemetry.NullTelemetryService>();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler(appError =>
{
    appError.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/problem+json";
        await Microsoft.AspNetCore.Http.HttpResponseJsonExtensions.WriteAsJsonAsync(context.Response, new { type = "ServerError", title = "Internal Server Error", status = 500 });
    });
});

// ── Database Initialization & Seeding ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseRouting();
app.UseCors("FlowSpeakCORS");
app.UseHttpsRedirection();

// Auth middleware — order matters: Authentication BEFORE Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<TelemetryHub>("/hubs/telemetry");

app.MapGet("/api/health", () => Results.Ok(new { Status = "FlowSpeak API is running", Time = DateTime.UtcNow }))
   .WithName("GetHealthStatus");

app.Run();
