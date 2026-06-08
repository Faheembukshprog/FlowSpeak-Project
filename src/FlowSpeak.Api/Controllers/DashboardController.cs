using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Sales")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var todayUtc = DateTime.UtcNow.Date;

                // 1. Orders Today
                var ordersToday = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= todayUtc);

                // 2. Weekly Revenue (last 7 days, excluding cancelled orders)
                var weekAgo = DateTime.UtcNow.Date.AddDays(-7);
                var weeklyRevenue = await _context.Orders
                    .Where(o => o.CreatedAt >= weekAgo && o.Status != "CANCELLED")
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0.0m;

                // 3. Low-Stock Count (products with stock < 5)
                var lowStockCount = await _context.Products
                    .CountAsync(p => p.StockQuantity < 5 && !p.IsDeleted);

                // 4. AI Success Rate (percentage of successful intents)
                var totalCommands = await _context.AiCommandLogs.CountAsync();
                var successfulCommands = await _context.AiCommandLogs.CountAsync(c => c.WasSuccessful);
                var aiSuccessRate = totalCommands > 0
                    ? Math.Round(((double)successfulCommands / totalCommands) * 100.0, 1)
                    : 100.0;

                // 5. Top-Selling Products
                var topProducts = await _context.OrderItems
                    .Include(oi => oi.Order)
                    .Where(oi => oi.Order != null && oi.Order.Status != "CANCELLED")
                    .GroupBy(oi => new { oi.ProductSKU, oi.ProductName })
                    .Select(g => new
                    {
                        sku = g.Key.ProductSKU,
                        name = g.Key.ProductName,
                        totalQuantity = g.Sum(oi => oi.Quantity),
                        revenue = g.Sum(oi => oi.LineTotal)
                    })
                    .OrderByDescending(x => x.totalQuantity)
                    .Take(5)
                    .ToListAsync();

                // 6. 7-Day Command Volume Chart Data (Group in-memory to avoid SQLite date-functions complexity)
                var startDate = DateTime.UtcNow.Date.AddDays(-6);
                var logs = await _context.AiCommandLogs
                    .Where(l => l.ProcessedAt >= startDate)
                    .Select(l => new { l.ProcessedAt, l.WasSuccessful })
                    .ToListAsync();

                var chartData = Enumerable.Range(0, 7)
                    .Select(i =>
                    {
                        var date = startDate.AddDays(i);
                        var dayLogs = logs.Where(l => l.ProcessedAt.Date == date.Date).ToList();
                        return new
                        {
                            date = date.ToString("yyyy-MM-dd"),
                            dayName = date.ToString("ddd"),
                            success = dayLogs.Count(l => l.WasSuccessful),
                            failed = dayLogs.Count(l => !l.WasSuccessful)
                        };
                    })
                    .ToList();

                return Ok(new
                {
                    ordersToday,
                    weeklyRevenue,
                    lowStockCount,
                    aiSuccessRate,
                    topProducts,
                    chartData
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"An error occurred while loading dashboard metrics: {ex.Message}"
                });
            }
        }
    }
}
