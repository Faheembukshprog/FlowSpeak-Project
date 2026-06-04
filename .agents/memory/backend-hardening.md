---
name: Backend hardening patterns
description: Rate limiting, structured errors, and health check setup for FlowSpeak .NET 10 API
---

## Rate Limiting
- Built into ASP.NET Core .NET 7+ — NO extra NuGet package needed for `AddRateLimiter`/`UseRateLimiter`.
- Two policies: `intent_per_user` (SlidingWindow, 20 req/60s, keyed by JWT sub), `auth_per_ip` (FixedWindow, 10 req/60s, keyed by IP).
- `UseRateLimiter()` must be placed AFTER `UseCors()` and BEFORE `UseAuthentication()` in the middleware pipeline.
- `OnRejected` callback sets `Retry-After` header and returns `ApiProblem` JSON body.

**Why:** Brute-force login protection and intent endpoint abuse prevention without third-party deps.

## Structured Errors
- `ActionResponse` enriched with `ErrorCode` (string), `TraceId` (correlation), `Timestamp`.
- `ErrorCodes` static class defines canonical codes: EMPTY_INPUT, VALIDATION_ERROR, INTENT_UNKNOWN, DISPATCH_FAILED, AI_FAILURE, SERVER_ERROR, RATE_LIMITED.
- Global exception handler in Program.cs returns `ApiProblem` (RFC 7807).

## Health Check
- `AddDbContextCheck<T>()` requires `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore` NuGet — NOT built in. Omit it when doing a manual DB ping.
- `/api/health` — liveness only (fast).
- `/api/health/ready` — readiness: DB ping via `ExecuteSqlRawAsync("SELECT 1")`, telemetry channel backpressure check, JWT secret presence.
