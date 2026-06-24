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
  ""intent"": ""string (CHECK_STOCK, RESERVE_STOCK, CREATE_ORDER, GET_ORDER_STATUS, CANCEL_ORDER, UPDATE_STOCK, ADD_PRODUCT, LIST_MY_ORDERS, LIST_ALL_ORDERS, SEARCH_PRODUCTS, REQUEST_QUOTE, or UNKNOWN_INTENT)"",
  ""entity"": ""string (The product name, order number, or search term being requested)"",
  ""parameters"": {
    ""quantity"": ""string (For RESERVE_STOCK, CREATE_ORDER, UPDATE_STOCK, ADD_PRODUCT, REQUEST_QUOTE - default to '1' if not specified. MUST be a string)"",
    ""orderNumber"": ""string (For GET_ORDER_STATUS, CANCEL_ORDER)"",
    ""sku"": ""string (For ADD_PRODUCT - optional SKU)"",
    ""price"": ""string (For ADD_PRODUCT - unit price)"",
    ""searchTerm"": ""string (For SEARCH_PRODUCTS - optional, if not provided list all)""
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

            // 1. Try Gemini (Primary if configured)
            try
            {
                var geminiApiKey = _configuration["GEMINI_API_KEY"];
                if (!string.IsNullOrEmpty(geminiApiKey))
                {
                    var result = await CallGeminiAsync(text, geminiApiKey);
                    if (result != null) return result;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini API failed. Falling back to Groq.");
            }

            // 2. Try Groq
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

            // 3. Try Ollama (Fallback)
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

            // 3. Rule-Based Offline Parser Fallback (Safety Net)
            var ruleResult = ExtractIntentRuleBased(text);
            if (ruleResult != null) return ruleResult;

            return new IntentRequest { Intent = "UNKNOWN_INTENT", Entity = text };
        }

        private IntentRequest? ExtractIntentRuleBased(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;
            var lower = text.ToLowerInvariant().Trim();

            // 1. CANCEL_ORDER
            if (lower.Contains("cancel"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(lower, @"fs-\d{8}-[a-f0-9]+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var req = new IntentRequest { Intent = "CANCEL_ORDER", Entity = match.Value.ToUpperInvariant() };
                    req.Parameters["orderNumber"] = match.Value.ToUpperInvariant();
                    return req;
                }
            }

            // 2. GET_ORDER_STATUS
            if (lower.Contains("status") || lower.Contains("track") || lower.Contains("where is"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(lower, @"fs-\d{8}-[a-f0-9]+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var req = new IntentRequest { Intent = "GET_ORDER_STATUS", Entity = match.Value.ToUpperInvariant() };
                    req.Parameters["orderNumber"] = match.Value.ToUpperInvariant();
                    return req;
                }
            }

            // 3. UPDATE_STOCK
            if (lower.Contains("update stock") || lower.Contains("set stock") || lower.Contains("adjust stock") || lower.Contains("change stock") || lower.Contains("set the stock"))
            {
                int quantity = -1;
                var matches = System.Text.RegularExpressions.Regex.Matches(lower, @"\d+");
                if (matches.Count > 0)
                {
                    int.TryParse(matches[matches.Count - 1].Value, out quantity);
                }

                string productName = "";
                var prodMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:stock of|stock for|set stock of|set stock for|update stock of|update stock for)\s+(.+?)(?:\s+to\s+\d+|\s+at\s+\d+|\s*$)");
                if (prodMatch.Success)
                {
                    productName = prodMatch.Groups[1].Value.Trim();
                }
                else
                {
                    var toIndex = lower.IndexOf("to ");
                    if (toIndex != -1)
                    {
                        var start = lower.IndexOf("stock of ");
                        if (start != -1)
                        {
                            productName = lower.Substring(start + 9, toIndex - (start + 9)).Trim();
                        }
                    }
                }

                if (!string.IsNullOrEmpty(productName) && quantity >= 0)
                {
                    var req = new IntentRequest { Intent = "UPDATE_STOCK", Entity = productName };
                    req.Parameters["quantity"] = quantity.ToString();
                    return req;
                }
            }

            // 4. ADD_PRODUCT
            if (lower.Contains("add product") || lower.Contains("create product") || lower.Contains("new product") || lower.Contains("insert product"))
            {
                var nameMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:add product|create product|new product|insert product)\s+([^,;]+)");
                if (nameMatch.Success)
                {
                    var remainder = nameMatch.Groups[1].Value;
                    string name = remainder;
                    string sku = "";
                    string price = "0";
                    string stock = "0";

                    var skuMatch = System.Text.RegularExpressions.Regex.Match(remainder, @"\bsku\s+([a-z0-9\-]+)\b");
                    if (skuMatch.Success) sku = skuMatch.Groups[1].Value.ToUpperInvariant();

                    var priceMatch = System.Text.RegularExpressions.Regex.Match(remainder, @"\bprice\s+(\d+(?:\.\d+)?)\b");
                    if (priceMatch.Success) price = priceMatch.Groups[1].Value;

                    var stockMatch = System.Text.RegularExpressions.Regex.Match(remainder, @"\b(?:stock|quantity)\s+(\d+)\b");
                    if (stockMatch.Success) stock = stockMatch.Groups[1].Value;

                    var cleanIndex = remainder.IndexOf("with sku", StringComparison.OrdinalIgnoreCase);
                    if (cleanIndex == -1) cleanIndex = remainder.IndexOf("sku", StringComparison.OrdinalIgnoreCase);
                    if (cleanIndex == -1) cleanIndex = remainder.IndexOf("price", StringComparison.OrdinalIgnoreCase);
                    if (cleanIndex == -1) cleanIndex = remainder.IndexOf("stock", StringComparison.OrdinalIgnoreCase);
                    if (cleanIndex != -1) name = remainder.Substring(0, cleanIndex).Trim();

                    var req = new IntentRequest { Intent = "ADD_PRODUCT", Entity = name.Trim() };
                    if (!string.IsNullOrEmpty(sku)) req.Parameters["sku"] = sku;
                    req.Parameters["price"] = price;
                    req.Parameters["quantity"] = stock;
                    return req;
                }
            }

            // 5. RESERVE_STOCK
            if (lower.Contains("reserve") || lower.Contains("order") || lower.Contains("book") || lower.Contains("hold"))
            {
                int quantity = 1;
                var qtyMatch = System.Text.RegularExpressions.Regex.Match(lower, @"\b(\d+)\b");
                if (qtyMatch.Success)
                {
                    int.TryParse(qtyMatch.Groups[1].Value, out quantity);
                }

                string productName = "";
                var prodMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:reserve|order|book|hold)\s+(?:\d+\s+)?(?:units of|unit of|units|unit)?\s*(.+?)(?:\s+for\s+|\s*$)");
                if (prodMatch.Success)
                {
                    productName = prodMatch.Groups[1].Value.Trim();
                }

                if (!string.IsNullOrEmpty(productName))
                {
                    var req = new IntentRequest { Intent = "RESERVE_STOCK", Entity = productName };
                    req.Parameters["quantity"] = quantity.ToString();
                    return req;
                }
            }

            // 6. CHECK_STOCK
            if (lower.Contains("stock") || lower.Contains("do we have") || lower.Contains("is there") || lower.Contains("check") || lower.Contains("quantity"))
            {
                string productName = "";
                var prodMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:check stock of|check stock for|stock of|stock for|do we have|is there any|check)\s+(.+)");
                if (prodMatch.Success)
                {
                    productName = prodMatch.Groups[1].Value.Trim();
                }
                else
                {
                    productName = lower.Replace("check stock of", "").Replace("check stock", "").Replace("do we have", "").Replace("stock of", "").Trim();
                }

                if (!string.IsNullOrEmpty(productName))
                {
                    return new IntentRequest { Intent = "CHECK_STOCK", Entity = productName };
                }
            }

            // 7. CREATE_ORDER
            if (lower.Contains("create order") || lower.Contains("place order") || (lower.Contains("order") && (lower.Contains("want") || lower.Contains("like") || lower.Contains("need"))))
            {
                int quantity = 1;
                var qtyMatch = System.Text.RegularExpressions.Regex.Match(lower, @"\b(\d+)\b");
                if (qtyMatch.Success)
                {
                    int.TryParse(qtyMatch.Groups[1].Value, out quantity);
                }

                string productName = "";
                var prodMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:order|create order|place order)\s+(?:\d+\s+)?(?:units of|unit of|units|unit)?\s*(.+?)(?:\s+for\s+|\s*$)");
                if (prodMatch.Success)
                {
                    productName = prodMatch.Groups[1].Value.Trim();
                }

                if (!string.IsNullOrEmpty(productName))
                {
                    var req = new IntentRequest { Intent = "CREATE_ORDER", Entity = productName };
                    req.Parameters["quantity"] = quantity.ToString();
                    return req;
                }
            }

            // 8a. LIST_ALL_ORDERS — Admin-only global ledger (check BEFORE LIST_MY_ORDERS)
            if (lower.Contains("show all orders") || lower.Contains("list all orders") || lower.Contains("all orders") || lower.Contains("every order") || lower.Contains("global orders"))
            {
                return new IntentRequest { Intent = "LIST_ALL_ORDERS", Entity = "" };
            }

            // 8b. LIST_MY_ORDERS — caller's own orders (all roles)
            if (lower.Contains("show my orders") || lower.Contains("list orders") || lower.Contains("my orders") || lower.Contains("order history") || lower.Contains("all my orders"))
            {
                return new IntentRequest { Intent = "LIST_MY_ORDERS", Entity = "" };
            }

            // 9. SEARCH_PRODUCTS
            if (lower.Contains("search") || lower.Contains("find products") || lower.Contains("browse") || lower.Contains("list products"))
            {
                string searchTerm = "";
                var searchMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:search|find|browse)\s+(?:for\s+)?(?:products?\s+)?(.+?)(?:\s*$)");
                if (searchMatch.Success)
                {
                    searchTerm = searchMatch.Groups[1].Value.Trim();
                }

                var req = new IntentRequest { Intent = "SEARCH_PRODUCTS", Entity = searchTerm };
                return req;
            }

            // 10. REQUEST_QUOTE
            if (lower.Contains("quote") || lower.Contains("pricing") || (lower.Contains("bulk") && (lower.Contains("order") || lower.Contains("price"))))
            {
                int quantity = 100; // Default bulk quantity
                var qtyMatch = System.Text.RegularExpressions.Regex.Match(lower, @"\b(\d+)\b");
                if (qtyMatch.Success)
                {
                    int.TryParse(qtyMatch.Groups[1].Value, out quantity);
                }

                string productName = "";
                var prodMatch = System.Text.RegularExpressions.Regex.Match(lower, @"(?:quote|pricing|bulk order)\s+(?:for|on)?\s+(.+?)(?:\s*$)");
                if (prodMatch.Success)
                {
                    productName = prodMatch.Groups[1].Value.Trim();
                }

                if (!string.IsNullOrEmpty(productName))
                {
                    var req = new IntentRequest { Intent = "REQUEST_QUOTE", Entity = productName };
                    req.Parameters["quantity"] = quantity.ToString();
                    return req;
                }
            }

            return null;
        }

        public Task<IntentRequest> ExtractIntentFromAudioAsync(byte[] audio, string contentType)
        {
            throw new NotImplementedException("Audio intent extraction not yet supported via LLM.");
        }

        private async Task<IntentRequest?> CallGeminiAsync(string text, string apiKey)
        {
            var endpoint = _configuration["GEMINI_ENDPOINT"] ?? "https://api.gemini.com/v1/chat/completions";
            var model = _configuration["GEMINI_MODEL"] ?? "gemini-prodigy";

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = SYSTEM_PROMPT },
                    new { role = "user", content = text }
                },
                temperature = 0.0
            };

            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            string? content = null;

            if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.ValueKind == JsonValueKind.Array && choices.GetArrayLength() > 0)
            {
                var message = choices[0].GetProperty("message");
                if (message.TryGetProperty("content", out var contentElement))
                    content = contentElement.GetString();
            }
            else if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.ValueKind == JsonValueKind.Array && candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var contentArray) && contentArray.ValueKind == JsonValueKind.Array && contentArray.GetArrayLength() > 0)
                {
                    var item = contentArray[0];
                    if (item.TryGetProperty("text", out var textElement))
                        content = textElement.GetString();
                }
            }

            return ParseRawJsonToIntent(content);
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
