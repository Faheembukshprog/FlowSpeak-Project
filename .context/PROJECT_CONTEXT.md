# FlowSpeak - Master Project Context & Agent Directives

**CRITICAL AGENT DIRECTIVE:** This file is the absolute source of truth for the FlowSpeak project. Any AI agent, developer, or automated pipeline modifying this repository MUST adhere strictly to the boundaries, rules, and vision outlined here. Do NOT hallucinate architectures, and do NOT deviate from these technical constraints.

## 1. The End Product Vision (The "Holy Grail" of Enterprise AI)
FlowSpeak is not a chatbot; it is an **AI-Native Command Center** designed to completely replace clunky, traditional enterprise software (like complex inventory management dashboards or CRMs). 

### The User Journey
*   **The Problem:** Traditional UIs are slow, require heavy training, and force users to click through 15 menus just to check stock or create an order.
*   **The Solution:** A user types or speaks a natural command (e.g., *"Do we have enough Dell XPS 15s to fulfill an order of 40 units for Aptech?"*). FlowSpeak translates this into an actionable database execution in milliseconds.
*   **The UI Experience (Non-Negotiable):** The interface is a sleek, dark-mode "Heads-Up Display" divided into three fluid sections:
    1.  **The Command Chat (Center):** The focal point. Elegant, fast, and highly legible.
    2.  **Live Context Cards (Right Panel):** Dynamic, visual cards that show active records (e.g., product specs, stock levels) based on what the AI is currently discussing.
    3.  **The Live Ledger (Left Panel):** A running, transparent log of exact database transactions.

## 2. Architecture & Tech Stack
The architecture is based on a strict separation of concerns: **AI interprets intent; SQL provides truth.**

*   **Frontend (The Interface):** React 18, Vite, Tailwind CSS v4.
    *   *Rule:* Visual weight and functional clarity must be maintained with absolute, uncompromising elegance.
*   **Backend (The Execution Layer):** C# ASP.NET Core (.NET 8.0+).
    *   *Rule:* The API must act as an iron-clad bouncer. It receives strict JSON intents (`intent`, `entity`, `parameters`) from the NLP layer and handles all execution.
*   **Database (The Truth):** Microsoft SQL Server via Entity Framework Core.
    *   *Rule:* All interactions must pass through EF Core. 

## 3. Strict Zero-Hallucination Agent Rules
To ensure the system never hallucinates a fake product, loses data, or crashes, all AI agents modifying this code must obey the following:

*   **Rule A: No Raw SQL.** Agents are strictly forbidden from writing unparameterized SQL. Use `EF.Functions.Like` for fuzzy matching, and always use strongly-typed LINQ queries.
*   **Rule B: Iron-Clad Soft Deletion.** Ghost data is strictly forbidden. All database queries must explicitly check `IsDeleted == false`.
*   **Rule C: Telemetry Projection.** Never return raw database entities to the frontend. Always map responses to lean DTOs (e.g., `.Select(p => new Product {...})`) to prevent system IDs, metadata, and creation timestamps from leaking to the browser.
*   **Rule D: SPA Memory Management.** For the React frontend, always enforce array bounding (e.g., `.slice(-100)`) on rapidly updating states like Chat Logs or Transaction Ledgers. Do not allow infinite DOM expansion.
*   **Rule E: Defensive UI Rendering.** Handle all network failures gracefully via React error boundaries or `catch` blocks. The UI must never show a blank white screen of death.

## 4. Repository Structure

```text
/
├── flowspeak-ui/        # React / Vite / Tailwind v4 Single-Page Application
├── src/
│   └── FlowSpeak.Api/   # C# ASP.NET Core Web API (Controllers, Services, EF Contexts)
├── .context/            # Project context, setup checklists, and master rules
├── .env.example         # Template for required environment variables
└── README.md            # Quick-start setup instructions
```

## 5. Deployment Expectations
*   The API endpoint must always be abstracted behind `import.meta.env.VITE_API_ENDPOINT` in the frontend.
*   Hardcoded `localhost` strings in production UI components are forbidden.
*   All environment variables (`*.env`) must be aggressively blocked by `.gitignore`.
