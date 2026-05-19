using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FlowSpeak.Api.Services.AI
{
    public class LlmAIProvider : IAIProvider
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LlmAIProvider> _logger;

        private const string SYSTEM_PROMPT = @"
You are the NLP engine for an Enterprise Command Center.
Your ONLY job is to parse the user's natural language into a strict JSON object with EXACTLY this schema:
{
  ""intent"": ""string (CHECK_STOCK, RESERVE_STOCK, or UNKNOWN_INTENT)"",
  ""entity"": ""string (The product name being requested)"",
  ""parameters"": {
    ""quantity"": ""string (Default to '1' if not specified but needed. MUST be a string, not a number)""
  }
}
Do NOT wrap the JSON in markdown code blocks like ```json. Output RAW JSON ONLY. Be extremely concise.";

        public LlmAIProvider(HttpClient httpClient, IConfiguration configuration, ILogger<LlmAIProvider> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<IntentRequest> ExtractIntentFromTextAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new IntentRequest { Intent = "UNKNOWN_INTENT", Entity = string.Empty };
            }

            // 1. Try Groq (Primary)
            try
            {
                var groqApiKey = _configuration["GROQ_API_KEY"];
                if (!string.IsNullOrEmpty(groqApiKey))
                {
                    var result = await CallGroqAsync(text, groqApiKey);
                    if (result != null) return result;
                }
                else
                {
                    _logger.LogWarning("GROQ_API_KEY is not set. Falling back directly to Ollama.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Groq API failed. Falling back to Ollama.");
            }

            // 2. Try Ollama (Fallback)
            try
            {
                var ollamaUrl = _configuration["OLLAMA_ENDPOINT"] ?? "http://localhost:11434";
                var ollamaModel = _configuration["OLLAMA_MODEL"] ?? "llama3.1";
                
                var result = await CallOllamaAsync(text, ollamaUrl, ollamaModel);
                if (result != null) return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ollama fallback also failed.");
            }

            // 3. Ultimate Fallback (Safety Net)
            return new IntentRequest { Intent = "UNKNOWN_INTENT", Entity = text };
        }

        public Task<IntentRequest> ExtractIntentFromAudioAsync(byte[] audio, string contentType)
        {
            throw new NotImplementedException("Audio intent extraction not yet supported via LLM.");
        }

        private async Task<IntentRequest?> CallGroqAsync(string text, string apiKey)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new { role = "system", content = SYSTEM_PROMPT },
                    new { role = "user", content = text }
                },
                response_format = new { type = "json_object" },
                temperature = 0.0
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            return ParseRawJsonToIntent(content);
        }

        private async Task<IntentRequest?> CallOllamaAsync(string text, string endpoint, string model)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint.TrimEnd('/')}/api/chat");

            var payload = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = SYSTEM_PROMPT },
                    new { role = "user", content = text }
                },
                format = "json",
                stream = false,
                options = new { temperature = 0.0 }
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement.GetProperty("message").GetProperty("content").GetString();

            return ParseRawJsonToIntent(content);
        }

        private IntentRequest? ParseRawJsonToIntent(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                
                var intent = new IntentRequest();
                
                if (root.TryGetProperty("intent", out var intentProp) && intentProp.ValueKind == JsonValueKind.String)
                    intent.Intent = intentProp.GetString() ?? "";
                    
                if (root.TryGetProperty("entity", out var entityProp) && entityProp.ValueKind == JsonValueKind.String)
                    intent.Entity = entityProp.GetString() ?? "";
                    
                if (root.TryGetProperty("parameters", out var paramsProp) && paramsProp.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in paramsProp.EnumerateObject())
                    {
                        intent.Parameters[prop.Name] = prop.Value.ToString();
                    }
                }
                
                return intent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize LLM JSON output: {Json}", json);
                return null;
            }
        }
    }
}
