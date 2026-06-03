---
name: FlowSpeak Replit Setup
description: Key decisions made when setting up FlowSpeak in the Replit environment
---

# FlowSpeak Replit Setup

## Database
- Switched from SQL Server to SQLite (`Microsoft.EntityFrameworkCore.Sqlite` v10.0.6)
- SQLite connection string: `Data Source=flowspeak.db`
- Deleted original SQL Server migrations and regenerated with `dotnet exec .../dotnet-ef.dll migrations add InitialSqlite`

## .NET 10 SDK
- Path: `/nix/store/bjzmfa360s8f3n4xqlnkamy13fkywb2x-dotnet-sdk-10.0.101/bin`
- Must prefix PATH with this in workflow commands (default dotnet is 7.0)
- dotnet-ef global tool installed at `~/.dotnet/tools`; must run via `dotnet exec /home/runner/.dotnet/tools/.store/dotnet-ef/10.0.8/dotnet-ef/10.0.8/tools/net8.0/any/dotnet-ef.dll`

## Backend Port
- Runs on localhost:3001 (changed from original 5070)
- Backend workflow uses `--no-build` flag to avoid port-detection timeout
- Must pre-build with `dotnet build` before workflow starts if code changes
- Workflow configured WITHOUT `waitForPort` (startup takes ~15s due to EF migrations)

## Frontend
- Vite on port 5000 with `host: '0.0.0.0'` and `allowedHosts: true`
- Proxy: `/api` → `http://localhost:3001`, `/hubs` → `http://localhost:3001` (with ws:true)
- Frontend uses relative URLs (`/api/...`, `/hubs/...`) — no hardcoded API base

## CORS
- Backend CORS configured to `SetIsOriginAllowed(_ => true)` in dev when no FRONTEND_URL env var set

## Authentication
- JWT_SECRET set as shared env var (non-sensitive dev default)
- JwtService updated to use fallback secret without throwing

## Seeded Users
- `admin` / `admin123` (Admin role)
- `sales` / `sales123` (Sales role)

**Why:** SQL Server not available in Replit; dotnet 10 not in default PATH; migrations take >15s causing port-detection false failures.
