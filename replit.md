# FlowSpeak

An enterprise-grade, AI-augmented intent execution engine and command center. It separates non-deterministic language parsing (AI-assisted) from safe, transactional backend workflows.

## Architecture

- **Frontend**: React 19 + Vite (port 5000) — dark-mode command center UI with real-time telemetry via SignalR
- **Backend**: ASP.NET Core (.NET 10) API (port 3001) — intent dispatcher, JWT auth, SQLite database
- **Real-time**: SignalR with MessagePack protocol for live telemetry

## Running

Two workflows are configured:
- **Start application**: Frontend (Vite on port 5000), proxies `/api` and `/hubs` to backend
- **Backend API**: .NET API on port 3001

## Default Credentials

Seeded on first run:
- `admin` / `admin123` (Admin role)
- `sales` / `sales123` (Sales role)

## Tech Stack

- React 19, Vite 8, Tailwind CSS v4
- ASP.NET Core 10, Entity Framework Core + SQLite
- JWT authentication with HttpOnly cookies
- SignalR + MessagePack for telemetry

## User preferences

- Use SQLite for database (SQL Server not available in Replit)
- Backend runs on port 3001, frontend on port 5000
- Vite proxy routes `/api` and `/hubs` to localhost:3001
- Use .NET 10 SDK at `/nix/store/bjzmfa360s8f3n4xqlnkamy13fkywb2x-dotnet-sdk-10.0.101/bin`
