using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using FlowSpeak.Api.Models.DTOs;

namespace FlowSpeak.Api.Services.AI
{
    /// <summary>
    /// A deterministic, rule-based NLP engine running entirely on the backend.
    /// This replaces brittle frontend regex parsing with a robust, server-side
    /// natural language understanding pipeline.
    /// 
    /// Design: The AI interprets intent. SQL provides truth.
    /// This class is the "AI interpreter" — it NEVER touches the database.
    /// </summary>
    public class RuleBasedAIProvider : IAIProvider
    {
        // Verb clusters mapped to intents
        private static readonly (string Intent, string[] Verbs)[] IntentRules = new[]
        {
            ("RESERVE_STOCK", new[] { "reserve", "book", "order", "lock", "hold", "set aside", "allocate", "grab", "secure" }),
            ("CHECK_STOCK",   new[] { "check", "stock", "inventory", "available", "how many", "do we have", "look up", "find", "search", "show", "details", "info", "status", "quantity", "left" }),
        };

        // Quantity word mapping for natural language numbers
        private static readonly Dictionary<string, int> WordNumbers = new(StringComparer.OrdinalIgnoreCase)
        {
            { "a", 1 }, { "an", 1 }, { "one", 1 }, { "two", 2 }, { "three", 3 },
            { "four", 4 }, { "five", 5 }, { "six", 6 }, { "seven", 7 }, { "eight", 8 },
            { "nine", 9 }, { "ten", 10 }, { "eleven", 11 }, { "twelve", 12 },
            { "dozen", 12 }, { "twenty", 20 }, { "fifty", 50 }, { "hundred", 100 },
        };

        public Task<IntentRequest> ExtractIntentFromTextAsync(string text)
        {
            var clean = (text ?? "").Trim();
            var lower = clean.ToLowerInvariant();

            // Step 1: Determine the intent from verb clusters
            string matchedIntent = "UNKNOWN_INTENT";
            foreach (var (intent, verbs) in IntentRules)
            {
                foreach (var verb in verbs)
                {
                    if (lower.Contains(verb))
                    {
                        matchedIntent = intent;
                        goto intentResolved;
                    }
                }
            }
            intentResolved:

            // Step 2: Extract the entity (product name)
            var entity = ExtractEntity(clean, lower);

            // Step 3: Extract quantity (for transactional intents)
            var parameters = new Dictionary<string, string>();
            if (matchedIntent == "RESERVE_STOCK")
            {
                var qty = ExtractQuantity(lower);
                parameters["quantity"] = qty.ToString();
            }

            return Task.FromResult(new IntentRequest
            {
                Intent = matchedIntent,
                Entity = entity,
                Parameters = parameters
            });
        }

        public Task<IntentRequest> ExtractIntentFromAudioAsync(byte[] audio, string contentType)
        {
            // Placeholder: In the future, pipe audio through Azure Speech-to-Text,
            // then feed the transcript into ExtractIntentFromTextAsync.
            return Task.FromResult(new IntentRequest
            {
                Intent = "UNKNOWN",
                Entity = string.Empty,
                Parameters = new Dictionary<string, string>()
            });
        }

        /// <summary>
        /// Extracts the product entity name from natural language.
        /// Uses preposition-based extraction ("for X", "of X", "about X")
        /// and falls back to known brand detection.
        /// </summary>
        private static string ExtractEntity(string original, string lower)
        {
            // Strategy 1: Preposition extraction ("check stock for Dell XPS 15")
            var prepMatch = Regex.Match(original, @"(?:for|of|about|on|called|named)\s+(.+?)(?:\s*[?.!]?\s*$)", RegexOptions.IgnoreCase);
            if (prepMatch.Success)
            {
                var entity = CleanEntity(prepMatch.Groups[1].Value);
                if (entity.Length > 1) return entity;
            }

            // Strategy 2: Direct object extraction after transactional verbs
            var verbMatch = Regex.Match(original, @"(?:reserve|book|order|lock|hold|grab|check|find|show)\s+(?:\d+\s+)?(.+?)(?:\s*[?.!]?\s*$)", RegexOptions.IgnoreCase);
            if (verbMatch.Success)
            {
                var entity = CleanEntity(verbMatch.Groups[1].Value);
                if (entity.Length > 1) return entity;
            }

            // Strategy 3: Detect known brand names anywhere in the text
            var brands = new[] { "Dell", "Lenovo", "HP", "Asus", "Acer", "MacBook", "XPS", "ThinkPad", "Surface", "Samsung", "Widget" };
            foreach (var brand in brands)
            {
                if (lower.Contains(brand.ToLowerInvariant()))
                {
                    // Grab the brand + any trailing words (e.g., "Dell XPS 15 Laptop")
                    var brandMatch = Regex.Match(original, $@"({Regex.Escape(brand)}[\w\s-]*)", RegexOptions.IgnoreCase);
                    if (brandMatch.Success) return CleanEntity(brandMatch.Groups[1].Value);
                }
            }

            // Fallback: return the full cleaned text as the entity
            return CleanEntity(original);
        }

        /// <summary>
        /// Extracts a numeric quantity from natural language.
        /// Handles both digits ("5") and words ("dozen", "twelve").
        /// </summary>
        private static int ExtractQuantity(string lower)
        {
            // Strategy 1: Explicit digit match
            var digitMatch = Regex.Match(lower, @"\b(\d+)\b");
            if (digitMatch.Success && int.TryParse(digitMatch.Groups[1].Value, out int qty))
            {
                return qty;
            }

            // Strategy 2: Word-based number detection
            foreach (var (word, value) in WordNumbers)
            {
                if (Regex.IsMatch(lower, $@"\b{Regex.Escape(word)}\b"))
                {
                    return value;
                }
            }

            // Default: 1 unit
            return 1;
        }

        /// <summary>
        /// Strips filler words, articles, and punctuation from an extracted entity.
        /// </summary>
        private static string CleanEntity(string raw)
        {
            var cleaned = Regex.Replace(raw, @"\b(the|a|an|some|any|those|these|our|my|units?|of|in|please)\b", "", RegexOptions.IgnoreCase);
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
            cleaned = cleaned.TrimEnd('.', '?', '!', ',');
            return cleaned.Trim();
        }
    }
}
