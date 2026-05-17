# FlowSpeak — Deterministic Intent Execution Engine

An AI-augmented enterprise application separating non-deterministic language parsing from safe, transactional backend workflows. Built using an ASP.NET Core API, SQL Server database integration, and a Vite + React modular UI dashboard.

## 📐 Completed Full-Stack Architecture

- **Frontend (`/flowspeak-ui`):** React 18 single-page application built on Vite with Tailwind CSS v4 and PostCSS styling engines. Features a 3-tab layout containing an interactive conversational AI space, a chronological ledger tracking client actions, and a live metrics telemetry board.
- **Backend (`/src/FlowSpeak.Api`):** High-throughput C# REST API deploying explicit Cross-Origin Resource Sharing (CORS) policies to interact natively with frontend origins via port `5070`.
- **Database Layer (`AI_CommandLogs`):** Relational SQL tracking data structures mapping client intents, parsed parameters, payload records, and exact database state transitions.

---

## 🛠️ Integrated Endpoints & Controllers

### 1. Action Routing (`ActionController.cs`)

- **Route:** `POST /api/action/process`
- **Objective:** Consumes user queries mapped by AI client-side tokens and executes strict, deterministic data checks.

### 2. Telemetry Streams (`TelemetryController.cs`)

- **Route:** `GET /api/telemetry/logs`
- **Objective:** Formulates real-time analytics by capturing the top 50 rows in `ApplicationDbContext` ordered by `ProcessedAt DESC` directly to the telemetry visualizer.

---

## 🦾 Ingested GitHub Copilot Capabilities

This repository integrates engineering skills and structural blueprints from `awesome-copilot`:

- **Contextual Anchoring:** All workspace routines utilize explicit `@workspace` targeting across domain contexts (`Program.cs`, `App.jsx`, database contexts).
- **ESM-Vite Guardrails:** Configurations are hardwired for ESM modular boundaries, avoiding breaking runtime anomalies across OS file structures.

---

## 🚀 Active Runtime Execution Guide

### Step 1: Fire up the Data Engine (Backend API)

```bash
cd E:\PR2-202408B\Aptech-Vision\FlowSpeak-Project
dotnet run --project src/FlowSpeak.Api/FlowSpeak.Api.csproj
```

### Step 2: Run the Frontend Dashboard

```bash
cd E:\PR2-202408B\Aptech-Vision\FlowSpeak-Project\flowspeak-ui
npm install
npm run dev
```

The frontend should be available at `http://localhost:5173` and consume the backend API at `http://localhost:5070`.

---

## ✅ End-to-End Verification Guide

### 1. Verify API Health

```bash
curl http://localhost:5070/api/health
```

Expected response:

```json
{
  "status": "FlowSpeak API is running",
  "time": "..."
}
```

### 2. Send a Valid CHECK_STOCK Intent

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5070/api/action/process" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"intent":"CHECK_STOCK","entity":"Widget","parameters":{}}'

$response | ConvertTo-Json
```

Expected success response:

```json
{
  "success": true,
  "message": "Found 1 product(s) matching 'Widget'.",
  "data": [
    {
      "id": "...",
      "name": "Widget",
      "sku": "W-001"
    }
  ]
}
```

### 3. Validate Telemetry Endpoint

```bash
curl http://localhost:5070/api/telemetry/logs
```

Expected behavior:

- Returns the top 50 rows from `AI_CommandLogs`
- Ordered by `ProcessedAt DESC`
- Includes the most recent CHECK_STOCK request

### 4. Confirm SQL Audit Logging

Use SQL Server Management Studio or sqlcmd:

```sql
USE FlowSpeakDB;
SELECT TOP 10
  Id,
  Intent,
  Entity,
  WasSuccessful,
  ErrorMessage,
  ProcessedAt
FROM AI_CommandLogs
ORDER BY ProcessedAt DESC;
```

Expected verification:

- Most recent log rows exist
- `Intent` values include `CHECK_STOCK` and any unknown intents
- `WasSuccessful` is `1` for success and `0` for failures

### 5. Negative Test: Unknown Intent

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5070/api/action/process" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"intent":"UNKNOWN_INTENT","entity":"test","parameters":{}}'

$response | ConvertTo-Json
```

Expected failure response:

```json
{
  "success": false,
  "message": "Unknown intent: UNKNOWN_INTENT",
  "data": null
}
```

Confirm the audit log reflects the failure with `WasSuccessful = 0` and `ErrorMessage` containing `Unknown intent`.

---

## 🧪 Integration Tests & Validation Rules

This README documents the repository-level validation necessary for the full stack:

- Frontend UI connects successfully to `http://localhost:5173`
- Backend API responds to `POST /api/action/process`
- `GET /api/telemetry/logs` returns the most recent 50 telemetry rows
- SQL Server contains seeded `Products` and audit-ready `AI_CommandLogs`
- CORS is configured for `http://localhost:5173`

### Recommended Local Test Sequence

1. Start backend: `dotnet run --project src/FlowSpeak.Api/FlowSpeak.Api.csproj`
2. Start frontend: `npm run dev` inside `flowspeak-ui`
3. Open `http://localhost:5173`
4. Submit a `CHECK_STOCK` action via the UI or API endpoint
5. Confirm telemetry list updates and new audit rows appear in SQL

---

## 🧩 GitHub Copilot Workflow Notes

The repository has been shaped with Copilot-driven scaffolding in mind:

- explicit file targeting with `@workspace`
- consistent code and docs alignment across backend, frontend, and database domains
- repeatable runtime commands for local development and validation

---

## 🚧 Troubleshooting

- `400 Bad Request` → confirm JSON keys: `intent`, `entity`, and `parameters`
- No frontend connectivity → verify `http://localhost:5173` and backend port `5070`
- SQL seed missing → confirm `DB_CONNECTION_STRING` or `appsettings.json` points to a local SQL Server instance
- `CORS` failures → ensure backend has `AllowLocalhost5173` policy enabled in `Program.cs`

---

## Git Workflow

```bash
git status
git add README.md
git commit -m "docs: restore full README with architecture and verification guide"
git push origin main
```
