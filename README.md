# FlowSpeak — Deterministic Intent Execution Engine

An AI-augmented enterprise application separating non-deterministic language parsing from safe, transactional backend workflows. Built using an ASP.NET Core API, SQL Server database integration, and a Vite + React modular UI dashboard.

## 📥 Getting Started (Downloading from GitHub)

To run this project locally, first clone the repository from GitHub and navigate into the project folder:

```bash
git clone https://github.com/Faheembukshprog/FlowSpeak-Project.git
cd FlowSpeak-Project
```

Once downloaded, follow the prerequisites and initialization steps below to spin up the local environment.

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

- **Frontend (`/flowspeak-ui`):** React 18 single-page application built on Vite with Tailwind CSS v4. Features a responsive 3-panel tactical HUD, role-gated navigation tabs, and real-time SignalR telemetry streaming.
- **Backend (`/src/FlowSpeak.Api`):** High-throughput C# REST API deploying explicit CORS policies mapping to `localhost:5173`.
- **Database Layer (`AI_CommandLogs`):** Relational SQL tracking data structures mapping client intents, parsed parameters, payload records, and exact database state transitions.

### Architecture & Layout Engine

The Command Center view (`App.jsx`) uses a mobile-first responsive grid that scales from a vertical stack into a triple-column tactical HUD:

| Viewport | Grid | Layout |
| :--- | :--- | :--- |
| **Mobile / Tablet** | `grid-cols-1` | Panels stack vertically. Execution Engine (`order-1`) renders first; Live Ledger (`order-2`) and Live Context (`order-3`) follow below. |
| **Desktop (`lg:`)** | `lg:grid-cols-3` | Three equal columns: **Live Ledger** (left), **Execution Engine** (center), **Live Context** (right). Full-height panels with independent scroll regions. |

The grid is capped at `max-w-[1600px]` and uses `lg:flex-1 lg:min-h-0` to fill the viewport without overflow. Role-based tabs (Command, Dashboard, Audit Log, Import) swap the main content area while preserving the global header and telemetry link.

### Visual Baseline & Aesthetics

The UI enforces a strict technical dark-mode design system:

- **Foundation:** Deep slate canvas `bg-[#0B0F19]` with elevated surfaces at `bg-[#0E1422]/50` and `bg-slate-950/40`.
- **Borders:** Razor-thin `border-slate-800/60` dividers; accent borders use emerald (`border-emerald-500/30`) or amber (`border-amber-500/40`) at low opacity.
- **Typography:** Monospace (`font-mono`) for all telemetry, ledger entries, intent labels, and panel headers. Sans-serif reserved for the root shell only.
- **Baseline alignment:** Panel headers use `shrink-0` with synchronized `leading-none` icon/text pairs; status badges and tabular data use `tabular-nums` for column stability.
- **Motion:** Uniform `transition-all duration-150 ease-in-out` on interactive elements; custom scrollbar styling via `.custom-scrollbar`.

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

---

## 🧪 Developer Setup & Testing

### MCP Server Environment

FlowSpeak development integrates three Model Context Protocol (MCP) servers for agentic testing and visual validation inside Cursor:

| MCP Server | Purpose |
| :--- | :--- |
| **Puppeteer MCP** | Automated visual regression checks and headless UI screenshot auditing against the Vite dev server (`localhost:5173`). |
| **Chrome Inspect MCP** | Real-time DOM telemetry and active CSS layout debugging on live browser sessions. |
| **TestSprite MCP** | Agentic end-to-end flow verification and integration testing across the auth pipeline and API endpoints. |

Configure these servers in your Cursor MCP settings before running agent-driven test workflows.

### TestSprite Integration Tests

The authentication pipeline (Register, Login, Refresh, Logout) and telemetry endpoints have been hardened and verified via automated integration tests using the TestSprite MCP suite.

To run tests (requires `testsprite-mcp` configured):
```bash
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
```
*Current Status: 71.43% Passing. Auth pipeline is 100% stable. AI Action tests require local DB seeding to pass.*
