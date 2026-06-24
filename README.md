# 🎙️ FlowSpeak — Real-Time AI Intent Execution Engine

An industrial-grade, AI-augmented inventory management system that translates non-deterministic natural language commands into deterministic, safe, transactional database operations. Built using an ASP.NET Core 10 API, Entity Framework Core (supports SQL Server & SQLite), and a Vite + React dual‑mode UI dashboard.

FlowSpeak provides a reliable, secure bridge between human speech/text and enterprise data integrity by completely decoupling language parsing from backend database mutations.

---

## 🏛️ System Architecture & Tech Stack

The workspace is structured into a multi-tier architecture designed for high throughput, real-time observability, and cross-platform portability.

- **Backend Engine (`src/FlowSpeak.Api`):** An ASP.NET Core 10 Web API utilizing **SignalR** for real-time telemetry streaming and **Scalar OpenAPI** for high-fidelity interactive documentation.
- **AI Intelligence Layer:** Deep integration with rule-based intent parsing with deterministic execution.
- **Data Persistence Layer:** Powered by **Entity Framework Core**, supports SQL Server LocalDB (primary) and SQLite (fallback), with global soft‑delete query filters.
- **Frontend Client (`flowspeak-ui`):** Dual‑mode UI (Simple & Advanced) built with **React 19**, **Vite**, and **Tailwind CSS v4**.
- **Simple UI (`/app`):** Light, user‑friendly interface for regular users.
- **Advanced UI (`/app/advanced`):** Powerful 3‑panel tactical HUD for power users.

---

## 📐 Full‑Stack UI & Layout Architecture

### Component Breakdown

- **Frontend (`/flowspeak-ui`):** React 19 single‑page application built on Vite with Tailwind CSS v4.
  - **Dual‑Mode UI:** Simple mode (`/app`) for regular users, Advanced mode (`/app/advanced`) for power users.
  - **Role‑gated Navigation:** Tabs based on user role (Viewer/Sales/Admin).
  - **Real‑Time SignalR Telemetry Streaming:** Live updates on the dashboard.
- **Backend (`/src/FlowSpeak.Api`):** High‑throughput C# REST API with explicit CORS policies supporting ports 5000–5003 and 5173.
- **Database Layer (`AI_CommandLogs`):** Relational SQL tracking of client intents, parsed parameters, payloads, and state transitions.

### Advanced UI Layout (Tactical HUD)

The Command Center view (`App.jsx`) uses a mobile‑first responsive grid:

| Viewport            | Grid Layout      | Panel Layout Behavior                                                                                                                                     |
| :------------------ | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile / Tablet** | `grid-cols-1`    | Panels stack vertically. Execution Engine (`order-1`) renders first; Live Ledger (`order-2`) and Live Context (`order-3`) follow below.                   |
| **Desktop (`lg:`)** | `lg:grid-cols-3` | Three equal columns: **Live Ledger** (left), **Execution Engine** (center), **Live Context** (right). Full‑height panels with independent scroll regions. |

### Visual Baseline & Aesthetics

- **Advanced UI:** Strict high‑contrast dark‑mode design system with deep slate canvas and emerald/amber accents.
- **Simple UI:** Clean light‑theme interface for better user accessibility.
- **Typography:** Monospace (`font-mono`) for telemetry/logs; sans-serif for root app shell.
- **Data Stability:** `tabular-nums` for metrics to prevent layout shift on updates.

---

## 🛡️ Hardened Security & Enterprise Features

FlowSpeak implements rigorous defensive programming and cryptographic standards:

- **Input Validation:** All natural language payloads constrained to `[MaxLength(500)]` to mitigate injection attacks.
- **Token Hardening:** Secure dual‑token authentication (access + refresh tokens) with HttpOnly cookies (no localStorage exposure).
- **Role‑Based Access Control (RBAC):**
  - New users default to low‑privilege **Viewer** role.
  - Endpoint guards with `[Authorize(Roles = "...")]` attributes.
- **Data Integrity:** Optimistic concurrency control for product updates.

### 👥 User Roles & Permissions

