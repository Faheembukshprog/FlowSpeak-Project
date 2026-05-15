using FlowSpeak.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Externalize DB configuration: prefer env var `DB_CONNECTION_STRING` then fall back to appsettings.
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
                       ?? builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Server=localhost\\SQLEXPRESS;Database=FlowSpeakDB;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddControllers();
builder.Services.AddScoped<FlowSpeak.Api.Services.IProductService, FlowSpeak.Api.Services.ProductService>();
// Intent system registrations
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentDispatcher, FlowSpeak.Api.Services.Intent.IntentDispatcher>();
builder.Services.AddScoped<FlowSpeak.Api.Services.Intent.IIntentHandler, FlowSpeak.Api.Services.Intent.CheckStockHandler>();
// AI provider (default null implementation - swap with real provider in production)
builder.Services.AddSingleton<FlowSpeak.Api.Services.AI.IAIProvider, FlowSpeak.Api.Services.AI.NullAIProvider>();
// Telemetry
builder.Services.AddSingleton<FlowSpeak.Api.Services.Telemetry.ITelemetryService, FlowSpeak.Api.Services.Telemetry.NullTelemetryService>();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Database Initialization & Seeding ─────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbInitializer.SeedAsync(db);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapControllers();

// Basic health check endpoint
app.MapGet("/api/health", () => Results.Ok(new { Status = "FlowSpeak API is running", Time = DateTime.UtcNow }))
   .WithName("GetHealthStatus");

app.Run();

