# Local Setup Checklist

- [ ] Install required software (.NET 10.0 SDK, SQL Server, n8n, Ngrok)
- [ ] Clone project repository
- [ ] Install dependencies inside `src/FlowSpeak.Api` (`dotnet restore`)
- [ ] Configure environment variables
  - [ ] Copy `.env.example` to `.env`
  - [ ] Add your Groq API key or ensure Ollama is running locally.
  - [ ] Change the `DB_CONNECTION_STRING` to match your local SQL Server instance name.
  - [ ] Map the webhook URL to your ngrok address.
- [ ] Start development server (`dotnet run`)
- [ ] Run tests to ensure isolated components compile

# Verification Checklist

- [ ] Server starts successfully and `/api/health` returns status `200 OK`.
- [ ] No dependency errors via Entity Framework.
- [ ] Database is successfully generated after running `dotnet ef database update`.
- [ ] Environment variables loaded correctly without crashes.
- [ ] Basic workflow runs when triggering the n8n webhook URL.

# Troubleshooting Section

**1. The EF Core Database Migrations Fail**
*Fix:* Verify that your `DB_CONNECTION_STRING` in the `.env` (or `appsettings.json`) exactly matches your SQL server instance. If using SQL Express, it is usually `localhost\SQLEXPRESS`. Ensure you have run `dotnet tool install --global dotnet-ef`.

**2. Webhook URLs randomly stop working in n8n**
*Fix:* If you are using the free tier of Ngrok, your URL changes every time you restart ngrok. You must update the `.env` file and your Telegram/WhatsApp bot webhook configuration each time ngrok changes, or upgrade to a static Ngrok domain.

**3. n8n complains about an invalid OpenAI Key**
*Fix:* If you are using Groq, ensure you updated the **Base URL** over to `https://api.groq.com/openai/v1` inside the n8n node configuration natively. Otherwise, it will attempt to authenticate with OpenAI and fail.
