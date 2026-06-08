using System.Text.Json;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using FlowSpeak.Api.Models.DTOs;
using FlowSpeak.Api.Services;
using FlowSpeak.Api.Services.AI;
using FlowSpeak.Api.Services.Intent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActionController : ControllerBase
    {
        private readonly IIntentDispatcher  _dispatcher;
        private readonly ApplicationDbContext _context;
        private readonly IAIProvider        _aiProvider;
        private readonly ILogger<ActionController> _logger;

        public ActionController(
            IIntentDispatcher dispatcher,
            ApplicationDbContext context,
            IAIProvider aiProvider,
            ILogger<ActionController> logger)
        {
            _dispatcher = dispatcher;
            _context    = context;
            _aiProvider = aiProvider;
            _logger     = logger;
        }

        /// <summary>
        /// Legacy endpoint: accepts a pre-parsed IntentRequest JSON payload.
        /// Rate-limited to 30 req/min per user.
        /// </summary>
        [HttpPost("process")]
        [EnableRateLimiting("intent_per_user")]
        public async Task<IActionResult> ProcessIntent([FromBody] IntentRequest request)
        {
            var traceId = HttpContext.TraceIdentifier;
            try
            {
                var response = await _dispatcher.DispatchAsync(request)
                    ?? ActionResponse.Fail("No response generated", ErrorCodes.DispatchFailed, traceId);

                response.Intent    = request.Intent ?? "UNKNOWN_INTENT";
                response.TraceId   = traceId;
                response.Timestamp = DateTime.UtcNow;

                if (!response.Success && response.ErrorCode == ErrorCodes.Forbidden)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }

                await LogIntentAsync(request, response, response.Success, response.Success ? null : response.Message);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ProcessIntent failed for intent {Intent}", request.Intent);
                var err = ActionResponse.Fail(
                    $"An error occurred processing intent {request.Intent}.",
                    ErrorCodes.ServerError, traceId,
                    request.Intent ?? "UNKNOWN_INTENT");

                await LogIntentAsync(request, err, false, ex.Message);
                return StatusCode(500, err);
            }
        }

        /// <summary>
        /// Production endpoint: accepts raw human text, classifies intent, then dispatches.
        /// Rate-limited to 20 req/min per user.
        /// </summary>
        [HttpPost("interpret")]
        [EnableRateLimiting("intent_per_user")]
        public async Task<IActionResult> InterpretText([FromBody] RawTextRequest rawRequest)
        {
            var traceId = HttpContext.TraceIdentifier;

            if (string.IsNullOrWhiteSpace(rawRequest?.Text))
            {
                return BadRequest(ActionResponse.Fail(
                    "No text provided for interpretation.",
                    ErrorCodes.EmptyInput, traceId));
            }

            if (rawRequest.Text.Length > 500)
            {
                return BadRequest(ActionResponse.Fail(
                    "Input text must not exceed 500 characters.",
                    ErrorCodes.ValidationError, traceId));
            }

            try
            {
                // Step 1: AI classifies raw text into a structured intent
                IntentRequest intentRequest;
                try
                {
                    intentRequest = await _aiProvider.ExtractIntentFromTextAsync(rawRequest.Text);
                }
                catch (Exception aiEx)
                {
                    _logger.LogWarning(aiEx, "AI provider failed for input: {Text}", rawRequest.Text);
                    return StatusCode(503, ActionResponse.Fail(
                        "AI classification is temporarily unavailable. Please try again.",
                        ErrorCodes.AiFailure, traceId));
                }

                if (string.IsNullOrWhiteSpace(intentRequest?.Intent) ||
                    intentRequest.Intent.Equals("UNKNOWN", StringComparison.OrdinalIgnoreCase))
                {
                    var unknownResp = ActionResponse.Fail(
                        "Could not identify a valid intent from the provided input.",
                        ErrorCodes.IntentUnknown, traceId, "UNKNOWN_INTENT");
                    await LogIntentAsync(intentRequest ?? new IntentRequest { Intent = "UNKNOWN" },
                                         unknownResp, false, "UNKNOWN_INTENT classified");
                    return BadRequest(unknownResp);
                }

                // Step 2: Dispatch the structured intent to the correct handler
                var response = await _dispatcher.DispatchAsync(intentRequest)
                    ?? ActionResponse.Fail("No response generated", ErrorCodes.DispatchFailed, traceId);

                response.Intent    = intentRequest.Intent ?? "UNKNOWN_INTENT";
                response.TraceId   = traceId;
                response.Timestamp = DateTime.UtcNow;

                if (!response.Success && string.IsNullOrEmpty(response.ErrorCode))
                    response.ErrorCode = ErrorCodes.DispatchFailed;

                if (!response.Success && response.ErrorCode == ErrorCodes.Forbidden)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }

                await LogIntentAsync(intentRequest, response, response.Success, response.Success ? null : response.Message);
                return response.Success ? Ok(response) : BadRequest(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "InterpretText failed for input: {Text}", rawRequest.Text);
                return StatusCode(500, ActionResponse.Fail(
                    "An unexpected server error occurred. Use the TraceId for support.",
                    ErrorCodes.ServerError, traceId));
            }
        }

        // ── Private helpers ──────────────────────────────────────────────────

        private async Task LogIntentAsync(
            IntentRequest   request,
            ActionResponse  response,
            bool            wasSuccessful,
            string?         errorMessage = null)
        {
            try
            {
                var log = new AiCommandLog
                {
                    Intent          = request.Intent ?? "UNKNOWN",
                    Entity          = request.Entity,
                    RawPayload      = JsonSerializer.Serialize(request),
                    ResponsePayload = JsonSerializer.Serialize(response),
                    WasSuccessful   = wasSuccessful,
                    ErrorMessage    = errorMessage
                };
                await _context.AiCommandLogs.AddAsync(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception logEx)
            {
                // Never let logging failures surface to the caller
                _logger.LogWarning(logEx, "Failed to persist AiCommandLog");
            }
        }
    }
}
