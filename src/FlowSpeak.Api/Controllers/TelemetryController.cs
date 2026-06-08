using System;
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
    [Route("api/telemetry/logs")]
    [Authorize(Roles = "Admin")]
    public class TelemetryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TelemetryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? intent = null,
            [FromQuery] bool? success = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.AiCommandLogs.AsNoTracking();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(intent))
            {
                var upperIntent = intent.Trim().ToUpperInvariant();
                query = query.Where(log => log.Intent == upperIntent);
            }

            if (success.HasValue)
            {
                query = query.Where(log => log.WasSuccessful == success.Value);
            }

            if (from.HasValue)
            {
                query = query.Where(log => log.ProcessedAt >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(log => log.ProcessedAt <= to.Value);
            }

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(log => log.ProcessedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(log => new AuditLogDto
                {
                    ExternalId    = log.ExternalId,
                    Intent        = log.Intent,
                    Entity        = log.Entity,
                    WasSuccessful = log.WasSuccessful,
                    ErrorMessage  = log.ErrorMessage,
                    ProcessedAt   = log.ProcessedAt
                })
                .ToListAsync();

            return Ok(new
            {
                logs,
                totalCount,
                page,
                pageSize
            });
        }
    }
}