| Feature                  | Viewer | Sales | Admin |
|--------------------------|--------|-------|-------|
| Simple UI Chat           | ✅     | ✅    | ✅    |
| Advanced Command Center  | ❌     | ✅    | ✅    |
| Dashboard & KPIs         | ❌     | ✅    | ✅    |
| Product Import (CSV)     | ❌     | ❌    | ✅    |
| Telemetry Logs           | ❌     | ❌    | ✅    |
| Modify Stock/Products    | ❌     | ✅    | ✅    |

#### Role Details:
- **Viewer**: Default for new users; read-only access to basic features
- **Sales**: Can process orders and use the dashboard
- **Admin**: Full access to all features and settings

---

## 💻 Cross‑Platform Prerequisites Matrix

| Dependency      | Windows                | macOS            | Linux            | Validation Command                |
| :-------------- | :--------------------- | :--------------- | :--------------- | :-------------------------------- |
| **.NET SDK**    | `v10.0+`               | `v10.0+`         | `v10.0+`         | `dotnet --version`                |
| **Node.js**     | `v18.0+` (LTS)         | `v18.0+` (LTS)   | `v18.0+` (LTS)   | `node -v`                         |
| **EF Core CLI** | `v10.0+`               | `v10.0+`         | `v10.0+`         | `dotnet ef --version`             |

---

## 🚀 Workspace Quick Start & Initialization

### 1. Repository Setup

```bash
git clone https://github.com/Faheembukshprog/FlowSpeak-Project.git
cd FlowSpeak-Project
```

### 2. Backend Setup & Run

```bash
cd src/FlowSpeak.Api
dotnet restore
dotnet build
dotnet run
```

Backend will be available at: `http://localhost:3001`

### 3. Frontend Setup & Run

```bash
cd flowspeak-ui
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5000`

---

## 🎯 Test Credentials

Use one of these test accounts:

| Role     | Username     | Password         |
| :------- | :----------- | :--------------- |
| **Admin** | `admin1`     | `Admin@123!`    |
| **Sales** | `sales_ali`  | `Sales@123!`    |
| **Viewer** | `viewer1`    | `View@123!`     |
| **New Test** | `flowuser` | `FlowSpeak123!` |

---

## 🔗 Important URLs

- **Landing Page:** `http://localhost:5000/`
- **Simple UI:** `http://localhost:5000/app`
- **Advanced UI:** `http://localhost:5000/app/advanced`
- **Backend API:** `http://localhost:3001/api/...`
- **Swagger Docs:** `http://localhost:3001/scalar`

---

## 📦 Project Structure

```
FlowSpeak-Project/
├── src/
│   └── FlowSpeak.Api/      # ASP.NET Core Backend
│       ├── Controllers/    # API Controllers
│       ├── Data/           # EF Core DbContext
│       └── Models/         # Entity Models
├── flowspeak-ui/           # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # Page Components
│   │   ├── contexts/       # React Contexts
│   │   └── state/          # State Management
│   └── package.json
└── README.md               # This file!
```

---

## ✨ Features

### Simple UI
- Light, clean interface
- Chat‑based interaction
- Transactions log
- Admin panel
- Easy navigation to Advanced Mode

### Advanced UI
- 3‑panel tactical HUD
- Live Ledger (real‑time transaction log)
- Execution Engine (chat interface)
- Live Context (product/order details)
- Dashboard with real‑time metrics
- Audit Log panel
- CSV Product Import (Admin only)

### Backend
- REST API with role‑based access
- SignalR real‑time telemetry
- Product/Order/Inventory management
- Secure authentication (JWT + refresh tokens)
- Entity Framework Core with SQLite

---

## 🔧 Troubleshooting

### Port Conflicts
- Backend: Uses port 3001
- Frontend: Uses ports 5000–5003
- CORS policy supports all these ports

### Build Errors
- **Backend:** If you see errors in `Product.cs`, ensure line 20 has `public string? Metadata { get; set; }`
- **Frontend:** Run `npm install` if dependencies are missing

### Login Issues
- Ensure backend is running at `http://localhost:3001`
- Try registering a new user first
