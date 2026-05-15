# n8n → FlowSpeak API Contract

Purpose: define the minimal webhook and HTTP contract used by n8n to invoke the FlowSpeak backend at `/api/action/process`.

1. Webhook ingestion (n8n receives platform audio)

- n8n Webhook node must capture the incoming audio and metadata and call the AI provider (Groq/Ollama) to extract an `IntentRequest` JSON.
- Expected `IntentRequest` schema (posted to FlowSpeak):

```json
{
  "intent": "CHECK_STOCK",
  "entity": "12-3456",
  "parameters": { "productName": "Widget" },
  "callerPhone": "+15551234567",
  "rawAudioUrl": "https://.../file.ogg"
}
```

2. HTTP POST `/api/action/process`

- Headers: `Content-Type: application/json`
- Body: `IntentRequest` JSON as above
- Response: `ActionResponse` JSON with `Success`, `Message`, and optional `Data`.

3. Reliability recommendations (n8n)

- Use `Retry` or `If Error` nodes to retry on 5xx results (exponential backoff). Limit retries to avoid duplicate writes.
- On 4xx (bad intent), surface a friendly message to user and record audit.
- For long-running operations, n8n should send an acknowledgement, then poll or query `AiCommandLog` via a `GET` endpoint (to be added) for final status.

4. Observability hooks

- Add a `Set` node to attach `X-Request-Id` and `X-Caller-Phone` headers when calling the API; ensure `AiCommandLog.CallerPhone` is set from headers/body.

5. Example n8n Workflow: `n8n-workflows/example_post_process.json`

Use the included example in the repo as a template; adjust AI node settings (Groq base URL) and webhook auth per deployment.
