# 🎙️ FlowSpeak — Real-Time AI Intent Execution Engine

An industrial-grade, AI-augmented inventory management system that translates non-deterministic natural language commands into deterministic, safe, transactional database operations. Built using an ASP.NET Core 10 API, Entity Framework Core, SQL Server database integration, and a Vite + React modular technical UI dashboard.

FlowSpeak provides a reliable, secure bridge between human speech/text and enterprise data integrity by completely decoupling language parsing from backend database mutations.

---

## 🏛️ System Architecture & Tech Stack

The workspace is structured into a multi-tier architecture designed for high throughput, real-time observability, and cross-platform portability.

- **Backend Engine (`src/FlowSpeak.Api`):** An ASP.NET Core 10 Web API utilizing **SignalR** for real-time telemetry streaming and **Scalar OpenAPI** for high-fidelity interactive documentation.
- **AI Intelligence Layer:** Deep integration with the **Groq Cloud LLM** for ultra-low latency inference, orchestrated using native `HttpClient` factory patterns.
- **Data Persistence Layer:** Powered by **Entity Framework Core**, featuring dynamic provider routing for **SQL Server** and **SQLite** fallbacks, alongside global soft-delete query filters.
- **Frontend Client (`flowspeak-ui`):** A minimalist, technical-aesthetic React dashboard built with **Vite** and **Tailwind CSS**.
- **Automation Workflows:** Custom **n8n blueprints** located in the `/n8n-workflows` directory for extensible external service orchestration.

---

## 📐 Full-Stack UI & Layout Architecture

### Component Breakdown

- **Frontend (`/flowspeak-ui`):** React 18 single-page application built on Vite with Tailwind CSS v4. Features a responsive 3-panel tactical HUD, role-gated navigation tabs, and real-time SignalR telemetry streaming.
- **Backend (`/src/FlowSpeak.Api`):** High-throughput C# REST API deploying explicit Cross-Origin Resource Sharing (CORS) policies mapping securely to the local UI tier.
- **Database Layer (`AI_CommandLogs`):** Relational SQL tracking data structures mapping client intents, parsed parameters, payload records, and exact database state transitions.

### Architecture & Layout Grid Engine

The Command Center view (`App.jsx`) uses a mobile-first responsive grid that scales from a single vertical stack into a triple-column tactical HUD:

| Viewport            | Grid Layout      | Panel Layout Behavior                                                                                                                                     |
| :------------------ | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile / Tablet** | `grid-cols-1`    | Panels stack vertically. Execution Engine (`order-1`) renders first; Live Ledger (`order-2`) and Live Context (`order-3`) follow below.                   |
| **Desktop (`lg:`)** | `lg:grid-cols-3` | Three equal columns: **Live Ledger** (left), **Execution Engine** (center), **Live Context** (right). Full-height panels with independent scroll regions. |

_The grid is capped at a maximum width of `1600px` and uses flex bounds to fill the viewport without overflow. Role-based tabs swap the main content area while preserving the global telemetry link._

### Visual Baseline & Aesthetics

The UI enforces a strict, high-contrast dark-mode design system:

- **Foundation:** Deep slate canvas `bg-[#0B0F19]` with elevated surfaces at `bg-[#0E1422]/50` and `bg-slate-950/40`.
- **Borders:** Razor-thin `border-slate-800/60` dividers; accent borders use emerald (`border-emerald-500/30`) or amber (`border-amber-500/40`) at low opacity for clear state indicators.
- **Typography:** Monospace (`font-mono`) for all telemetry log streams, ledger entries, intent labels, and panel headers to preserve alignment. Sans-serif is reserved for the root application shell only.
- **Data Stability:** Status badges and tabular metrics utilize `tabular-nums` alignment to prevent horizontal layout shifting during real-time data updates.
- **Motion:** Uniform `transition-all duration-150 ease-in-out` loops on interactive elements; custom unified scrollbar tracking via `.custom-scrollbar`.

---

## 🛡️ Hardened Security & Enterprise Features

FlowSpeak implements rigorous defensive programming and cryptographic standards to ensure production readiness:

- **Input Injection Defense:** All incoming natural language text payloads are strictly validated with a `[MaxLength(500)]` model constraint to mitigate prompt injection, token-draining attacks, and buffer overruns.
- **Cryptographic Token Hardening:** The session management tier completely outlaws plaintext token storage. The system utilizes a secure, 128-character cryptographic **SHA256 'RefreshTokenHash'** verified by `SecurityHelper.cs`, preventing session hijacking in the event of a cold database compromise.
- **Role-Based Access Control (RBAC):** \* _Secure Defaults:_ All new users registered via `AuthController.cs` default strictly to the low-privilege **Viewer** role.
  - _Endpoint Guards:_ Critical administrative data streams, such as the `TelemetryController.cs` log pipeline, are heavily fortified under an explicit `[Authorize(Roles = "Admin")]` attribute.
- **Data Race Prevention:** To block inventory double-allocation and data corruption during high-concurrency requests, the `Product` entity implements **Optimistic Concurrency Control** via a binary `RowVersion` shadow property. Tracking conflicts are caught cleanly inside `ProductService.cs` using `DbUpdateConcurrencyException`.

---

## 💻 Cross-Platform Prerequisites Matrix

To ensure a deterministic, reproducible environment on any engineering workstation, the following system-level dependencies should be validated prior to executing workspace initializations:

| Dependency      | Windows                | macOS            | Linux            | Validation Command                |
| :-------------- | :--------------------- | :--------------- | :--------------- | :-------------------------------- |
| **.NET SDK**    | `v10.0+`               | `v10.0+`         | `v10.0+`         | `dotnet --version`                |
| **Node.js**     | `v18.0+` (LTS)         | `v18.0+` (LTS)   | `v18.0+` (LTS)   | `node -v`                         |
| **SQL Server**  | Local Express Instance | Docker Container | Docker Container | Azure Data Studio Test Connection |
| **EF Core CLI** | `v10.0+`               | `v10.0+`         | `v10.0+`         | `dotnet ef --version`             |

---

## 🚀 Workspace Quick Start & Initialization

### 1. Repository Setup

Clone the repository and jump into the workspace directory:

```bash
git clone https://github.com/Faheembukshprog/FlowSpeak-Project.git
cd FlowSpeak-Project
```
