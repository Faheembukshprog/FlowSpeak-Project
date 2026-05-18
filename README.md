# FlowSpeak — Deterministic Intent Execution Engine

An AI-augmented enterprise application separating non-deterministic language parsing from safe, transactional backend workflows. Built using an ASP.NET Core API, SQL Server database integration, and a Vite + React modular UI dashboard.

## 💻 Laptop Prerequisites Matrix (Cross-Platform)

To ensure a deterministic, reproducible environment on any machine, the following system-level dependencies are mandatory prior to executing the workspace setup:

| Dependency | Windows | macOS | Linux | Validation Command |
| :--- | :--- | :--- | :--- | :--- |
| **.NET SDK** | `v10.0+` | `v10.0+` | `v10.0+` | `dotnet --version` |
| **Node.js** | `v18.0+` (LTS) | `v18.0+` (LTS) | `v18.0+` (LTS) | `node -v` |
| **SQL Server** | SQL Server Express 2019/2022 | Docker: `mcr.microsoft.com/mssql/server` | Docker: `mcr.microsoft.com/mssql/server` | Connect via Azure Data Studio |
| **EF Core CLI** | `v10.0.6` | `v10.0.6` | `v10.0.6` | `dotnet ef --version` |

## 🗄️ Database Initialization

This application uses a local Microsoft SQL Server. If you are on **macOS/Linux**, start a local SQL Server via Docker before running the setup scripts:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=<YourStrongPassword>" \
   -p 1433:1433 --name sql1 \
   -d mcr.microsoft.com/mssql/server:2022-latest
```

*Note: Be sure to update `src/FlowSpeak.Api/appsettings.json` (copied from `appsettings.example.json`) with your explicit SQL Server IP or `localhost`, and the `<YourStrongPassword>` you specified above.*

---

## 🚀 Automated Workspace Initialization

This repository ships with fully automated deployment scripts. They will synchronize all NuGet and NPM packages, install global tooling, and execute Entity Framework migrations against your local database instance.

### Windows
Run the PowerShell setup file from the root directory:
```powershell
.\setup.ps1
```

### macOS / Linux
Run the Bash setup file from the root directory:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 📐 Completed Full-Stack Architecture

- **Frontend (`/flowspeak-ui`):** React 18 single-page application built on Vite with Tailwind CSS v4. Features a 3-tab layout containing an interactive conversational AI space, a chronological ledger, and telemetry.
- **Backend (`/src/FlowSpeak.Api`):** High-throughput C# REST API deploying explicit CORS policies mapping to `localhost:5173`.
- **Database Layer (`AI_CommandLogs`):** Relational SQL tracking data structures mapping client intents, parsed parameters, payload records, and exact database state transitions.

## ✅ Runtime Execution Guide

Once initialized via the setup script, you can run the services:

**Start the Backend (Port 5070):**
```bash
cd src/FlowSpeak.Api
dotnet run
```

**Start the Frontend (Port 5173):**
```bash
cd flowspeak-ui
npm run dev
```
