# FlowSpeak — Developer Source of Truth

## Current System Architecture

FlowSpeak implements a deterministic execution pipeline:

AI (Intent Extraction) → ASP.NET Core API → SQL Server → Response

This repository contains the backend execution spine. Intent extraction is handled by an external orchestrator and is not implemented as an active LLM integration in the codebase.

## Component Status

- `src/FlowSpeak.Api/Program.cs` — DONE
- `src/FlowSpeak.Api/Controllers/ActionController.cs` — DONE
- `src/FlowSpeak.Api/Services/Intent/IIntentDispatcher.cs` — DONE
- `src/FlowSpeak.Api/Services/Intent/IntentDispatcher.cs` — DONE
- `src/FlowSpeak.Api/Services/Intent/CheckStockHandler.cs` — DONE
- `src/FlowSpeak.Api/Services/ProductService.cs` — DONE
- `src/FlowSpeak.Api/Data/ApplicationDbContext.cs` — DONE
- `src/FlowSpeak.Api/Models/AiCommandLog.cs` — DONE
- `src/FlowSpeak.Api/Services/AI/IAIProvider.cs` — DONE (NullAIProvider stub)
- `src/FlowSpeak.Api/Services/AI/NullAIProvider.cs` — DONE (no active LLM integration)
- `src/FlowSpeak.Api/Services/Telemetry/ITelemetryService.cs` — DONE
- `src/FlowSpeak.Api/Services/Telemetry/NullTelemetryService.cs` — DONE (development sink)
- `docs/n8n_to_api_contract.md` — DONE
- `n8n-workflows/example_post_process.json` — DONE
- `tests/FlowSpeak.Tests/IntentDispatcherTests.cs` — DONE

## Implemented Components

- `ActionController` — receives `POST /api/action/process`, forwards incoming intent payloads, and logs audit records.
- `IntentDispatcher` — routes authenticated intents to registered handlers.
- `CheckStockHandler` — handles the `CHECK_STOCK` intent.
- `ProductService` — performs deterministic product lookup in SQL.
- `ApplicationDbContext` — EF Core database context with soft-delete filters and audit indexes.
- `AiCommandLog` — append-only audit log for intent requests and responses.
- `IAIProvider` / `NullAIProvider` — abstraction for AI extraction; current code uses a stub implementation.
- `ITelemetryService` / `NullTelemetryService` — telemetry abstraction and a console sink for local development.
- `n8n` contract docs and example workflow — describe external orchestration boundaries.

## Execution Flow

1. External orchestration extracts an `IntentRequest` from user input.
2. The orchestrator POSTs the structured JSON payload to `/api/action/process`.
3. `ActionController` receives the request and invokes `IntentDispatcher`.
4. `IntentDispatcher` selects the matching intent handler.
5. The active handler performs SQL retrieval via `ProductService`.
6. The API logs the request and response to `AiCommandLog` and returns the `ActionResponse`.

## Limitations / Missing Systems

- `src/FlowSpeak.Api/Services/AI/NullAIProvider.cs` is a stub; no active LLM integration exists in the repository.
- External orchestration via n8n is not embedded in this repo; only example artifacts and contract documentation are provided.
- Production telemetry backend is not implemented; only an abstraction and console sink are present.
- The repository does not include an API endpoint for long-running status polling.

## Local Setup

1. Configure the database connection using `DB_CONNECTION_STRING` or `appsettings.json`.
2. Open the `src/FlowSpeak.Api` folder.
3. Run:

```bash
dotnet restore
dotnet build
dotnet run
```

The project runs on `http://localhost:5070` by default.

## Database Setup

- A local SQL Server instance is required.
- EF Core migrations are applied automatically on startup.
- The connection string is loaded from `DB_CONNECTION_STRING` or `appsettings.json`.

## How to Test API (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:5070/api/action/process" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"intent":"CHECK_STOCK","entity":"Dell XPS 15 Laptop","parameters":{}}'
```

## Expected Response

A successful response returns JSON with:

- `success`: true or false
- `message`: a descriptive result message
- `data`: the returned product data or `null`

Example success response:

```json
{
  "success": true,
  "message": "Found 1 product(s) matching 'Dell XPS 15 Laptop'.",
  "data": [
    {
      "name": "Dell XPS 15 Laptop",
      "sku": "..."
    }
  ]
}
```

Example failure response:

```json
{
  "success": false,
  "message": "Sorry, I couldn't find that item in the inventory.",
  "data": null
}
```

## Git Workflow (Push Changes)

```bash
git status
git add .
git commit -m "docs: update setup and testing guide"
git push origin main
```

## Troubleshooting

- `400 Bad Request` → verify payload keys: `intent`, `entity`, and `parameters`.
- Empty result → check database seed data and confirm matching product rows.
- Port issues → verify `src/FlowSpeak.Api/Properties/launchSettings.json` or the configured application URL.
