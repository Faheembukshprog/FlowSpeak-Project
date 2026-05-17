using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/telemetry/logs")]
    public class TelemetryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TelemetryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.AiCommandLogs
                .AsNoTracking()
                .OrderByDescending(log => log.ProcessedAt)
                .Take(50)
                .ToListAsync();

            return Ok(logs);
        }
    }
}
