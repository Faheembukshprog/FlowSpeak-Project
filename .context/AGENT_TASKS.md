# Current Goal

The immediate objective is to build out the API Endpoints (Controllers) interacting with the Entity Framework Data Core so that it can autonomously accept and map intents parsed by the Groq/Ollama AI over from n8n.

# Priority Tasks

* Initialize project structure (COMPLETED)
* Configure environment (COMPLETED)
* Build base components (COMPLETED)
  * Database Schema Implementation (COMPLETED)
  * AI Command Logs implementation (COMPLETED)
  * Seed Data Initialization (COMPLETED)
  * Create `ProductsController` (Handled via generic ActionController and ProductService)
  * Create `ActionController` (COMPLETED)
  * Complete AI-to-Database Action Bridge and Service Logic (COMPLETED)
* Implement core features (PENDING)
  * Connect Webhook endpoints to AI inference inside n8n.
* Add testing (PENDING)
  * Write xUnit tests to validate business logic isolation.
* Prepare deployment (PENDING)
  * Finalize `docker-compose.yml` to spin up n8n and SQL together.

# Task Format

**Task Name**: Implement Product Controller
**Description**: Generate REST endpoints for querying and inserting Products so the AI has specific bridges to execute inventory lookups.
**Input files**: `src/FlowSpeak.Api/Models/Product.cs`, `ApplicationDbContext.cs`
**Output files**: `src/FlowSpeak.Api/Controllers/ProductsController.cs`
**Expected Result**: A functioning HTTP GET/POST interface exposing Product data.

# Rules for Agents

* Always read `PROJECT_CONTEXT.md` first to understand architectural intent.
* Follow folder structure rules (keep API code inside `src/FlowSpeak.Api`).
* Validate dependencies before assuming they are installed.
* Write clean modular code following standard C# style guidelines.
* Do NOT run raw SQL queries; inject the `ApplicationDbContext` and use Entity Framework.
