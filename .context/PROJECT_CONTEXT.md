# FlowSpeak - Project Context

## Project Overview

* **Project Name**: FlowSpeak
* **Purpose and goals**: Create an autonomous AI-driven orchestration system bridging human voice and enterprise data. It allows users to interact with complex databases using natural language audio, eliminating information lag and UI friction.
* **Problem being solved**: Non-technical stakeholders often struggle to pull data or enter information into complex enterprise systems (like ERPs/CRMs). Traditional UIs can be slow on the go.
* **Target users**: Warehouse Managers, Sales Representatives, and Executives who need hands-free, rapid data access.
* **Core features list**:
  * Voice-to-Intent translation using OpenAI-compatible APIs (Groq/Ollama).
  * Autonomous querying via an ASP.NET Core bridge.
  * Push Notifications for instant feedback.
  * Report generation (PDF/Excel) triggered by voice.
  * Security via Caller ID verification mapping.

## Tech Stack

* **Programming languages**: C# (Backend), JavaScript (n8n Workflows), SQL
* **Frameworks**: ASP.NET Core Web API, Entity Framework Core (Code-First)
* **Libraries**: Microsoft.EntityFrameworkCore.SqlServer
* **Tools**: n8n (Automation Engine), Groq Cloud / Local Ollama (AI APIs), Postman, Ngrok
* **Runtime requirements**: .NET 10.0 SDK, Node.js (for n8n), SQL Server (e.g. SQLEXPRESS)

## Architecture Overview

* **High-level system design**: Orchestrator-driven microservice pattern.
* **Component relationships**: 
  * A messaging platform (WhatsApp/Telegram) captures audio and sends it to n8n via Webhook.
  * n8n orchestrates the workflow, passing audio to Groq/Ollama for transcription and intent extraction.
  * n8n forwards the extracted structured JSON intent to the ASP.NET Core API.
  * The API uses EF Core to execute logic against the SQL Server database.
* **Data flow description**: 
  `User Audio` -> `n8n Webhook` -> `AI API (Groq)` -> `n8n` -> `ASP.NET API` -> `SQL Server` -> `n8n` -> `User Response`

## Folder Structure

```text
/
├── database/            # Contains raw SQL schema files and initial seed data references
├── docs/                # Architecture diagrams, API specs, and extended documentation
├── n8n-workflows/       # Exported .json files for n8n automation workflows
├── src/                 # Backend source code
│   └── FlowSpeak.Api/   # ASP.NET Core Web API project (Controllers, Models, Data contexts)
├── .env.example         # Environment variables template
├── AGENT_TASKS.md       # AI agent state tracking and task assignment
├── PROJECT_CONTEXT.md   # This file
├── README.md            # Standard developer landing page
└── SETUP_CHECKLIST.md   # Setup verification steps
```

## Environment Setup

### Required software
* .NET 10.0 SDK
* SQL Server (Express or standard)
* n8n (via npm or Docker)
* Ngrok (to expose local n8n webhooks)

### Installation steps
1. Clone the repository.
2. Navigate to `src/FlowSpeak.Api` and run `dotnet restore`.
3. Set up your local SQL Server instance.
4. Copy `.env.example` to `.env` and fill in API keys.

### Dependency setup
* Execute `dotnet tool install --global dotnet-ef` if not already installed.
* Apply EF Migrations: `dotnet ef database update`

### Environment variables (.env.example reference)
See the Configuration Templates section below.

### Run commands
* API: `dotnet run --project src/FlowSpeak.Api`
* n8n: `npx n8n`
* Ngrok: `ngrok http 5678`

## Configuration Templates

### .env.example
```env
# AI Configuration (Free tier for development)
# Uses Groq for OpenAI compatibility at zero cost
GROQ_API_KEY=your_free_groq_key_here

# Database Configuration
DB_CONNECTION_STRING="Server=localhost\\SQLEXPRESS;Database=FlowSpeakDB;Trusted_Connection=True;TrustServerCertificate=True;"

# n8n / Messaging Configuration
N8N_ENCRYPTION_KEY=random_string
WEBHOOK_URL=https://your-ngrok-url.io
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

## Development Workflow

* **Coding standards**: Standard C# naming conventions (PascalCase for classes/methods, camelCase for variables). Avoid raw SQL; heavily utilize Entity Framework Core.
* **Naming conventions**: API endpoints must follow RESTful plural noun structures (e.g., `/api/products`).
* **Git workflow**: Feature branch workflow. Main branches are protected.

## Testing Instructions

* **Testing framework**: xUnit, Moq
* **How to run tests**: `dotnet test` from the root directory.
* **Example test file structure**: Located in `/tests/FlowSpeak.Tests`, mirroring the structure of `src/`.

## Deployment Preparation

* **Build commands**: `dotnet publish -c Release -o ./publish`
* **Production setup notes**: Database connection strings must be rotated and securely injected. n8n must run securely behind a reverse proxy (e.g. Nginx).

## Assumptions

* The project aims to utilize a scalable, zero-cost AI model format (Groq API/Ollama) to keep student costs low while ensuring commercial scalability.
* The API will handle all business logic autonomously based on the AI's parsed JSON intents.
* n8n will handle standard error routing and fallback messages if the AI fails.

## Future Expansion Notes

* Add generic OAuth authentication for web dashboards.
* Containerize the entire stack into a `docker-compose.yml` for unified 1-click deployments.
