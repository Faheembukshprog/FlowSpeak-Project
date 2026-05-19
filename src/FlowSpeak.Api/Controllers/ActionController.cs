using System.Text.Json;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.AI;
using FlowSpeak.Api.Services.Intent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All command endpoints require authentication
    public class ActionController : ControllerBase
    {
        private readonly IIntentDispatcher _dispatcher;
        private readonly ApplicationDbContext _context;
        private readonly IAIProvider _aiProvider;

        public ActionController(IIntentDispatcher dispatcher, ApplicationDbContext context, IAIProvider aiProvider)
        {
            _dispatcher = dispatcher;
            _context = context;
            _aiProvider = aiProvider;
        }

        /// <summary>
        /// Legacy endpoint: accepts a pre-parsed IntentRequest JSON payload.
        /// </summary>
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
                response.Intent = request.Intent ?? "UNKNOWN_INTENT";

                await LogIntentAsync(request, response, wasSuccessful, wasSuccessful ? null : response.Message);

                if (wasSuccessful)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                var errorResponse = new ActionResponse
                {
                    Success = false,
                    Message = $"An error occurred processing intent {request.Intent}: {ex.Message}",
                    Data = null,
                    Intent = request.Intent ?? "UNKNOWN_INTENT"
                };

                await LogIntentAsync(request, errorResponse, false, ex.Message);
                return StatusCode(500, errorResponse);
            }
        }

        /// <summary>
        /// Production endpoint: accepts raw human text.
        /// The backend NLP engine extracts intent autonomously, then dispatches it.
        /// The frontend should NOT pre-parse intents — just send the raw sentence.
        /// </summary>
        [HttpPost("interpret")]
        public async Task<IActionResult> InterpretText([FromBody] RawTextRequest rawRequest)
        {
            if (string.IsNullOrWhiteSpace(rawRequest?.Text))
            {
                return BadRequest(new ActionResponse
                {
                    Success = false,
                    Message = "No text provided for interpretation.",
                    Data = null
                });
            }

            try
            {
                // Step 1: AI Provider extracts structured intent from raw human text
                var intentRequest = await _aiProvider.ExtractIntentFromTextAsync(rawRequest.Text);

                // Step 2: Dispatch the structured intent to the correct handler
                var response = await _dispatcher.DispatchAsync(intentRequest)
                    ?? new ActionResponse
                    {
                        Success = false,
                        Message = "No response generated",
                        Data = null
                    };

                var wasSuccessful = response.Success;
                response.Intent = intentRequest.Intent ?? "UNKNOWN_INTENT";
                await LogIntentAsync(intentRequest, response, wasSuccessful, wasSuccessful ? null : response.Message);

                if (wasSuccessful)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                var errorResponse = new ActionResponse
                {
                    Success = false,
                    Message = $"Interpretation failed: {ex.Message}",
                    Data = null,
                    Intent = "UNKNOWN_INTENT"
                };
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
