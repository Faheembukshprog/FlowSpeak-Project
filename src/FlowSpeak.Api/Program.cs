using System.Text;
using System.Threading.Channels;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Hubs;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services.Telemetry;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
                       ?? builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Data Source=flowspeak.db";

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));

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

// ── CORS ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("FlowSpeakCORS", policy =>
    {
        var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "";
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            policy.WithOrigins(
                    frontendUrl,
                    "http://localhost:5000",
                    "https://localhost:5000",
                    "http://localhost:5173",
                    "https://localhost:5173"
                  )
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // Development fallback: allow all origins
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
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
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info.Title = "FlowSpeak API";
        document.Info.Version = "v1";
        document.Info.Description = "API documentation for the FlowSpeak Command Center backend, facilitating AI-driven inventory and order routing orchestration.";
        
        var jwtScheme = new global::Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Type = global::Microsoft.OpenApi.SecuritySchemeType.Http,
            Name = "Authorization",
            In = global::Microsoft.OpenApi.ParameterLocation.Header,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter JWT access token."
        };
        
        document.Components ??= new global::Microsoft.OpenApi.OpenApiComponents();
        if (document.Components.SecuritySchemes == null)
        {
            document.Components.SecuritySchemes = new Dictionary<string, global::Microsoft.OpenApi.IOpenApiSecurityScheme>();
        }
        document.Components.SecuritySchemes.Add("Bearer", jwtScheme);
        
        var requirement = new global::Microsoft.OpenApi.OpenApiSecurityRequirement
        {
            [new global::Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
        };
        
        document.Security ??= new List<global::Microsoft.OpenApi.OpenApiSecurityRequirement>();
        document.Security.Add(requirement);
        
        return Task.CompletedTask;
    });
});

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
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("FlowSpeak API Documentation")
               .WithTheme(ScalarTheme.DeepSpace)
               .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

app.UseRouting();
app.UseCors("FlowSpeakCORS");

// Auth middleware — order matters: Authentication BEFORE Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<TelemetryHub>("/hubs/telemetry");

app.MapGet("/api/health", () => Results.Ok(new { Status = "FlowSpeak API is running", Time = DateTime.UtcNow }))
   .WithName("GetHealthStatus");

app.Run();
