using System.Text.Json;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.Intent;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActionController : ControllerBase
    {
        private readonly IIntentDispatcher _dispatcher;
        private readonly ApplicationDbContext _context;

        public ActionController(IIntentDispatcher dispatcher, ApplicationDbContext context)
        {
            _dispatcher = dispatcher;
            _context = context;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessIntent([FromBody] IntentRequest request)
        {
            try
            {
                var response = await _dispatcher.DispatchAsync(request)
                    ?? new ActionResponse
                    {
                        Success = false,
                        Message = "No response generated",
                        Data = null
                    };

                var wasSuccessful = response.Success;

                await LogIntentAsync(request, response, wasSuccessful, wasSuccessful ? null : response.Message);

                if (wasSuccessful)
                    return Ok(response);

                // If dispatch returned a structured failure, return BadRequest to surface intent errors.
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                var errorResponse = new ActionResponse
                {
                    Success = false,
                    Message = $"An error occurred processing intent {request.Intent}: {ex.Message}",
                    Data = null
                };

                await LogIntentAsync(request, errorResponse, false, ex.Message);
                return StatusCode(500, errorResponse);
            }
        }

        private async Task LogIntentAsync(IntentRequest request, ActionResponse response, bool wasSuccessful, string? errorMessage = null)
        {
            var log = new AiCommandLog
            {
                Intent = request.Intent ?? "UNKNOWN",
                Entity = request.Entity,
                RawPayload = JsonSerializer.Serialize(request),
                ResponsePayload = JsonSerializer.Serialize(response),
                WasSuccessful = wasSuccessful,
                ErrorMessage = errorMessage
            };

            await _context.AiCommandLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
    }
}
