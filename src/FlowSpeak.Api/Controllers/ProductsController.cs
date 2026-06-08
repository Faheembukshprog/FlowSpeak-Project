using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FlowSpeak.Api.Data;
using FlowSpeak.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowSpeak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("import")]
        [RequestSizeLimit(2 * 1024 * 1024)] // 2 MB limit
        public async Task<IActionResult> ImportCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "No file uploaded or file is empty." });
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { success = false, message = "Only CSV files are supported." });
            }

            var errors = new List<string>();
            int createdCount = 0;
            int updatedCount = 0;
            int totalProcessed = 0;

            try
            {
                using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
                string? line;
                bool isHeader = true;

                // Index tracking for headers (in case order varies)
                int skuIdx = 0;
                int nameIdx = 1;
                int priceIdx = 2;
                int stockIdx = 3;
                int vectorIdx = 4;

                while ((line = await reader.ReadLineAsync()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var fields = ParseCsvLine(line);
                    if (fields.Count == 0) continue;

                    // Parse header to map columns
                    if (isHeader)
                    {
                        isHeader = false;
                        
                        // Check if first row is actually a header row
                        var firstField = fields[0].ToLowerInvariant();
                        if (firstField == "sku" || firstField == "name" || firstField == "productname")
                        {
                            for (int i = 0; i < fields.Count; i++)
                            {
                                var h = fields[i].ToLowerInvariant();
                                if (h == "sku") skuIdx = i;
                                else if (h == "name" || h == "productname" || h == "product") nameIdx = i;
                                else if (h == "price" || h == "unitprice") priceIdx = i;
                                else if (h == "stock" || h == "stockquantity" || h == "quantity" || h == "qty") stockIdx = i;
                                else if (h == "searchvector" || h == "vector" || h == "tags") vectorIdx = i;
                            }
                            continue; // Skip the header row
                        }
                    }

                    totalProcessed++;
                    var rowNum = totalProcessed + (isHeader ? 0 : 1);

                    // Ensure minimum columns
                    var maxIdxNeeded = Math.Max(skuIdx, Math.Max(nameIdx, Math.Max(priceIdx, stockIdx)));
                    if (fields.Count <= maxIdxNeeded)
                    {
                        errors.Add($"Row {rowNum}: Insufficient columns. Minimum required fields are SKU, Name, Price, and Stock.");
                        continue;
                    }

                    var sku = fields[skuIdx].Trim().ToUpperInvariant();
                    var name = fields[nameIdx].Trim();
                    var priceStr = fields[priceIdx].Trim();
                    var stockStr = fields[stockIdx].Trim();
                    var vector = fields.Count > vectorIdx ? fields[vectorIdx].Trim() : "";

                    if (string.IsNullOrEmpty(sku))
                    {
                        errors.Add($"Row {rowNum}: SKU is required.");
                        continue;
                    }

                    if (string.IsNullOrEmpty(name))
                    {
                        errors.Add($"Row {rowNum}: Product Name is required.");
                        continue;
                    }

                    if (!decimal.TryParse(priceStr, out var price) || price <= 0)
                    {
                        errors.Add($"Row {rowNum}: Invalid price '{priceStr}'. Price must be a positive number.");
                        continue;
                    }

                    if (!int.TryParse(stockStr, out var stock) || stock < 0)
                    {
                        errors.Add($"Row {rowNum}: Invalid stock quantity '{stockStr}'. Stock must be a non-negative integer.");
                        continue;
                    }

                    try
                    {
                        // Active products only — global soft-delete filter applies
                        var product = await _context.Products
                            .FirstOrDefaultAsync(p => p.SKU == sku && p.IsDeleted == false);

                        if (product != null)
                        {
                            product.Name = name;
                            product.Price = price;
                            product.StockQuantity = stock;
                            if (!string.IsNullOrEmpty(vector)) product.SearchVector = vector;
                            product.UpdatedAt = DateTime.UtcNow;
                            updatedCount++;
                        }
                        else
                        {
                            // Block upsert when SKU belongs to a soft-deleted record
                            var deletedConflict = await _context.Products
                                .IgnoreQueryFilters()
                                .AnyAsync(p => p.SKU == sku && p.IsDeleted);

                            if (deletedConflict)
                            {
                                errors.Add($"Row {rowNum}: SKU '{sku}' belongs to a deleted product. Use a different SKU or restore the existing record.");
                                continue;
                            }

                            var newProduct = new Product
                            {
                                SKU = sku,
                                Name = name,
                                Price = price,
                                StockQuantity = stock,
                                SearchVector = string.IsNullOrEmpty(vector) ? $"{name.ToLower()} {sku.ToLower()} product" : vector,
                                Metadata = "{}"
                            };
                            await _context.Products.AddAsync(newProduct);
                            createdCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Row {rowNum}: Database error for SKU {sku}: {ex.Message}");
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    totalProcessed,
                    createdCount,
                    updatedCount,
                    errorsCount = errors.Count,
                    errors
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Failed to parse CSV: {ex.Message}" });
            }
        }

        private static List<string> ParseCsvLine(string line)
        {
            var result = new List<string>();
            var currentField = new StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    // Handle escaped double quotes inside quotes (e.g. "")
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        currentField.Append('"');
                        i++; // Skip the next quote
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(currentField.ToString());
                    currentField.Clear();
                }
                else
                {
                    currentField.Append(c);
                }
            }

            result.Add(currentField.ToString());
            return result;
        }
    }
}
