# Software Engineering Quality Assurance Master Framework
## Enterprise-Grade Review Standard for React + .NET Application Ecosystems

**Framework Version:** 2.0  
**Target Maturity:** Principal/Staff Engineering Level  
**Compliance Standard:** Enterprise Production-Grade  
**AI Review Compatibility:** Full Autonomous Agent Support  
**Last Updated:** 2026-Q2

---

## Executive Engineering Overview

### Framework Purpose

This document establishes the definitive quality assurance standard for evaluating React + .NET application ecosystems at enterprise scale. It serves as the authoritative engineering governance framework for:

- **Pre-Production Release Certification**: Validating system readiness for production deployment
- **Architecture Review Boards**: Evaluating design decisions and technical strategy
- **Technical Due Diligence**: Assessing acquisition targets or platform migrations
- **Engineering Performance Audits**: Measuring team maturity and delivery excellence
- **Incident Post-Mortems**: Analyzing systemic quality failures
- **AI-Assisted Code Review**: Enabling autonomous engineering evaluation

### Strategic Engineering Objectives

| Objective | Measurement Criteria | Target Threshold |
|-----------|---------------------|------------------|
| Architecture Integrity | Clean Architecture compliance, SOLID adherence | ≥ 90% |
| Security Posture | OWASP Top 10 mitigation, zero critical vulnerabilities | 100% |
| Performance Efficiency | P95 response time, resource utilization optimization | ≤ 200ms API, ≤ 2s FCP |
| Operational Resilience | MTTR, error budget consumption, SLA compliance | ≥ 99.9% |
| Testing Coverage | Unit, integration, E2E coverage with mutation testing | ≥ 85% |
| Technical Debt Ratio | Code smells, maintainability index, cyclomatic complexity | ≤ 5% |
| Release Velocity | Deployment frequency, lead time, change failure rate | Daily deploys, ≤ 5% CFR |

### Audit Execution Model

**Phase 1: Automated Analysis** (AI-driven)
- Static code analysis across entire codebase
- Dependency vulnerability scanning
- Performance profiling and bottleneck detection
- Architecture pattern recognition
- Test coverage calculation

**Phase 2: Human Expert Review** (Principal/Staff Engineer)
- Architecture decision validation
- Security threat modeling
- Performance optimization strategy
- Scalability assessment
- Operational readiness evaluation

**Phase 3: Risk Classification**
- Critical: Deployment blocker, immediate remediation required
- High: Production risk, sprint-priority resolution
- Medium: Technical debt, backlog prioritization
- Low: Enhancement opportunity, continuous improvement

---

## Engineering Governance Model

### Review Authority Matrix

| Review Type | Required Approvers | Execution Frequency | Blocking Status |
|-------------|-------------------|---------------------|-----------------|
| Architecture Decision Records (ADR) | Principal Engineer, Architect | Per major design change | Hard block |
| Security Audit | Security Engineer, AppSec Lead | Pre-release, quarterly | Hard block |
| Performance Review | Staff Engineer, SRE Lead | Sprint milestone, pre-release | Soft block |
| Code Quality Gate | Tech Lead, 2x Senior Engineers | Per PR, automated | Soft block |
| Production Readiness | CTO/VP Engineering, SRE, Security | Pre-deployment | Hard block |
| Technical Debt Assessment | Engineering Manager, Architect | Quarterly | Informational |

### Engineering Excellence Standards

**Code Review Protocol:**
```
MANDATORY CHECKS:
☐ Architecture pattern consistency validated
☐ SOLID principles adherence confirmed
☐ Security implications analyzed
☐ Performance impact assessed
☐ Test coverage requirements met (≥80% new code)
☐ Error handling completeness verified
☐ Logging/observability instrumented
☐ Documentation updated (ADR, API docs, README)
☐ Breaking changes flagged and communicated
☐ Dependency vulnerabilities scanned (CRITICAL = 0)
```

**Pull Request Quality Gates:**
- **Automatic Rejection Criteria:**
  - Critical security vulnerabilities detected
  - <80% test coverage on new code
  - Cyclomatic complexity >15 in any method
  - Duplicate code blocks >50 lines
  - API breaking changes without deprecation strategy
  - Missing observability instrumentation
  - Hard-coded credentials or secrets

**Merge Criteria Scoring:**
```
SCORE = (Code_Quality * 0.25) + (Test_Coverage * 0.20) + 
        (Security_Scan * 0.25) + (Performance_Impact * 0.15) + 
        (Documentation * 0.10) + (Architecture_Compliance * 0.05)

PASS_THRESHOLD = 85/100
```

---

## Enterprise Architecture Review

### Architecture Maturity Assessment

#### Tier 1: Foundational Architecture Validation

**Architectural Pattern Compliance:**

| Pattern Category | Required Standard | Validation Method | Risk if Non-Compliant |
|-----------------|-------------------|-------------------|----------------------|
| Layered Architecture | Clean Architecture (Interface→Application→Domain→Infrastructure) | Dependency graph analysis, namespace inspection | High: Coupling, rigidity, testability issues |
| Separation of Concerns | Bounded contexts with clear interfaces | Module cohesion metrics, cross-cutting analysis | Medium: Maintenance complexity, team coordination |
| Dependency Management | Dependency injection throughout, IoC containers | Static analysis of constructor parameters | High: Testing difficulty, tight coupling |
| Domain-Driven Design | Aggregates, entities, value objects properly modeled | Code review of domain layer structure | Medium: Business logic leakage, anemic models |

**Anti-Pattern Detection Checklist:**
```
CRITICAL ANTI-PATTERNS (Deployment Blocker):
☐ God Objects: Single class >1000 LOC or >20 dependencies
☐ Spaghetti Code: Cyclomatic complexity >20, nested conditionals >4 levels
☐ Tight Coupling: Concrete class dependencies instead of abstractions
☐ Magic Numbers/Strings: Hard-coded business logic constants
☐ Circular Dependencies: Module A ↔ Module B reference cycles
☐ Leaky Abstractions: Infrastructure concerns in domain layer
☐ Shotgun Surgery: Single feature change requires >5 file modifications
```

#### Tier 2: Scalability Architecture Patterns

**Horizontal Scalability Requirements:**
```yaml
stateless_service_design:
  requirement: All application services must be stateless
  validation:
    - No in-memory session state
    - No local file system dependencies
    - External state in Redis/PostgreSQL only
  risk: Cannot scale horizontally, single point of failure

distributed_caching_strategy:
  requirement: Multi-tier caching with invalidation strategy
  layers:
    - L1: In-memory application cache (5-minute TTL)
    - L2: Distributed Redis cache (1-hour TTL)
    - L3: CDN edge cache (24-hour TTL)
  validation: Cache hit ratio >80%, invalidation latency <100ms

asynchronous_processing:
  requirement: Long-running operations must be async
  patterns:
    - Message queues (RabbitMQ/Azure Service Bus)
    - Background job processing (Hangfire/.NET BackgroundService)
    - Event-driven architecture (domain events)
  validation: No blocking I/O in request path, P99 latency <500ms
```

**Database Scalability Patterns:**
| Pattern | Implementation Standard | Validation Criteria |
|---------|------------------------|---------------------|
| Read Replicas | Primary-replica topology with read routing | Read queries >90% to replicas |
| Connection Pooling | Min 10, Max 100 connections per instance | Zero connection exhaustion events |
| Query Optimization | All queries <100ms, proper indexing | Query execution plans reviewed |
| Sharding Strategy | Horizontal partitioning by tenant/region | Balanced shard distribution |
| CQRS Implementation | Separate read/write models for complex domains | Command/query segregation verified |

#### Tier 3: Resilience and Fault Tolerance

**Circuit Breaker Pattern Implementation:**
```csharp
// REQUIRED: All external service calls must use circuit breakers
// Library: Polly for .NET
public class ResilientServiceClient
{
    private readonly IAsyncPolicy<HttpResponseMessage> _circuitBreakerPolicy;
    
    public ResilientServiceClient()
    {
        _circuitBreakerPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, duration) => 
                    _logger.LogError("Circuit breaker opened for {duration}", duration),
                onReset: () => 
                    _logger.LogInformation("Circuit breaker reset")
            );
    }
    
    // Validation: All HttpClient calls wrapped in resilience policy
}
```

**Retry Strategy Standards:**
```
EXPONENTIAL BACKOFF REQUIREMENTS:
- Initial retry delay: 100ms
- Max retry attempts: 3
- Backoff multiplier: 2x
- Max delay: 5 seconds
- Idempotency key required for POST/PUT/DELETE operations
- Jitter injection: ±20% to prevent thundering herd

VALIDATION CHECKS:
☐ Idempotent operation design confirmed
☐ Retry budget limits enforced (max 3 retries per request)
☐ Exponential backoff implemented (not fixed intervals)
☐ Circuit breaker integration validated
☐ Distributed tracing context propagated across retries
```

**Graceful Degradation Strategy:**
| Service Dependency | Degradation Behavior | User Impact | Recovery SLA |
|--------------------|---------------------|-------------|--------------|
| Payment Gateway | Queue transactions, process async | Delayed payment confirmation | <5 minutes |
| Search Service | Fall back to database query | Slower search results | <1 minute |
| Recommendation Engine | Show static/cached recommendations | Less personalized content | <15 minutes |
| Analytics Service | Disable real-time analytics | No real-time dashboard updates | <30 minutes |

---

## React Frontend Engineering Audit

### Component Architecture Standards

#### Component Design Principles

**Atomic Design Hierarchy:**
```
REQUIRED STRUCTURE:
/src
  /components
    /atoms          # Button, Input, Icon, Label
    /molecules      # FormField, SearchBar, Card
    /organisms      # Header, Sidebar, DataTable, Form
    /templates      # PageLayout, DashboardLayout
    /pages          # Actual route components

VALIDATION CRITERIA:
☐ Atoms: Pure, no business logic, <50 LOC
☐ Molecules: Composed atoms, minimal state, <150 LOC
☐ Organisms: Complex components, contained business logic, <300 LOC
☐ Pages: Route handlers only, delegate to organisms
☐ No direct API calls in presentational components
☐ All components have PropTypes/TypeScript interfaces
```

**Component Complexity Metrics:**
| Metric | Threshold | Severity | Remediation |
|--------|-----------|----------|-------------|
| Lines of Code per Component | ≤200 | Medium | Extract sub-components |
| Props Count | ≤8 | Low | Use composition or context |
| Conditional Rendering Depth | ≤3 | High | Extract to separate components |
| useEffect Hooks per Component | ≤4 | Medium | Extract custom hooks |
| Direct DOM Manipulation | 0 | Critical | Use React refs properly |
| Inline Function Definitions | ≤2 | Low | Extract to useCallback |

#### State Management Architecture

**Redux/Context Strategy:**
```typescript
// REQUIRED: Normalized state shape for scalable applications
interface ApplicationState {
  entities: {
    users: Record<string, User>;
    products: Record<string, Product>;
    orders: Record<string, Order>;
  };
  ui: {
    modals: Record<string, ModalState>;
    notifications: Notification[];
    loading: Record<string, boolean>;
  };
  domain: {
    cart: CartState;
    checkout: CheckoutState;
    auth: AuthState;
  };
}

// VALIDATION CHECKS:
// ☐ State normalized (no nested duplicates)
// ☐ Selectors memoized with reselect/useMemo
// ☐ Actions follow FSA (Flux Standard Action) pattern
// ☐ Reducers are pure functions (no side effects)
// ☐ Async logic in middleware (Redux Thunk/Saga) or React Query
// ☐ No prop drilling beyond 2 levels (use context/Redux)
```

**State Management Decision Matrix:**
| Use Case | Solution | Rationale |
|----------|----------|-----------|
| Global app state (auth, theme) | React Context API | Simple, built-in, sufficient for non-frequent updates |
| Server cache state (API data) | React Query / TanStack Query | Automatic caching, refetching, optimistic updates |
| Complex client state (multi-step forms) | Redux Toolkit | Time-travel debugging, predictable state transitions |
| URL state (filters, pagination) | React Router params/search | Shareable URLs, browser history integration |
| Component local state | useState/useReducer | Encapsulated, no global pollution |

#### Performance Optimization Standards

**Rendering Performance Requirements:**
```javascript
// MANDATORY: React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Render logic
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});

// MANDATORY: useCallback for event handlers passed to children
const ParentComponent = () => {
  const handleClick = useCallback((id) => {
    // Handler logic
  }, []); // Dependencies array
  
  return <ChildComponent onClick={handleClick} />;
};

// MANDATORY: useMemo for expensive computations
const Dashboard = ({ transactions }) => {
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      // Expensive calculation
    }, {});
  }, [transactions]);
};

// VALIDATION:
// ☐ React DevTools Profiler: No component rendering >16ms
// ☐ Lighthouse Performance Score: ≥90
// ☐ First Contentful Paint (FCP): ≤2 seconds
// ☐ Time to Interactive (TTI): ≤3.5 seconds
// ☐ Total Blocking Time (TBT): ≤200ms
// ☐ Cumulative Layout Shift (CLS): ≤0.1
```

**Code Splitting Strategy:**
```javascript
// REQUIRED: Route-based code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Bundle size targets:
// - Main bundle: ≤200 KB gzipped
// - Route chunks: ≤100 KB gzipped each
// - Vendor bundle: ≤150 KB gzipped
// - Total initial load: ≤350 KB gzipped

// VALIDATION:
// ☐ webpack-bundle-analyzer report reviewed
// ☐ No route bundle exceeds 100 KB gzipped
// ☐ Shared dependencies properly chunked
// ☐ Tree-shaking verified (no unused exports)
// ☐ Dynamic imports used for large libraries
```

**Image Optimization Requirements:**
| Requirement | Standard | Validation Method |
|-------------|----------|-------------------|
| Format Selection | WebP with JPEG fallback | Picture element or format detection |
| Lazy Loading | Native loading="lazy" attribute | Lighthouse audit verification |
| Responsive Images | srcset with 3+ breakpoints | Network tab, device emulation |
| Compression | ≤100 KB for photos, ≤20 KB for icons | Image analysis tools |
| CDN Delivery | CloudFront/Cloudflare with cache | Response headers inspection |

#### Accessibility (a11y) Compliance

**WCAG 2.1 Level AA Requirements:**
```html
<!-- MANDATORY: Semantic HTML -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main role="main" aria-labelledby="page-title">
  <h1 id="page-title">Dashboard</h1>
  
  <!-- MANDATORY: ARIA labels for interactive elements -->
  <button 
    aria-label="Close modal"
    aria-expanded="true"
    aria-controls="modal-content"
  >
    <span aria-hidden="true">×</span>
  </button>
  
  <!-- MANDATORY: Form labels -->
  <label for="email-input">Email Address</label>
  <input 
    id="email-input"
    type="email"
    aria-required="true"
    aria-invalid="false"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert"></span>
</main>

<!-- VALIDATION CHECKLIST:
☐ Keyboard navigation: All interactive elements accessible via Tab
☐ Focus indicators: Visible focus outlines (not outline: none)
☐ Color contrast: ≥4.5:1 for normal text, ≥3:1 for large text
☐ Screen reader testing: NVDA/JAWS compatibility confirmed
☐ Skip links: "Skip to main content" implemented
☐ Live regions: aria-live for dynamic content updates
☐ Form validation: Error messages associated with fields
☐ Image alt text: Meaningful descriptions for all images
-->
```

**Accessibility Audit Tooling:**
- **Automated:** axe DevTools, Lighthouse a11y audit (score ≥95)
- **Manual:** Keyboard navigation testing, screen reader verification
- **Legal Compliance:** ADA Title III, Section 508, AODA compliance

#### Frontend Security Standards

**XSS Prevention Requirements:**
```javascript
// MANDATORY: Content Security Policy
const cspHeader = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://cdn.trusted.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim()
};

// MANDATORY: Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const UserGeneratedContent = ({ html }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// VALIDATION:
// ☐ CSP header configured and tested
// ☐ No eval() or new Function() usage
// ☐ User-generated content sanitized
// ☐ innerHTML usage audited and justified
// ☐ External script loading whitelisted only
```

**Authentication Flow Security:**
```javascript
// REQUIRED: Secure token handling
class AuthService {
  // Tokens stored in httpOnly cookies (not localStorage)
  async login(credentials) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    // Access token in httpOnly cookie (set by server)
    // Refresh token in secure, httpOnly cookie
    // CSRF token in custom header
    return response.json();
  }
  
  // VALIDATION CHECKS:
  // ☐ No JWT stored in localStorage (XSS vulnerability)
  // ☐ httpOnly cookies used for tokens
  // ☐ CSRF protection implemented (double-submit cookie pattern)
  // ☐ Logout clears all authentication state
  // ☐ Token expiration handled gracefully
  // ☐ Refresh token rotation implemented
}
```

---

## .NET Backend Engineering Audit

### Clean Architecture Implementation

#### Layered Architecture Standards

**Required Project Structure:**
```
Solution: MyApp
├── MyApp.Domain              # Enterprise business rules
│   ├── Entities/             # Domain entities (POCOs)
│   ├── ValueObjects/         # Immutable value types
│   ├── Aggregates/           # Aggregate roots
│   ├── DomainEvents/         # Domain event definitions
│   └── Interfaces/           # Repository interfaces (persistence ignorance)
│
├── MyApp.Application         # Application business rules
│   ├── Commands/             # CQRS write operations
│   ├── Queries/              # CQRS read operations
│   ├── DTOs/                 # Data transfer objects
│   ├── Validators/           # FluentValidation rules
│   ├── Mappings/             # AutoMapper profiles
│   └── Interfaces/           # Service interfaces
│
├── MyApp.Infrastructure      # External concerns
│   ├── Persistence/          # EF Core, repositories
│   ├── ExternalServices/     # Third-party integrations
│   ├── Caching/              # Redis, memory cache
│   ├── Messaging/            # RabbitMQ, Service Bus
│   └── FileStorage/          # S3, Azure Blob
│
└── MyApp.Api                 # Presentation layer
    ├── Controllers/          # REST endpoints
    ├── Middleware/           # Request pipeline
    ├── Filters/              # Exception, authorization filters
    └── Program.cs            # DI configuration

VALIDATION:
☐ Domain layer has zero external dependencies
☐ Application layer references only Domain
☐ Infrastructure implements Application interfaces
☐ API layer references only Application + Infrastructure
☐ Dependency flow: API → Infrastructure → Application → Domain
```

**Dependency Injection Configuration Standards:**
```csharp
// Program.cs - REQUIRED SERVICE REGISTRATION PATTERN
public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        // MANDATORY: Layer-specific extension methods
        builder.Services.AddDomainServices();        // Domain event handlers
        builder.Services.AddApplicationServices();   // MediatR, validators
        builder.Services.AddInfrastructureServices(  // Repositories, cache
            builder.Configuration);
        builder.Services.AddApiServices();           // Controllers, filters
        
        // MANDATORY: Dependency lifetime verification
        // Singleton: Stateless services, caching
        // Scoped: DbContext, repositories, request-bound
        // Transient: Lightweight, stateless utilities
        
        var app = builder.Build();
        app.Run();
    }
}

// VALIDATION CHECKLIST:
// ☐ No service locator anti-pattern (manual DI container resolution)
// ☐ Constructor injection used throughout (not property injection)
// ☐ Captive dependencies avoided (Transient in Singleton)
// ☐ Dependency registration validated at startup
// ☐ Configuration injected as IOptions<T>
```

#### CQRS Pattern Implementation

**Command/Query Separation Standards:**
```csharp
// COMMANDS - Write operations with business validation
public record CreateOrderCommand(
    Guid CustomerId,
    List<OrderItemDto> Items,
    string ShippingAddress
) : IRequest<Result<Guid>>;

public class CreateOrderCommandHandler 
    : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInventoryService _inventoryService;
    private readonly IEventPublisher _eventPublisher;
    
    public async Task<Result<Guid>> Handle(
        CreateOrderCommand command, 
        CancellationToken cancellationToken)
    {
        // REQUIRED: Input validation via FluentValidation
        // REQUIRED: Business rule enforcement
        // REQUIRED: Domain event publication
        // REQUIRED: Transaction management
        
        var order = Order.Create(
            command.CustomerId, 
            command.Items, 
            command.ShippingAddress);
        
        await _orderRepository.AddAsync(order, cancellationToken);
        await _eventPublisher.PublishAsync(
            new OrderCreatedEvent(order.Id), 
            cancellationToken);
        
        return Result<Guid>.Success(order.Id);
    }
}

// QUERIES - Read operations optimized for performance
public record GetOrdersByCustomerQuery(
    Guid CustomerId,
    int PageNumber,
    int PageSize
) : IRequest<PagedResult<OrderDto>>;

public class GetOrdersByCustomerQueryHandler 
    : IRequestHandler<GetOrdersByCustomerQuery, PagedResult<OrderDto>>
{
    private readonly IReadOnlyOrderRepository _repository;
    private readonly IMemoryCache _cache;
    
    public async Task<PagedResult<OrderDto>> Handle(
        GetOrdersByCustomerQuery query,
        CancellationToken cancellationToken)
    {
        // REQUIRED: Caching strategy for frequently accessed data
        // REQUIRED: Pagination for large result sets
        // REQUIRED: Projection to DTOs (no entity exposure)
        
        var cacheKey = $"orders:customer:{query.CustomerId}:page:{query.PageNumber}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await _repository.GetPagedByCustomerAsync(
                query.CustomerId, 
                query.PageNumber, 
                query.PageSize, 
                cancellationToken);
        });
    }
}

// VALIDATION:
// ☐ Commands mutate state, queries do not
// ☐ MediatR pipeline behaviors: Logging, validation, transaction
// ☐ Command handlers return Result<T> (not exceptions for validation)
// ☐ Query handlers use read-optimized repositories
// ☐ No business logic in controllers (thin layer)
```

#### Entity Framework Core Optimization

**Performance Configuration Standards:**
```csharp
public class ApplicationDbContext : DbContext
{
    // REQUIRED: No-tracking for read-only queries
    public IQueryable<Order> OrdersReadOnly => 
        Orders.AsNoTracking();
    
    // REQUIRED: Compiled queries for hot paths
    private static readonly Func<ApplicationDbContext, Guid, Task<Order?>> 
        GetOrderByIdQuery = EF.CompileAsyncQuery(
            (ApplicationDbContext context, Guid id) =>
                context.Orders
                    .Include(o => o.Items)
                    .FirstOrDefault(o => o.Id == id));
    
    // REQUIRED: Query filters for soft delete
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => !o.IsDeleted);
        
        // REQUIRED: Indexes on foreign keys and query columns
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.CustomerId);
        
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.OrderDate);
        
        // REQUIRED: Value conversions for enums/value objects
        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>();
    }
    
    // REQUIRED: Connection resilience
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    }
}

// QUERY OPTIMIZATION CHECKLIST:
// ☐ Eager loading (Include) vs lazy loading vs explicit loading assessed
// ☐ Select projections used (avoid loading entire entities)
// ☐ Pagination implemented (Skip/Take, never load all)
// ☐ N+1 query problems identified and resolved
// ☐ Query execution plans reviewed in database
// ☐ Indexes created for all foreign keys and filter columns
// ☐ Connection pooling configured (min: 5, max: 100)
```

**Migration and Schema Management:**
| Requirement | Standard | Validation |
|-------------|----------|------------|
| Migration Naming | Timestamped descriptive names | Code review |
| Rollback Scripts | Down() method implemented for all | Manual verification |
| Data Migration Safety | Separate data migrations from schema | Staging environment test |
| Breaking Changes | Backward-compatible multi-phase deployment | ADR documentation |
| Index Creation | Online index builds (no table locks) | Production deployment review |

### Asynchronous Programming Standards

**Async/Await Best Practices:**
```csharp
// REQUIRED: Async all the way (no blocking calls)
public class GoodAsyncService
{
    private readonly HttpClient _httpClient;
    private readonly IRepository _repository;
    
    // ✅ CORRECT: Fully asynchronous
    public async Task<Result<Order>> ProcessOrderAsync(
        Guid orderId, 
        CancellationToken cancellationToken)
    {
        // ConfigureAwait(false) in library code (not needed in ASP.NET Core)
        var order = await _repository.GetByIdAsync(orderId, cancellationToken);
        
        var paymentResponse = await _httpClient.PostAsync(
            "/payment", 
            order.ToPaymentRequest(), 
            cancellationToken);
        
        await _repository.UpdateAsync(order, cancellationToken);
        
        return Result<Order>.Success(order);
    }
    
    // ❌ ANTI-PATTERN: Blocking on async code (causes deadlocks)
    public Order ProcessOrderSync(Guid orderId)
    {
        // DON'T: .Result or .Wait() in async code
        return ProcessOrderAsync(orderId, CancellationToken.None).Result;
    }
}

// VALIDATION:
// ☐ No .Result or .Wait() calls in async methods
// ☐ CancellationToken passed through call chain
// ☐ Task.WhenAll used for parallel operations (not sequential awaits)
// ☐ ValueTask used for high-frequency hot paths
// ☐ IAsyncEnumerable for streaming large datasets
```

**Background Job Processing:**
```csharp
// REQUIRED: Hosted services for background processing
public class OrderProcessingBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderProcessingBackgroundService> _logger;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Order processing service started");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider
                    .GetRequiredService<IOrderProcessor>();
                
                await processor.ProcessPendingOrdersAsync(stoppingToken);
                
                // REQUIRED: Configurable polling interval
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing orders");
                // REQUIRED: Exponential backoff on errors
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}

// ALTERNATIVE: Hangfire for persistent job scheduling
// VALIDATION:
// ☐ Graceful shutdown handling (CancellationToken respected)
// ☐ Scoped service resolution (avoid captive dependencies)
// ☐ Error handling with exponential backoff
// ☐ Health checks for background services
// ☐ Metrics/logging for job execution
```

### Authentication and Authorization

**JWT Authentication Implementation:**
```csharp
// REQUIRED: Secure JWT configuration
public class JwtSettings
{
    public string SecretKey { get; set; } = null!;  // ≥256-bit key
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public int ExpirationMinutes { get; set; } = 15;      // Access token
    public int RefreshExpirationDays { get; set; } = 7;   // Refresh token
}

public class JwtService
{
    private readonly JwtSettings _settings;
    
    public string GenerateAccessToken(User user, IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, 
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };
        
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// REQUIRED: Authorization policies
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // REQUIRED: Resource-based authorization
            options.AddPolicy("CanEditOrder", policy =>
                policy.RequireRole("OrderManager", "Admin"));
            
            options.AddPolicy("CanViewSensitiveData", policy =>
                policy.RequireClaim("DataAccessLevel", "L3", "L4"));
            
            // REQUIRED: Custom requirements for complex logic
            options.AddPolicy("CanAccessCustomerData", policy =>
                policy.Requirements.Add(new CustomerAccessRequirement()));
        });
    }
}

// VALIDATION:
// ☐ JWT secret key ≥256 bits, stored in Azure Key Vault/AWS Secrets Manager
// ☐ Access token expiration ≤15 minutes
// ☐ Refresh token rotation implemented
// ☐ Token validation: Issuer, audience, expiration checked
// ☐ HTTPS-only (no tokens over HTTP)
// ☐ Authorization policies defined (not just authentication)
```

**Role-Based Access Control (RBAC) Standards:**
```csharp
// REQUIRED: Fine-grained permissions model
[Authorize(Policy = "CanEditOrder")]
[HttpPut("api/orders/{id}")]
public async Task<IActionResult> UpdateOrder(
    Guid id, 
    [FromBody] UpdateOrderRequest request)
{
    // REQUIRED: Additional resource-level authorization
    var order = await _orderService.GetByIdAsync(id);
    
    if (!User.CanAccessCustomer(order.CustomerId))
    {
        return Forbid(); // 403, not 401
    }
    
    // Business logic
}

// VALIDATION:
// ☐ Authorization at controller + method level
// ☐ Resource-level checks in handler (not just role checks)
// ☐ Separate authentication (401) from authorization (403) responses
// ☐ Audit logging for authorization failures
// ☐ Regular access review process documented
```

---

## Database Integrity & Performance Validation

### Schema Design Standards

**Normalization and Denormalization Strategy:**
```sql
-- REQUIRED: Proper normalization for transactional tables
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id),
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- REQUIRED: Check constraints for data integrity
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_status CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'))
);

-- REQUIRED: Indexes for foreign keys and query patterns
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_status ON orders(status);

-- REQUIRED: Composite index for common query patterns
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC);

-- DENORMALIZATION: Read-optimized views for reporting
CREATE MATERIALIZED VIEW order_summary_by_customer AS
SELECT 
    c.customer_id,
    c.email,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.email;

-- REQUIRED: Refresh strategy for materialized views
CREATE INDEX idx_order_summary_customer_id ON order_summary_by_customer(customer_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY order_summary_by_customer;

-- VALIDATION CHECKLIST:
-- ☐ Third normal form (3NF) for transactional tables
-- ☐ Denormalized views for read-heavy operations
-- ☐ Referential integrity enforced (foreign keys)
-- ☐ Check constraints for business rules
-- ☐ Unique constraints where appropriate
-- ☐ NOT NULL constraints for required fields
```

### Query Performance Optimization

**Index Strategy and Analysis:**
| Index Type | Use Case | Performance Impact | Maintenance Cost |
|------------|----------|-------------------|------------------|
| B-Tree (default) | Equality, range queries, sorting | High query speedup | Low maintenance |
| Hash | Exact equality lookups only | Very fast equality | Low maintenance |
| GIN/GiST | Full-text search, JSON columns | Flexible search | Higher maintenance |
| Partial Index | Filtered queries (WHERE status = 'Active') | Smaller index size | Conditional benefit |
| Covering Index | Index-only scans (INCLUDE columns) | Eliminates table lookups | Larger index size |

**Query Performance Standards:**
```sql
-- REQUIRED: Execution plan analysis for all queries
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT o.order_id, o.total_amount, c.email
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'Pending'
  AND o.order_date >= NOW() - INTERVAL '30 days'
ORDER BY o.order_date DESC
LIMIT 50;

-- VALIDATION CRITERIA:
-- ☐ No sequential scans on tables >10,000 rows
-- ☐ Index scans used for filtered queries
-- ☐ Join strategies efficient (nested loop vs hash join)
-- ☐ Query execution time <100ms for 95th percentile
-- ☐ Shared buffer hit ratio >95%
-- ☐ No N+1 queries (use JOIN or batch loading)

-- REQUIRED: Statistics and maintenance
ANALYZE orders;  -- Update query planner statistics
VACUUM ANALYZE orders;  -- Reclaim space + update stats

-- ANTI-PATTERN: SELECT * (retrieve only needed columns)
-- CORRECT: Explicit column selection
SELECT order_id, total_amount, status FROM orders;
```

**Database Monitoring Metrics:**
```sql
-- REQUIRED: Slow query monitoring
-- Log queries exceeding threshold
ALTER DATABASE myapp SET log_min_duration_statement = 100;  -- 100ms

-- REQUIRED: Connection pool monitoring
SELECT count(*) AS active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- REQUIRED: Index usage analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
ORDER BY schemaname, tablename;

-- VALIDATION:
-- ☐ Active connections <80% of max_connections
-- ☐ All indexes used (idx_scan > 0) or justified
-- ☐ Cache hit ratio >95% (pg_stat_database)
-- ☐ Deadlocks = 0 (pg_stat_database.deadlocks)
-- ☐ Transaction rollback rate <5%
```

### Data Integrity and Consistency

**Transaction Management Standards:**
```csharp
// REQUIRED: Unit of Work pattern with transactions
public class OrderService
{
    private readonly ApplicationDbContext _context;
    
    public async Task<Result> CreateOrderAsync(CreateOrderRequest request)
    {
        using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.ReadCommitted);
        
        try
        {
            // REQUIRED: All-or-nothing operations
            var order = new Order(request.CustomerId, request.Items);
            await _context.Orders.AddAsync(order);
            
            // REQUIRED: Inventory deduction in same transaction
            foreach (var item in request.Items)
            {
                var product = await _context.Products
                    .FindAsync(item.ProductId);
                product.DecreaseStock(item.Quantity);
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return Result.Success();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Order creation failed");
            return Result.Failure("Transaction failed");
        }
    }
}

// VALIDATION:
// ☐ ACID compliance verified for critical operations
// ☐ Isolation level appropriate (ReadCommitted default)
// ☐ Transaction scope minimized (short-lived)
// ☐ Deadlock detection and retry logic
// ☐ Optimistic concurrency control (RowVersion) for updates
```

**Audit Logging Requirements:**
```csharp
// REQUIRED: Comprehensive audit trail
public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }  // Soft delete
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}

// REQUIRED: Audit log for sensitive operations
public class AuditLog
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = null!;
    public string Action { get; set; } = null!;  // Create, Update, Delete
    public string EntityType { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public string? OldValues { get; set; }  // JSON
    public string? NewValues { get; set; }  // JSON
    public DateTime Timestamp { get; set; }
    public string IpAddress { get; set; } = null!;
}

// VALIDATION:
// ☐ All write operations audited (Create, Update, Delete)
// ☐ User identity captured (not system user)
// ☐ Timestamp with timezone information
// ☐ IP address and user agent logged
// ☐ Before/after state for updates
// ☐ Immutable audit log (append-only)
// ☐ Retention policy defined and enforced
```

---

## API Governance & Contract Testing

### REST API Design Standards

**RESTful Endpoint Conventions:**
```
RESOURCE-BASED URL STRUCTURE (REQUIRED):

✅ CORRECT:
GET    /api/v1/customers                 # List customers
GET    /api/v1/customers/{id}            # Get customer by ID
POST   /api/v1/customers                 # Create customer
PUT    /api/v1/customers/{id}            # Update customer
PATCH  /api/v1/customers/{id}            # Partial update
DELETE /api/v1/customers/{id}            # Delete customer

GET    /api/v1/customers/{id}/orders     # Get customer's orders
POST   /api/v1/customers/{id}/orders     # Create order for customer

❌ INCORRECT (RPC-style, not RESTful):
POST   /api/v1/createCustomer
POST   /api/v1/getCustomerById
POST   /api/v1/updateCustomerInfo

VALIDATION RULES:
☐ Use nouns, not verbs in URLs
☐ Plural resource names (/customers, not /customer)
☐ Hierarchical relationships: /resource/{id}/sub-resource
☐ Versioning in URL path (/api/v1/, /api/v2/)
☐ kebab-case for multi-word resources (/order-items)
☐ Query parameters for filtering, sorting, pagination
   Example: GET /api/v1/orders?status=pending&sort=-createdAt&page=2&limit=50
```

**HTTP Status Code Standards:**
| Status Code | Use Case | Response Body |
|-------------|----------|---------------|
| 200 OK | Successful GET, PUT, PATCH | Resource representation |
| 201 Created | Successful POST (resource created) | Created resource + Location header |
| 204 No Content | Successful DELETE or update with no return | Empty |
| 400 Bad Request | Validation errors, malformed request | Error details with field-level errors |
| 401 Unauthorized | Missing or invalid authentication | WWW-Authenticate header |
| 403 Forbidden | Authenticated but insufficient permissions | Reason (no sensitive details) |
| 404 Not Found | Resource doesn't exist | Error message |
| 409 Conflict | Duplicate resource, business rule violation | Conflict details |
| 422 Unprocessable Entity | Semantic validation errors | Field-level validation errors |
| 429 Too Many Requests | Rate limit exceeded | Retry-After header |
| 500 Internal Server Error | Unexpected server error | Generic error message (no stack trace) |
| 503 Service Unavailable | Dependency failure, maintenance mode | Retry-After header |

**Standardized Error Response Format:**
```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "traceId": "00-abc123-def456-00",
  "errors": {
    "email": ["Invalid email format"],
    "password": ["Must be at least 8 characters"]
  }
}

// REQUIRED: Problem Details (RFC 7807) implementation
public class ApiError
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "about:blank";
    
    [JsonPropertyName("title")]
    public string Title { get; set; } = null!;
    
    [JsonPropertyName("status")]
    public int Status { get; set; }
    
    [JsonPropertyName("traceId")]
    public string TraceId { get; set; } = null!;
    
    [JsonPropertyName("errors")]
    public Dictionary<string, string[]>? Errors { get; set; }
}

// VALIDATION:
// ☐ Consistent error format across all endpoints
// ☐ Trace ID for correlation with logs
// ☐ No sensitive information in errors (stack traces, internal paths)
// ☐ Field-level validation errors for 400/422 responses
// ☐ Machine-readable error types
```

### API Versioning Strategy

**Version Management Standards:**
```csharp
// REQUIRED: URL path versioning
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class CustomersV1Controller : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<CustomerDto>>> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        // Version 1 implementation
    }
}

[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class CustomersV2Controller : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<CustomerDtoV2>>> GetCustomers(
        [FromQuery] CustomerQueryParameters parameters)
    {
        // Version 2 with enhanced features
    }
}

// REQUIRED: Deprecation strategy
[ApiVersion("1.0", Deprecated = true)]
[Route("api/v{version:apiVersion}/[controller]")]
public class CustomersV1Controller : ControllerBase
{
    // Add deprecation headers
    [HttpGet]
    public async Task<ActionResult<PagedResult<CustomerDto>>> GetCustomers()
    {
        Response.Headers.Add("X-API-Deprecation-Date", "2026-12-31");
        Response.Headers.Add("X-API-Deprecation-Info", 
            "https://api.example.com/docs/v1-deprecation");
        
        // Implementation
    }
}

// VALIDATION:
// ☐ Version specified in URL path (/api/v1/, /api/v2/)
// ☐ Multiple versions supported simultaneously (N-1 support minimum)
// ☐ Deprecation communicated with 6+ month notice
// ☐ Sunset header sent for deprecated versions
// ☐ Breaking changes require new version
// ☐ Backward compatibility maintained within major version
```

### API Contract Testing

**OpenAPI/Swagger Specification Requirements:**
```yaml
openapi: 3.0.1
info:
  title: MyApp API
  version: v1
  description: Enterprise API for customer and order management
  contact:
    name: API Support
    email: api-support@example.com

servers:
  - url: https://api.example.com
    description: Production
  - url: https://staging-api.example.com
    description: Staging

paths:
  /api/v1/customers:
    get:
      summary: List customers
      operationId: listCustomers
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustomerPagedResult'
        '400':
          description: Invalid parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiError'
      security:
        - bearerAuth: []

components:
  schemas:
    Customer:
      type: object
      required:
        - id
        - email
        - firstName
        - lastName
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        lastName:
          type: string
          minLength: 1
          maxLength: 100
  
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

# VALIDATION:
# ☐ OpenAPI 3.0+ specification generated from code
# ☐ All endpoints documented with descriptions
# ☐ Request/response schemas defined
# ☐ Security requirements specified
# ☐ Example requests/responses provided
# ☐ Specification validated with Spectral or similar tool
```

**Contract Testing with Pact:**
```csharp
// CONSUMER TEST (Frontend React app)
public class OrderApiConsumerTest
{
    private readonly IPactBuilderV3 _pact;
    
    [Fact]
    public async Task GetOrderById_ReturnsOrder()
    {
        // Define expected contract
        _pact
            .UponReceiving("a request for an order")
            .Given("an order with ID exists")
            .WithRequest(HttpMethod.Get, "/api/v1/orders/123")
            .WithHeader("Authorization", "Bearer token")
            .WillRespond()
            .WithStatus(HttpStatusCode.OK)
            .WithJsonBody(new
            {
                id = "123",
                customerId = "456",
                totalAmount = 99.99,
                status = "Pending"
            });
        
        // Verify consumer can parse response
        var response = await _orderApiClient.GetOrderByIdAsync("123");
        Assert.Equal("123", response.Id);
        Assert.Equal(99.99, response.TotalAmount);
    }
}

// PROVIDER TEST (.NET API)
public class OrderApiProviderTest
{
    [Fact]
    public void VerifyOrderApiContract()
    {
        // Verify API fulfills consumer contract
        var config = new PactVerifierConfig
        {
            Outputters = new[] { new XUnitOutput(_output) },
            ProviderVersion = "1.0.0"
        };
        
        new PactVerifier(config)
            .ServiceProvider("OrderApi", "http://localhost:5000")
            .HonoursPactWith("FrontendApp")
            .PactUri("pacts/frontendapp-orderapi.json")
            .Verify();
    }
}

// VALIDATION:
// ☐ Consumer-driven contracts defined by frontend team
// ☐ Provider verification runs in CI/CD pipeline
// ☐ Contract breaking changes detected pre-deployment
// ☐ Pact broker used for contract sharing
// ☐ Version tagging for contract compatibility
```

### Rate Limiting and Throttling

**API Rate Limiting Strategy:**
```csharp
// REQUIRED: Rate limiting middleware
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IDistributedCache _cache;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientIdentifier(context);
        var endpoint = context.Request.Path;
        
        // REQUIRED: Per-client, per-endpoint rate limits
        var limits = new Dictionary<string, RateLimit>
        {
            ["/api/v1/orders"] = new(100, TimeSpan.FromMinutes(1)),
            ["/api/v1/customers"] = new(200, TimeSpan.FromMinutes(1)),
            ["/api/v1/reports"] = new(10, TimeSpan.FromMinutes(1))  // Expensive
        };
        
        var key = $"ratelimit:{clientId}:{endpoint}";
        var currentCount = await _cache.GetStringAsync(key);
        
        if (int.TryParse(currentCount, out var count) && 
            count >= limits[endpoint].MaxRequests)
        {
            context.Response.StatusCode = 429;
            context.Response.Headers.Add("Retry-After", "60");
            context.Response.Headers.Add("X-RateLimit-Limit", 
                limits[endpoint].MaxRequests.ToString());
            context.Response.Headers.Add("X-RateLimit-Remaining", "0");
            
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }
        
        await _cache.SetStringAsync(key, (count + 1).ToString(), 
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = limits[endpoint].Window
            });
        
        // Add rate limit headers
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.Add("X-RateLimit-Limit", 
                limits[endpoint].MaxRequests.ToString());
            context.Response.Headers.Add("X-RateLimit-Remaining", 
                (limits[endpoint].MaxRequests - count - 1).ToString());
            return Task.CompletedTask;
        });
        
        await _next(context);
    }
}

// VALIDATION:
// ☐ Rate limits defined per endpoint (not global)
// ☐ Different limits for authenticated vs anonymous users
// ☐ Tiered rate limits (free vs paid plans)
// ☐ 429 responses with Retry-After header
// ☐ X-RateLimit-* headers on all responses
// ☐ Redis/distributed cache for rate limit counters
// ☐ Token bucket or sliding window algorithm
```

---

## Enterprise Security Audit Framework

### OWASP Top 10 Mitigation Checklist

#### A01:2021 – Broken Access Control

**Validation Requirements:**
```csharp
// REQUIRED: Authorization at every layer
[Authorize(Policy = "CanManageOrders")]
public class OrdersController : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var order = await _orderService.GetByIdAsync(id);
        
        // CRITICAL: Resource-level authorization
        if (!User.CanAccessOrder(order))
        {
            return Forbid();  // 403, not 404 (prevents enumeration)
        }
        
        return Ok(order);
    }
    
    // REQUIRED: Prevent mass assignment vulnerabilities
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrder(
        Guid id, 
        [FromBody] UpdateOrderDto dto)  // DTO, not entity
    {
        // Only allow updating specific fields
        // Prevent: user.IsAdmin = true injection
    }
}

// ANTI-PATTERN DETECTION:
// ☐ No authorization checks bypassed with conditional logic
// ☐ No reliance on client-side access control
// ☐ No exposure of internal object IDs without authorization
// ☐ No insecure direct object references (IDOR)
// ☐ Directory traversal prevention (Path.GetFullPath validation)
```

#### A02:2021 – Cryptographic Failures

**Encryption Standards:**
```csharp
// REQUIRED: Encryption for sensitive data at rest
public class EncryptionService
{
    private readonly IConfiguration _config;
    
    public string EncryptSensitiveData(string plaintext)
    {
        // REQUIRED: AES-256-GCM encryption
        using var aes = Aes.Create();
        aes.KeySize = 256;
        aes.Key = GetKeyFromKeyVault();  // Never hardcode keys
        aes.GenerateIV();
        
        using var encryptor = aes.CreateEncryptor();
        var encrypted = encryptor.TransformFinalBlock(
            Encoding.UTF8.GetBytes(plaintext), 0, plaintext.Length);
        
        // Return IV + ciphertext
        return Convert.ToBase64String(aes.IV.Concat(encrypted).ToArray());
    }
}

// REQUIRED: TLS 1.2+ only
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddHttpsRedirection(options =>
        {
            options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
            options.HttpsPort = 443;
        });
        
        // REQUIRED: HSTS header
        services.AddHsts(options =>
        {
            options.MaxAge = TimeSpan.FromDays(365);
            options.IncludeSubDomains = true;
            options.Preload = true;
        });
    }
}

// VALIDATION CHECKLIST:
// ☐ All sensitive data encrypted at rest (PII, PCI, PHI)
// ☐ AES-256 or stronger encryption algorithms
// ☐ Encryption keys stored in Azure Key Vault / AWS KMS
// ☐ Key rotation policy implemented (90-day cycle)
// ☐ TLS 1.2+ enforced (TLS 1.0/1.1 disabled)
// ☐ HTTPS-only (HSTS header configured)
// ☐ No plaintext secrets in configuration files
// ☐ Password hashing with bcrypt/Argon2 (not SHA-256)
```

#### A03:2021 – Injection

**SQL Injection Prevention:**
```csharp
// ✅ CORRECT: Parameterized queries with EF Core
public async Task<Customer?> GetCustomerByEmailAsync(string email)
{
    return await _context.Customers
        .Where(c => c.Email == email)  // Parameterized automatically
        .FirstOrDefaultAsync();
}

// ✅ CORRECT: Raw SQL with parameters
public async Task<List<Order>> GetOrdersByStatusAsync(string status)
{
    return await _context.Orders
        .FromSqlRaw(
            "SELECT * FROM orders WHERE status = {0}", 
            status)  // Parameterized
        .ToListAsync();
}

// ❌ INCORRECT: String concatenation (SQL injection vulnerability)
public async Task<Customer?> GetCustomerUnsafe(string email)
{
    return await _context.Customers
        .FromSqlRaw($"SELECT * FROM customers WHERE email = '{email}'")
        .FirstOrDefaultAsync();
    // Vulnerable to: email = "'; DROP TABLE customers; --"
}

// VALIDATION:
// ☐ All database queries use parameterized statements
// ☐ ORM (EF Core) used for data access (not raw SQL)
// ☐ Input validation with whitelisting (not just sanitization)
// ☐ Stored procedures use parameters (not dynamic SQL)
// ☐ NoSQL injection prevention (MongoDB query sanitization)
```

**Command Injection Prevention:**
```csharp
// ❌ DANGEROUS: Direct process execution with user input
public void ConvertFile(string filename)
{
    var process = Process.Start("convert", $"{filename} output.pdf");
    // Vulnerable to: filename = "file.txt; rm -rf /"
}

// ✅ CORRECT: Whitelist validation + escaping
public void ConvertFileSafe(string filename)
{
    // Validate filename format
    if (!Regex.IsMatch(filename, @"^[a-zA-Z0-9_\-\.]+$"))
    {
        throw new ArgumentException("Invalid filename");
    }
    
    // Use ProcessStartInfo with argument list (not shell)
    var psi = new ProcessStartInfo
    {
        FileName = "convert",
        Arguments = $"{filename} output.pdf",
        UseShellExecute = false,  // Critical: Prevents shell injection
        CreateNoWindow = true
    };
    
    Process.Start(psi);
}

// VALIDATION:
// ☐ No direct shell command execution with user input
// ☐ UseShellExecute = false for Process.Start
// ☐ Argument whitelisting and validation
// ☐ Avoid Process.Start entirely if possible (use libraries)
```

#### A04:2021 – Insecure Design

**Threat Modeling Requirements:**
```
REQUIRED SECURITY CONTROLS:
☐ Threat model documented (STRIDE methodology)
☐ Attack surface analysis completed
☐ Data flow diagrams created
☐ Trust boundaries identified
☐ Security requirements defined pre-development
☐ Abuse cases documented alongside use cases
☐ Defense in depth strategy implemented
☐ Principle of least privilege enforced

SECURE DESIGN PATTERNS:
☐ Input validation at every layer
☐ Output encoding context-aware
☐ Security logging and monitoring
☐ Fail-safe defaults (deny by default)
☐ No security by obscurity
☐ Secure session management
```

#### A05:2021 – Security Misconfiguration

**Configuration Hardening Checklist:**
```json
// appsettings.Production.json - REQUIRED SECURITY SETTINGS
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft": "Warning"
      // NEVER: "Debug" in production (information disclosure)
    }
  },
  "AllowedHosts": "example.com",  // Specific domain, not "*"
  "ConnectionStrings": {
    // NEVER: Connection strings in appsettings.json
    // USE: Azure Key Vault, AWS Secrets Manager, environment variables
  },
  "Kestrel": {
    "Limits": {
      "MaxRequestBodySize": 10485760,  // 10 MB max upload
      "MaxConcurrentConnections": 100,
      "RequestHeadersTimeout": "00:00:30"
    }
  }
}

// VALIDATION:
// ☐ Debug mode disabled in production
// ☐ Detailed error pages disabled (no stack traces)
// ☐ Directory browsing disabled
// ☐ Unnecessary HTTP methods disabled (OPTIONS, TRACE)
// ☐ Server header removed (no version disclosure)
// ☐ Default credentials changed (if any admin interfaces)
// ☐ Unused features/libraries removed
// ☐ Security headers configured (CSP, X-Frame-Options, etc.)
// ☐ CORS policy restrictive (not Allow-Origin: *)
```

**Security Headers Configuration:**
```csharp
public class SecurityHeadersMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // REQUIRED: Comprehensive security headers
        context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Add("X-Frame-Options", "DENY");
        context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Add("Permissions-Policy", 
            "geolocation=(), microphone=(), camera=()");
        
        // REQUIRED: Content Security Policy
        context.Response.Headers.Add("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'nonce-{NONCE}'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "connect-src 'self' https://api.example.com; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");
        
        // Remove version disclosure headers
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");
        
        await next(context);
    }
}

// VALIDATION:
// ☐ All security headers present and correctly configured
// ☐ CSP policy tested and refined (no 'unsafe-eval')
// ☐ securityheaders.com scan score = A+
// ☐ Server version information removed
```

#### A06:2021 – Vulnerable and Outdated Components

**Dependency Management Standards:**
```bash
# REQUIRED: Automated vulnerability scanning
dotnet list package --vulnerable --include-transitive

# REQUIRED: Dependency update policy
# - Critical vulnerabilities: Patch within 24 hours
# - High vulnerabilities: Patch within 1 week
# - Medium vulnerabilities: Patch within 1 month
# - Low vulnerabilities: Patch within next release cycle

# VALIDATION CHECKLIST:
# ☐ Automated dependency scanning in CI/CD (Snyk, Dependabot)
# ☐ All packages up-to-date (no packages >6 months old)
# ☐ Zero known vulnerabilities (CVSS ≥7.0)
# ☐ Transitive dependencies audited
# ☐ Package sources verified (NuGet.org only, no untrusted sources)
# ☐ Dependency version pinning (not floating versions)
# ☐ Bill of Materials (BOM) generated and reviewed
```

#### A07:2021 – Identification and Authentication Failures

**Authentication Security Standards:**
```csharp
// REQUIRED: Multi-factor authentication support
public class MfaService
{
    public async Task<bool> ValidateTotpAsync(string userId, string code)
    {
        var secret = await GetUserMfaSecretAsync(userId);
        var totp = new Totp(Base32Encoding.ToBytes(secret));
        
        // REQUIRED: Time window validation (prevent replay)
        return totp.VerifyTotp(code, out _, new VerificationWindow(1, 1));
    }
}

// REQUIRED: Secure password policy
public class PasswordValidator
{
    public ValidationResult Validate(string password)
    {
        // NIST 800-63B guidelines
        if (password.Length < 12)
            return Failure("Minimum 12 characters");
        
        if (IsCommonPassword(password))  // Check against breach database
            return Failure("Password found in breach database");
        
        if (ContainsUserInfo(password))  // No username/email in password
            return Failure("Password cannot contain user information");
        
        return Success();
    }
}

// REQUIRED: Account lockout protection
public class LoginAttemptTracker
{
    private readonly IDistributedCache _cache;
    
    public async Task<bool> IsAccountLockedAsync(string userId)
    {
        var key = $"login:attempts:{userId}";
        var attempts = await _cache.GetStringAsync(key);
        
        // REQUIRED: Exponential backoff
        // 3 attempts: 5-minute lockout
        // 6 attempts: 30-minute lockout
        // 10+ attempts: 24-hour lockout
        
        return int.TryParse(attempts, out var count) && count >= 10;
    }
}

// VALIDATION:
// ☐ MFA required for privileged accounts
// ☐ Password minimum 12 characters (not max length restrictions)
// ☐ Password breach database checked (HaveIBeenPwned API)
// ☐ No password composition rules (uppercase, special chars not required)
// ☐ Account lockout after failed attempts (exponential backoff)
// ☐ Session timeout after inactivity (15 minutes)
// ☐ Session invalidation on logout/password change
// ☐ No credential stuffing attacks (rate limiting)
```

#### A08:2021 – Software and Data Integrity Failures

**Code Signing and Integrity Verification:**
```yaml
# REQUIRED: CI/CD pipeline security
build:
  steps:
    - name: Verify dependencies
      run: dotnet restore --locked-mode  # Fail if packages.lock.json changed
    
    - name: Static analysis
      run: dotnet build /p:RunAnalyzers=true /p:TreatWarningsAsErrors=true
    
    - name: Security scan
      run: |
        dotnet list package --vulnerable
        snyk test --severity-threshold=high
    
    - name: Sign assemblies
      run: signtool sign /f certificate.pfx /p ${{ secrets.CERT_PASSWORD }}
    
    - name: Generate SBOM
      run: dotnet sbom-tool generate -b ./bin -pn MyApp

# VALIDATION:
# ☐ All code changes reviewed (no direct commits to main)
# ☐ Signed commits required (GPG signatures)
# ☐ Build artifacts signed with code signing certificate
# ☐ Dependencies locked (packages.lock.json committed)
# ☐ SBOM (Software Bill of Materials) generated
# ☐ Immutable build artifacts (no post-build modifications)
# ☐ Supply chain security (verified package sources)
```

#### A09:2021 – Security Logging and Monitoring Failures

**Comprehensive Logging Requirements:**
```csharp
// REQUIRED: Security-relevant event logging
public class SecurityLogger
{
    private readonly ILogger<SecurityLogger> _logger;
    
    public void LogAuthenticationFailure(string userId, string ipAddress)
    {
        _logger.LogWarning(
            "Authentication failed for user {UserId} from IP {IpAddress}",
            userId, ipAddress);
        
        // REQUIRED: Send to SIEM for correlation
        _telemetryClient.TrackEvent("AuthenticationFailed", new Dictionary<string, string>
        {
            ["UserId"] = userId,
            ["IpAddress"] = ipAddress,
            ["Timestamp"] = DateTimeOffset.UtcNow.ToString("o"),
            ["Severity"] = "Warning"
        });
    }
    
    public void LogAuthorizationFailure(string userId, string resource, string action)
    {
        _logger.LogWarning(
            "Authorization failed: User {UserId} attempted {Action} on {Resource}",
            userId, action, resource);
        
        // Potential privilege escalation attempt
    }
    
    public void LogSensitiveDataAccess(string userId, string dataType)
    {
        _logger.LogInformation(
            "Sensitive data accessed: User {UserId} accessed {DataType}",
            userId, dataType);
        
        // Audit trail for compliance
    }
}

// REQUIRED: Log security events
// ☐ Authentication successes and failures
// ☐ Authorization failures (403 responses)
// ☐ Input validation failures (potential attacks)
// ☐ Session management events (creation, expiration, invalidation)
// ☐ Administrative privilege usage
// ☐ Configuration changes
// ☐ Sensitive data access (PII, financial data)
// ☐ Security control failures (rate limit exceeded, invalid tokens)

// CRITICAL: Do NOT log
// ☐ Passwords or credentials
// ☐ Session tokens or JWT
// ☐ Credit card numbers (PCI-DSS violation)
// ☐ Full social security numbers
// ☐ Encryption keys
```

**SIEM Integration Requirements:**
```
MONITORING AND ALERTING THRESHOLDS:

CRITICAL (Page on-call immediately):
- Multiple failed authentication attempts (>10 in 5 minutes)
- Authorization failures for sensitive resources
- SQL injection attempt detected
- Privilege escalation attempt
- Unusual data exfiltration patterns

HIGH (Alert within 15 minutes):
- Rate limit violations
- Suspicious IP addresses (known attack sources)
- Configuration changes in production
- Failed security scans in CI/CD

VALIDATION:
☐ Centralized logging (ELK, Splunk, Azure Monitor)
☐ Log retention ≥90 days (1 year for compliance-sensitive data)
☐ Tamper-proof logs (append-only, write-once storage)
☐ Real-time alerts for critical security events
☐ Log analysis and correlation automated
☐ Incident response runbooks documented
☐ Regular log review and analysis
```

#### A10:2021 – Server-Side Request Forgery (SSRF)

**SSRF Prevention Standards:**
```csharp
// ✅ CORRECT: URL validation and whitelist
public class SafeHttpClient
{
    private static readonly HashSet<string> AllowedDomains = new()
    {
        "api.trusted-partner.com",
        "cdn.example.com"
    };
    
    public async Task<string> FetchUrlAsync(string url)
    {
        // REQUIRED: Parse and validate URL
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException("Invalid URL");
        }
        
        // REQUIRED: Whitelist validation
        if (!AllowedDomains.Contains(uri.Host))
        {
            throw new SecurityException("Domain not whitelisted");
        }
        
        // REQUIRED: Block private IP ranges
        var ipAddress = await Dns.GetHostAddressesAsync(uri.Host);
        if (IsPrivateIp(ipAddress[0]))
        {
            throw new SecurityException("Private IP addresses not allowed");
        }
        
        // REQUIRED: Disable redirects (prevent bypass)
        var handler = new HttpClientHandler
        {
            AllowAutoRedirect = false
        };
        
        using var client = new HttpClient(handler);
        return await client.GetStringAsync(uri);
    }
    
    private bool IsPrivateIp(IPAddress ip)
    {
        // Block: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
        var bytes = ip.GetAddressBytes();
        return bytes[0] == 10 ||
               bytes[0] == 127 ||
               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168);
    }
}

// VALIDATION:
// ☐ URL whitelist enforced (no user-controlled full URLs)
// ☐ Private IP ranges blocked (internal network protection)
// ☐ Cloud metadata endpoints blocked (169.254.169.254)
// ☐ DNS rebinding protection (re-resolve before request)
// ☐ HTTP redirects disabled or validated
// ☐ Network segmentation (app tier cannot access internal services)
```

---

## Performance Engineering & Load Validation

### Performance Testing Strategy

**Load Testing Requirements:**
```yaml
# REQUIRED: Performance test scenarios
load_tests:
  baseline:
    description: Normal operating conditions
    users: 100
    duration: 10m
    ramp_up: 2m
    target_metrics:
      - p95_response_time: <200ms
      - p99_response_time: <500ms
      - throughput: >1000 req/s
      - error_rate: <0.1%
  
  stress_test:
    description: Beyond normal capacity
    users: 1000
    duration: 30m
    ramp_up: 10m
    target_metrics:
      - system_degrades_gracefully: true
      - no_crashes: true
      - recovery_time: <2m
  
  spike_test:
    description: Sudden traffic surge
    users:
      normal: 100
      spike: 500
      spike_duration: 2m
    target_metrics:
      - no_errors_during_spike: true
      - auto_scaling_triggers: <30s
  
  endurance_test:
    description: Sustained load over time
    users: 200
    duration: 4h
    target_metrics:
      - no_memory_leaks: true
      - stable_response_times: true
      - no_performance_degradation: true

# VALIDATION TOOLING:
# ☐ k6, JMeter, or Gatling for load testing
# ☐ Production-like environment for performance tests
# ☐ Real user behavior patterns (not just health checks)
# ☐ Database and cache under load
# ☐ Distributed load from multiple regions
```

**Performance Monitoring Metrics:**
```csharp
// REQUIRED: Application Performance Monitoring (APM)
public class PerformanceMetrics
{
    private readonly IMetricsCollector _metrics;
    
    public async Task<ActionResult> GetOrders()
    {
        using var _ = _metrics.MeasureRequestDuration("GetOrders");
        
        // Track custom metrics
        _metrics.RecordDatabaseQueryDuration("orders.list", elapsed);
        _metrics.RecordCacheHitRate("orders.cache", hitRate);
        _metrics.RecordExternalApiLatency("payment.gateway", latency);
        
        return Ok(orders);
    }
}

// CRITICAL PERFORMANCE METRICS:
// Application Metrics:
// - Response time: P50, P95, P99 (<200ms, <500ms, <1s)
// - Throughput: Requests per second (>1000 req/s target)
// - Error rate: <0.1% for normal operations
// - Apdex score: >0.9 (Application Performance Index)

// Infrastructure Metrics:
// - CPU utilization: <70% average, <90% peak
// - Memory usage: <80% with no leaks
// - Disk I/O: <80% capacity
// - Network bandwidth: <70% capacity

// Database Metrics:
// - Query execution time: <100ms for 95% of queries
// - Connection pool utilization: <80%
// - Cache hit ratio: >80%
// - Slow query count: <10 per hour

// VALIDATION:
// ☐ All metrics collected and dashboarded
// ☐ Alerts configured for threshold breaches
// ☐ Performance regressions detected in CI/CD
// ☐ Real User Monitoring (RUM) implemented
```

### Caching Strategy

**Multi-Tier Caching Architecture:**
```csharp
// REQUIRED: Layered caching strategy
public class CachingService
{
    private readonly IMemoryCache _l1Cache;           // Application memory
    private readonly IDistributedCache _l2Cache;      // Redis
    private readonly ICdnClient _l3Cache;             // CloudFront/CDN
    
    public async Task<T?> GetOrSetAsync<T>(
        string key,
        Func<Task<T>> factory,
        CachingStrategy strategy)
    {
        // L1: Check in-memory cache
        if (_l1Cache.TryGetValue(key, out T? cachedValue))
        {
            _metrics.RecordCacheHit("L1");
            return cachedValue;
        }
        
        // L2: Check distributed cache (Redis)
        var serialized = await _l2Cache.GetStringAsync(key);
        if (serialized != null)
        {
            _metrics.RecordCacheHit("L2");
            var value = JsonSerializer.Deserialize<T>(serialized);
            
            // Warm L1 cache
            _l1Cache.Set(key, value, strategy.L1Expiration);
            return value;
        }
        
        // Cache miss: Execute factory
        _metrics.RecordCacheMiss();
        var result = await factory();
        
        // Store in L2 cache
        await _l2Cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = strategy.L2Expiration
            });
        
        // Store in L1 cache
        _l1Cache.Set(key, result, strategy.L1Expiration);
        
        return result;
    }
}

// CACHING STRATEGIES BY DATA TYPE:
// - Immutable reference data: Long TTL (1 day), CDN-cached
// - User sessions: Medium TTL (15 minutes), distributed cache
// - API responses (user-specific): Short TTL (5 minutes), app cache
// - Real-time data: No caching or 30-second TTL

// CACHE INVALIDATION PATTERNS:
// - Time-based expiration (TTL)
// - Event-based invalidation (domain events trigger cache clear)
// - Cache-aside pattern (lazy loading)
// - Write-through caching (update cache on write)

// VALIDATION:
// ☐ Cache hit ratio >80% for frequently accessed data
// ☐ Cache invalidation strategy prevents stale data
// ☐ Cache stampede prevention (distributed locks)
// ☐ Cache warming on application startup
// ☐ Cache size limits enforced (memory pressure eviction)
```

### Database Query Optimization

**Query Performance Checklist:**
```sql
-- REQUIRED: Analyze query execution plans
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT o.order_id, o.total_amount, c.email, c.first_name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'Pending'
  AND o.order_date >= NOW() - INTERVAL '30 days'
ORDER BY o.order_date DESC
LIMIT 50;

-- OPTIMIZATION TECHNIQUES:
-- 1. Index optimization
CREATE INDEX CONCURRENTLY idx_orders_status_date 
ON orders(status, order_date DESC);

-- 2. Covering indexes (eliminate table lookups)
CREATE INDEX idx_orders_status_covering 
ON orders(status) INCLUDE (order_id, total_amount, order_date);

-- 3. Partial indexes (smaller, more efficient)
CREATE INDEX idx_orders_pending 
ON orders(order_date) 
WHERE status = 'Pending';

-- 4. Avoid SELECT *
-- ✅ Select only needed columns
SELECT order_id, total_amount FROM orders;

-- 5. Use LIMIT for pagination
-- ✅ Keyset pagination (more efficient than OFFSET)
SELECT * FROM orders 
WHERE order_id > '...' 
ORDER BY order_id 
LIMIT 50;

-- 6. Avoid N+1 queries
-- ❌ BAD: Loading orders then customers in separate queries
-- ✅ GOOD: Single query with JOIN

-- VALIDATION:
-- ☐ No sequential scans on large tables (>10K rows)
-- ☐ All queries <100ms execution time (P95)
-- ☐ Indexes used effectively (check execution plan)
-- ☐ No unnecessary JOINs or subqueries
-- ☐ Query result set pagination implemented
-- ☐ Connection pooling optimized
```

### CDN and Asset Optimization

**Static Asset Delivery Requirements:**
```
CDN CONFIGURATION STANDARDS:

File Optimization:
☐ JavaScript minified and bundled (<200 KB main bundle)
☐ CSS minified and bundled (<100 KB)
☐ Images optimized (WebP format with JPEG fallback)
☐ Fonts subsetting (only required glyphs)
☐ Brotli compression enabled (better than gzip)

Cache Control Headers:
- HTML: Cache-Control: no-cache (validate on every request)
- Immutable assets: Cache-Control: public, max-age=31536000, immutable
- API responses: Cache-Control: private, max-age=60

CDN Edge Caching:
☐ Static assets: 24-hour cache TTL
☐ API responses (public): 5-minute cache TTL
☐ Stale-while-revalidate strategy
☐ Cache invalidation via API (not wait for TTL)
☐ Geographic distribution (multi-region POPs)

VALIDATION:
☐ Lighthouse Performance score ≥90
☐ First Contentful Paint (FCP) <2 seconds
☐ Largest Contentful Paint (LCP) <2.5 seconds
☐ Time to Interactive (TTI) <3.5 seconds
☐ Total Blocking Time (TBT) <200ms
☐ Cumulative Layout Shift (CLS) <0.1
```

---

## Automated Testing Strategy & Coverage Governance

### Testing Pyramid Standards

**Required Test Coverage:**
```
TESTING PYRAMID (70/20/10 DISTRIBUTION):

Unit Tests (70%):
- Target: 85% code coverage
- Scope: Individual methods, pure logic, business rules
- Speed: <1ms per test
- Framework: xUnit, NUnit for .NET; Jest for React
- Mocking: Moq, NSubstitute

Integration Tests (20%):
- Target: Critical paths covered
- Scope: API endpoints, database access, external service integration
- Speed: <100ms per test
- Framework: WebApplicationFactory for .NET; React Testing Library
- Database: In-memory or test containers

End-to-End Tests (10%):
- Target: User journeys covered
- Scope: Complete workflows across frontend + backend
- Speed: <10 seconds per test
- Framework: Cypress, Playwright
- Flakiness tolerance: <2% (retry mechanism)

VALIDATION:
☐ Total test coverage ≥85% (lines) and ≥80% (branches)
☐ All public API methods unit tested
☐ Critical user flows have E2E tests
☐ Tests run in CI/CD (<10 minutes total)
☐ No flaky tests (deterministic, no sleeps)
```

### Unit Testing Standards

**.NET Unit Test Requirements:**
```csharp
// REQUIRED: AAA pattern (Arrange, Act, Assert)
public class OrderServiceTests
{
    [Fact]
    public async Task CreateOrder_ValidInput_ReturnsCreatedOrder()
    {
        // ARRANGE
        var mockRepository = new Mock<IOrderRepository>();
        var mockInventoryService = new Mock<IInventoryService>();
        
        var command = new CreateOrderCommand(
            CustomerId: Guid.NewGuid(),
            Items: new List<OrderItemDto>
            {
                new(ProductId: Guid.NewGuid(), Quantity: 2)
            }
        );
        
        mockInventoryService
            .Setup(x => x.CheckAvailabilityAsync(It.IsAny<Guid>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        
        var service = new OrderService(mockRepository.Object, mockInventoryService.Object);
        
        // ACT
        var result = await service.CreateOrderAsync(command);
        
        // ASSERT
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        mockRepository.Verify(
            x => x.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }
    
    // REQUIRED: Test edge cases and failures
    [Theory]
    [InlineData(0)]      // Zero quantity
    [InlineData(-1)]     // Negative quantity
    [InlineData(10001)]  // Exceeds max quantity
    public async Task CreateOrder_InvalidQuantity_ReturnsFailure(int quantity)
    {
        // Test boundary conditions
    }
    
    // REQUIRED: Test exception handling
    [Fact]
    public async Task CreateOrder_RepositoryThrows_ReturnsFailure()
    {
        // Test error paths
    }
}

// VALIDATION:
// ☐ All public methods have tests
// ☐ Edge cases covered (null, empty, boundary values)
// ☐ Exception paths tested
// ☐ Test names descriptive (MethodName_Scenario_ExpectedResult)
// ☐ Tests isolated (no shared state between tests)
// ☐ Fast execution (<1ms per test)
// ☐ No external dependencies (database, API calls)
```

**React Component Testing Standards:**
```javascript
// REQUIRED: React Testing Library (not Enzyme)
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('OrderForm', () => {
  it('submits order when form is valid', async () => {
    // ARRANGE
    const mockSubmit = jest.fn();
    render(<OrderForm onSubmit={mockSubmit} />);
    
    // ACT
    await userEvent.type(screen.getByLabelText(/customer email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/quantity/i), '5');
    await userEvent.click(screen.getByRole('button', { name: /submit order/i }));
    
    // ASSERT
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        quantity: 5
      });
    });
  });
  
  // REQUIRED: Test accessibility
  it('has accessible form labels', () => {
    render(<OrderForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/customer email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toHaveAccessibleName();
  });
  
  // REQUIRED: Test error states
  it('displays validation errors for invalid input', async () => {
    render(<OrderForm onSubmit={jest.fn()} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });
});

// VALIDATION:
// ☐ Components tested in isolation (mock dependencies)
// ☐ User interactions simulated (click, type, submit)
// ☐ Async behavior tested (waitFor for API calls)
// ☐ Accessibility verified (screen reader compatibility)
// ☐ Error states covered
// ☐ No implementation detail testing (test behavior, not internals)
```

### Integration Testing Standards

**API Integration Test Requirements:**
```csharp
// REQUIRED: WebApplicationFactory for integration tests
public class OrdersControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    
    public OrdersControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Use in-memory database for tests
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });
            });
        });
        
        _client = _factory.CreateClient();
    }
    
    [Fact]
    public async Task POST_CreateOrder_ReturnsCreatedOrder()
    {
        // ARRANGE
        var request = new
        {
            customerId = Guid.NewGuid(),
            items = new[]
            {
                new { productId = Guid.NewGuid(), quantity = 2 }
            }
        };
        
        // ACT
        var response = await _client.PostAsJsonAsync("/api/v1/orders", request);
        
        // ASSERT
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        order.Should().NotBeNull();
        order!.Id.Should().NotBeEmpty();
    }
    
    // REQUIRED: Test authentication/authorization
    [Fact]
    public async Task GET_OrderById_Unauthorized_Returns401()
    {
        var response = await _client.GetAsync("/api/v1/orders/123");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

// VALIDATION:
// ☐ All API endpoints have integration tests
// ☐ Authentication and authorization tested
// ☐ Request/response serialization validated
// ☐ HTTP status codes verified
// ☐ Database persistence confirmed
// ☐ Tests isolated (clean database between tests)
```

### End-to-End Testing Standards

**E2E Test Requirements:**
```javascript
// REQUIRED: Playwright or Cypress for E2E tests
import { test, expect } from '@playwright/test';

test.describe('Order Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login and navigate
    await page.goto('https://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });
  
  test('complete order creation and submission', async ({ page }) => {
    // Navigate to order creation
    await page.click('[data-testid="create-order-button"]');
    
    // Fill order form
    await page.selectOption('[data-testid="customer-select"]', 'customer-123');
    await page.fill('[data-testid="product-quantity"]', '5');
    await page.click('[data-testid="add-product-button"]');
    
    // Submit order
    await page.click('[data-testid="submit-order-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Order created successfully');
    
    // Verify order appears in list
    await page.goto('https://localhost:3000/orders');
    await expect(page.locator('[data-testid="order-list"]').first())
      .toBeVisible();
  });
  
  // REQUIRED: Test critical user journeys
  test('search and filter orders', async ({ page }) => {
    // Search functionality E2E test
  });
  
  test('handles API failure gracefully', async ({ page }) => {
    // Mock API failure and verify error handling
    await page.route('**/api/v1/orders', route => route.abort());
    // ... verify error message displayed
  });
});

// VALIDATION:
// ☐ Critical user paths tested end-to-end
// ☐ Tests run against staging environment
// ☐ Data cleanup after tests (idempotent tests)
// ☐ Screenshots captured on failure
// ☐ Retry logic for flaky network conditions
// ☐ Realistic test data (not admin/admin credentials)
// ☐ Mobile viewport testing included
```

### Test Quality and Maintenance

**Test Code Quality Standards:**
```
ANTI-PATTERNS TO AVOID:
❌ Sleeps/delays: await Task.Delay(1000) → Use proper async waits
❌ Hardcoded waits: Thread.Sleep(500) → Use deterministic assertions
❌ Testing implementation details: .state.value === 'x' → Test behavior
❌ Large test fixtures: 500-line test setup → Extract helpers
❌ Brittle selectors: div > span:nth-child(3) → Use data-testid
❌ Shared test state: global variables between tests → Isolate tests
❌ Testing too much: 20 assertions in one test → Split into focused tests
❌ Unclear test names: Test1, Test2 → Descriptive names

BEST PRACTICES:
✅ Fast: Tests complete in <10 minutes total
✅ Isolated: No dependencies between tests
✅ Repeatable: Same result every run
✅ Self-validating: Clear pass/fail
✅ Timely: Written alongside code (TDD encouraged)
✅ Maintainable: Clear, readable test code
✅ Deterministic: No flakiness, no randomness

// MUTATION TESTING:
// ☐ Stryker.NET for .NET code
// ☐ Stryker4s for JavaScript/TypeScript
// ☐ Target: >80% mutation score
// ☐ Ensures tests actually validate logic (not just coverage)
```

---

## CI/CD & DevOps Operational Maturity Review

### Continuous Integration Standards

**CI Pipeline Requirements:**
```yaml
# REQUIRED: Comprehensive CI pipeline (GitHub Actions, Azure DevOps, GitLab CI)
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      # REQUIRED: Code checkout
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for SonarQube
      
      # REQUIRED: Build
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore dependencies
        run: dotnet restore --locked-mode
      
      - name: Build
        run: dotnet build --no-restore --configuration Release
      
      # REQUIRED: Unit tests
      - name: Run unit tests
        run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"
      
      # REQUIRED: Code coverage threshold
      - name: Verify coverage
        run: |
          dotnet tool install -g dotnet-reportgenerator-globaltool
          reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage -reporttypes:Html;Cobertura
          # Fail if coverage <85%
          coverage=$(grep -oP 'line-rate="\K[0-9.]+' coverage/Cobertura.xml)
          if (( $(echo "$coverage < 0.85" | bc -l) )); then
            echo "Coverage $coverage is below threshold 0.85"
            exit 1
          fi
      
      # REQUIRED: Static code analysis
      - name: Run SonarQube scan
        uses: sonarsource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      # REQUIRED: Security scanning
      - name: Run Snyk security scan
        uses: snyk/actions/dotnet@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      # REQUIRED: Dependency vulnerability scan
      - name: Check for vulnerable dependencies
        run: dotnet list package --vulnerable --include-transitive
      
      # REQUIRED: SAST (Static Application Security Testing)
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
      
      # REQUIRED: Frontend build and test
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install frontend dependencies
        run: npm ci
      
      - name: Lint frontend code
        run: npm run lint
      
      - name: Run frontend tests
        run: npm test -- --coverage --watchAll=false
      
      - name: Build frontend
        run: npm run build
      
      # REQUIRED: Container image build
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      
      # REQUIRED: Container scanning
      - name: Scan Docker image for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1  # Fail if vulnerabilities found

# VALIDATION CHECKLIST:
# ☐ All tests pass (unit, integration)
# ☐ Code coverage ≥85%
# ☐ SonarQube Quality Gate passed
# ☐ Zero critical security vulnerabilities
# ☐ All linting rules passed
# ☐ Build artifacts created successfully
# ☐ Pipeline completes in <15 minutes
# ☐ Failing builds block merge to main
```

### Continuous Deployment Standards

**CD Pipeline Requirements:**
```yaml
# REQUIRED: Multi-stage deployment pipeline
name: CD Pipeline

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          # Kubernetes deployment
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/myapp -n staging
      
      - name: Run smoke tests
        run: |
          # Health check
          curl -f https://staging.example.com/health || exit 1
          
          # API smoke tests
          npm run test:smoke -- --env=staging
      
      - name: Run integration tests
        run: npm run test:integration -- --env=staging
  
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      # REQUIRED: Manual approval gate for production
      - name: Wait for approval
        uses: trstringer/manual-approval@v1
        with:
          approvers: engineering-leads, platform-team
      
      # REQUIRED: Blue-Green deployment
      - name: Deploy to production (blue environment)
        run: |
          kubectl apply -f k8s/production/blue/
          kubectl rollout status deployment/myapp-blue -n production
      
      - name: Run smoke tests (blue)
        run: npm run test:smoke -- --env=production-blue
      
      # REQUIRED: Traffic switching
      - name: Switch traffic to blue
        run: |
          kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"blue"}}}'
      
      - name: Monitor metrics for 10 minutes
        run: |
          # Monitor error rates, latency, etc.
          sleep 600
          # Check if metrics are healthy (Prometheus query)
          if ! ./scripts/check-production-health.sh; then
            echo "Health check failed, rolling back"
            kubectl patch service myapp -n production -p '{"spec":{"selector":{"version":"green"}}}'
            exit 1
          fi
      
      - name: Decommission green environment
        run: kubectl delete deployment myapp-green -n production

# DEPLOYMENT STRATEGIES:
# - Blue-Green: Zero-downtime, instant rollback
# - Canary: Gradual traffic shift (10% → 50% → 100%)
# - Rolling: Sequential pod updates with health checks

# VALIDATION:
# ☐ Automated deployment to staging after CI passes
# ☐ Manual approval required for production
# ☐ Smoke tests run post-deployment
# ☐ Rollback mechanism tested and automated
# ☐ Deployment metrics monitored (error rate, latency)
# ☐ Database migration strategy (backward-compatible)
# ☐ Feature flags for gradual rollout
# ☐ Deployment documentation (runbooks)
```

### Infrastructure as Code (IaC) Standards

**Terraform/Infrastructure Standards:**
```hcl
# REQUIRED: All infrastructure defined as code
# main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  # REQUIRED: Remote state storage
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstate"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

# REQUIRED: Tag all resources for cost allocation
locals {
  common_tags = {
    Environment = var.environment
    Project     = "MyApp"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
  }
}

# REQUIRED: Kubernetes cluster with autoscaling
resource "azurerm_kubernetes_cluster" "main" {
  name                = "myapp-aks-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "myapp-${var.environment}"
  
  default_node_pool {
    name                = "default"
    node_count          = var.node_count
    vm_size             = "Standard_D4s_v3"
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 10
    
    # REQUIRED: Node pool tags
    tags = local.common_tags
  }
  
  # REQUIRED: Network policies enabled
  network_profile {
    network_plugin = "azure"
    network_policy = "calico"
  }
  
  tags = local.common_tags
}

# VALIDATION:
# ☐ All infrastructure changes via IaC (no manual changes)
# ☐ Terraform state stored remotely (S3, Azure Blob)
# ☐ State locking enabled (prevents concurrent modifications)
# ☐ Terraform plan reviewed before apply
# ☐ Separate environments (dev, staging, production)
# ☐ Resource tagging for cost tracking
# ☐ Secrets managed via Key Vault/Secrets Manager
```

### Container Orchestration Standards

**Kubernetes Deployment Configuration:**
```yaml
# REQUIRED: Comprehensive Kubernetes manifests
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: v1.0.0
spec:
  replicas: 3  # REQUIRED: Minimum 3 replicas for HA
  
  # REQUIRED: Rolling update strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployments
  
  selector:
    matchLabels:
      app: myapp
  
  template:
    metadata:
      labels:
        app: myapp
        version: v1.0.0
    spec:
      # REQUIRED: Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      
      containers:
      - name: myapp
        image: myregistry.azurecr.io/myapp:v1.0.0
        
        # REQUIRED: Resource limits and requests
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        
        # REQUIRED: Liveness and readiness probes
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        # REQUIRED: Environment variables from ConfigMap/Secrets
        envFrom:
        - configMapRef:
            name: myapp-config
        - secretRef:
            name: myapp-secrets
        
        ports:
        - containerPort: 8080
          protocol: TCP

---
# REQUIRED: Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
# REQUIRED: Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp

# VALIDATION:
# ☐ All pods have resource requests and limits
# ☐ Health checks configured (liveness, readiness)
# ☐ Autoscaling enabled (HPA)
# ☐ Rolling updates configured (zero downtime)
# ☐ Pod disruption budgets defined
# ☐ Security contexts applied (non-root user)
# ☐ Secrets managed via Kubernetes Secrets or external vault
# ☐ Network policies defined (restrict pod communication)
```

### Observability and Monitoring

**Monitoring Stack Requirements:**
```yaml
# REQUIRED: Comprehensive observability stack
# Prometheus, Grafana, Loki, Jaeger/Tempo

# Metrics Collection (Prometheus)
metrics:
  - application_metrics:
      - http_request_duration_seconds (histogram)
      - http_requests_total (counter)
      - database_query_duration_seconds (histogram)
      - cache_hit_ratio (gauge)
      - active_connections (gauge)
  
  - infrastructure_metrics:
      - cpu_usage_percent
      - memory_usage_bytes
      - disk_io_operations
      - network_bytes_transferred
  
  - business_metrics:
      - orders_created_total
      - revenue_generated_dollars
      - user_signups_total
      - api_errors_by_endpoint

# Logging (Structured JSON)
logging:
  format: JSON
  levels:
    production: Warning
    staging: Information
    development: Debug
  
  required_fields:
    - timestamp
    - level
    - message
    - service_name
    - trace_id
    - span_id
    - user_id (if authenticated)
    - ip_address
    - request_path
    - http_method
    - response_status

# Distributed Tracing (OpenTelemetry)
tracing:
  - trace_all_http_requests: true
  - trace_database_queries: true
  - trace_external_api_calls: true
  - sampling_rate: 100% (production can be 10%)
  
  # REQUIRED: Trace context propagation
  headers:
    - traceparent
    - tracestate

# Alerting Rules
alerts:
  critical:
    - error_rate > 1% for 5 minutes
    - p95_latency > 1000ms for 5 minutes
    - pod_cpu_usage > 90% for 10 minutes
    - pod_memory_usage > 90% for 10 minutes
    - database_connection_pool_exhausted
  
  high:
    - error_rate > 0.5% for 10 minutes
    - p95_latency > 500ms for 10 minutes
    - pod_restart_count > 3 in 1 hour
  
  medium:
    - disk_space < 20%
    - certificate_expiration < 30 days

# VALIDATION:
# ☐ All services instrumented with metrics
# ☐ Structured logging implemented (JSON format)
# ☐ Distributed tracing enabled (OpenTelemetry)
# ☐ Dashboards created for key metrics
# ☐ Alerting rules defined and tested
# ☐ On-call rotation documented
# ☐ Runbooks created for common incidents
# ☐ SLOs defined (99.9% uptime, <200ms p95 latency)
```

---

## AI-Assisted Engineering Review Workflow

### AI Code Review Integration

**AI-Augmented Review Process:**
```
AI REVIEW PIPELINE (Pre-Human Review):

STAGE 1: Static Analysis (Automated)
☐ Syntax and compilation errors
☐ Code style violations (ESLint, Prettier, StyleCop)
☐ Potential bugs (null reference, type errors)
☐ Dead code detection
☐ Complexity metrics (cyclomatic complexity >15)

STAGE 2: AI Pattern Recognition (AI Agent)
☐ Architecture pattern violations
☐ SOLID principle violations
☐ Common anti-patterns (God objects, tight coupling)
☐ Security vulnerabilities (SQL injection, XSS)
☐ Performance anti-patterns (N+1 queries)
☐ Test coverage gaps
☐ Documentation completeness

STAGE 3: AI-Generated Review Comments (Claude, Cursor AI)
Prompt Template:
"""
You are a principal software engineer reviewing a pull request.
Analyze the following code changes for:

1. Architecture adherence (Clean Architecture, SOLID)
2. Security vulnerabilities (OWASP Top 10)
3. Performance implications (query optimization, caching)
4. Test coverage adequacy
5. Code maintainability and readability

Provide specific, actionable feedback with:
- Severity: Critical, High, Medium, Low
- Line-specific comments
- Suggested improvements with code examples
- Rationale for each recommendation

Code changes:
{code_diff}

Context:
- Project: React + .NET application
- Standards: Enterprise-grade, production-ready
"""

STAGE 4: Human Expert Review
☐ Validate AI findings
☐ Business logic correctness
☐ API contract compatibility
☐ Integration with existing systems
☐ Strategic architecture decisions

VALIDATION:
☐ AI review completes in <5 minutes
☐ False positive rate <10%
☐ Critical issues detection rate >95%
☐ AI suggestions actionable and specific
☐ Human review time reduced by 30-50%
```

### AI-Powered Test Generation

**Automated Test Creation Standards:**
```typescript
// AI TEST GENERATION WORKFLOW

// INPUT: Source code
// OUTPUT: Comprehensive test suite

// Example AI Prompt for Test Generation:
const generateTestPrompt = `
Generate comprehensive unit tests for the following TypeScript class:

${sourceCode}

Requirements:
1. Test all public methods
2. Cover edge cases (null, empty, boundary values)
3. Test error handling paths
4. Use Jest framework
5. Follow AAA pattern (Arrange, Act, Assert)
6. Include descriptive test names
7. Mock external dependencies
8. Aim for 100% code coverage

Output: Complete Jest test file
`;

// VALIDATION:
// ☐ Generated tests compile without errors
// ☐ Generated tests pass on first run
// ☐ Coverage meets 85% threshold
// ☐ Tests are maintainable (not brittle)
// ☐ Human review and refinement of AI-generated tests
```

### AI-Driven Performance Optimization

**Performance Analysis Workflow:**
```python
# AI PERFORMANCE OPTIMIZATION AGENT

# STEP 1: Profile application (collect metrics)
performance_data = {
    "slow_endpoints": [
        {"path": "/api/orders", "p95_latency": "850ms", "query_count": 23},
        {"path": "/api/customers", "p95_latency": "650ms", "query_count": 15}
    ],
    "database_queries": [
        {"query": "SELECT * FROM orders WHERE ...", "avg_duration": "120ms", "execution_count": 10000}
    ],
    "memory_leaks": [],
    "cache_hit_ratio": 0.65  # Low cache effectiveness
}

# STEP 2: AI analysis prompt
optimization_prompt = f"""
Analyze the following performance profile and provide optimization recommendations:

{json.dumps(performance_data, indent=2)}

For each issue:
1. Root cause analysis
2. Specific optimization strategy
3. Implementation code example
4. Expected performance improvement
5. Risk assessment

Focus areas:
- Database query optimization (indexes, projections)
- Caching strategy improvements
- API endpoint response time reduction
- Memory leak detection and resolution
"""

# STEP 3: AI generates optimization plan
# STEP 4: Human engineer reviews and implements
# STEP 5: Validate performance improvements

# VALIDATION:
# ☐ Performance bottlenecks identified correctly
# ☐ Optimization recommendations are actionable
# ☐ Code examples are production-ready
# ☐ Risk assessment accurate
# ☐ Performance improvements validated (A/B test)
```

### AI-Assisted Documentation Generation

**Automated Documentation Workflow:**
```
AI DOCUMENTATION GENERATION:

INPUT: Source code + comments
OUTPUT: Comprehensive documentation

Documentation Types:
1. API Documentation (OpenAPI/Swagger)
   - Auto-generate from controller attributes
   - AI enriches with descriptions and examples

2. Architecture Documentation
   - AI generates system diagrams (C4 model)
   - Component interaction diagrams
   - Data flow diagrams

3. Code Documentation
   - XML documentation comments
   - Inline code explanations
   - README files

4. Runbooks
   - Incident response procedures
   - Deployment guides
   - Troubleshooting guides

AI Prompt Template:
"""
Generate comprehensive documentation for the following module:

{source_code}

Include:
- Module overview and purpose
- Public API reference
- Usage examples
- Error handling
- Performance considerations
- Security considerations
- Dependencies
- Testing guidance

Format: Markdown
Audience: Senior engineers
Style: Clear, concise, technically precise
"""

VALIDATION:
☐ Documentation accuracy verified
☐ Code examples tested and functional
☐ Diagrams reflect actual architecture
☐ Documentation reviewed by domain expert
☐ Documentation versioned with code
```

---

## UI/UX Quality Assurance Standards

### Visual Regression Testing

**Automated Visual Testing Requirements:**
```javascript
// REQUIRED: Visual regression testing with Percy, Chromatic, or BackstopJS
import { test } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('https://example.com');
    
    // REQUIRED: Multiple viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },  // Desktop
      { width: 768, height: 1024 },   // Tablet
      { width: 375, height: 667 }     // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `screenshots/homepage-${viewport.width}x${viewport.height}.png`,
        fullPage: true
      });
    }
  });
  
  // REQUIRED: Test component states
  test('button states', async ({ page }) => {
    await page.goto('https://example.com/components');
    
    // Default state
    await page.screenshot({ path: 'button-default.png' });
    
    // Hover state
    await page.hover('[data-testid="primary-button"]');
    await page.screenshot({ path: 'button-hover.png' });
    
    // Focus state
    await page.focus('[data-testid="primary-button"]');
    await page.screenshot({ path: 'button-focus.png' });
    
    // Disabled state
    await page.evaluate(() => {
      document.querySelector('[data-testid="primary-button"]').disabled = true;
    });
    await page.screenshot({ path: 'button-disabled.png' });
  });
});

// VALIDATION:
// ☐ Visual tests run on every PR
// ☐ Baseline screenshots approved and versioned
// ☐ Pixel-perfect comparison (threshold <0.5% diff)
// ☐ Cross-browser testing (Chrome, Firefox, Safari)
// ☐ Dark mode tested (if supported)
// ☐ Component states captured (default, hover, focus, disabled, error)
```

### Accessibility Auditing

**WCAG 2.1 Level AA Compliance:**
```javascript
// REQUIRED: Automated accessibility testing
import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Audit', () => {
  test('homepage meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Inject axe-core
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
    
    // REQUIRED: Zero critical/serious violations
  });
  
  // REQUIRED: Keyboard navigation test
  test('all interactive elements keyboard accessible', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Tab through all focusable elements
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();
    
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement.tagName);
      // Verify focus indicator visible
    }
  });
  
  // REQUIRED: Screen reader testing
  test('ARIA labels present and correct', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Check all buttons have accessible names
    const buttons = await page.locator('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent();
      if (!accessibleName) {
        throw new Error(`Button ${i} has no accessible name`);
      }
    }
  });
});

// VALIDATION:
// ☐ axe-core scan: zero violations
// ☐ Lighthouse accessibility score: ≥95
// ☐ Keyboard navigation: All interactive elements reachable
// ☐ Focus indicators: Visible and distinct (not outline:none)
// ☐ Color contrast: ≥4.5:1 normal text, ≥3:1 large text
// ☐ ARIA attributes: Correct and complete
// ☐ Form labels: Associated with inputs
// ☐ Alt text: Present and descriptive for images
// ☐ Heading hierarchy: Logical (H1 → H2 → H3)
// ☐ Screen reader testing: NVDA/JAWS compatibility verified
```

### Responsive Design Validation

**Multi-Device Testing Standards:**
```javascript
// REQUIRED: Responsive design breakpoints
const breakpoints = [
  { name: 'Mobile Portrait', width: 375, height: 667 },
  { name: 'Mobile Landscape', width: 667, height: 375 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: '4K', width: 3840, height: 2160 }
];

test.describe('Responsive Design Tests', () => {
  for (const viewport of breakpoints) {
    test(`renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      await page.goto('https://example.com');
      
      // REQUIRED: No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
      
      // REQUIRED: Touch targets ≥44x44px on mobile
      if (viewport.width < 768) {
        const buttons = await page.locator('button, a');
        for (let i = 0; i < await buttons.count(); i++) {
          const box = await buttons.nth(i).boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      // Visual snapshot
      await page.screenshot({ 
        path: `responsive-${viewport.name}.png`,
        fullPage: true 
      });
    });
  }
});

// VALIDATION:
// ☐ No horizontal scroll on any viewport
// ☐ Content readable without zooming
// ☐ Touch targets ≥44x44px on mobile
// ☐ Text size ≥16px (no pinch-to-zoom required)
// ☐ Navigation accessible on mobile (hamburger menu)
// ☐ Forms usable on mobile (proper input types)
// ☐ Images scale appropriately (responsive images)
// ☐ Layout does not break at any breakpoint
```

### User Experience Metrics

**Core Web Vitals Monitoring:**
```javascript
// REQUIRED: Track Core Web Vitals in production
// Largest Contentful Paint (LCP): <2.5s
// First Input Delay (FID): <100ms
// Cumulative Layout Shift (CLS): <0.1

import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
  
  // Send to analytics endpoint
  navigator.sendBeacon('/api/analytics/web-vitals', body);
}

// Track Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// VALIDATION THRESHOLDS:
// ☐ LCP (Largest Contentful Paint): <2.5s (75th percentile)
// ☐ FID (First Input Delay): <100ms (75th percentile)
// ☐ CLS (Cumulative Layout Shift): <0.1 (75th percentile)
// ☐ FCP (First Contentful Paint): <1.8s
// ☐ TTFB (Time to First Byte): <600ms
// ☐ INP (Interaction to Next Paint): <200ms
```

---

## Observability, Monitoring & Incident Readiness

### Health Check Endpoints

**Comprehensive Health Check Implementation:**
```csharp
// REQUIRED: Multi-level health checks
public class HealthCheckConfiguration
{
    public static IServiceCollection AddHealthChecks(this IServiceCollection services, IConfiguration config)
    {
        services.AddHealthChecks()
            // REQUIRED: Liveness probe (can respond to requests)
            .AddCheck("self", () => HealthCheckResult.Healthy())
            
            // REQUIRED: Database connectivity
            .AddSqlServer(
                config.GetConnectionString("DefaultConnection"),
                name: "database",
                tags: new[] { "db", "sql", "ready" })
            
            // REQUIRED: Redis cache
            .AddRedis(
                config.GetConnectionString("Redis"),
                name: "cache",
                tags: new[] { "cache", "redis", "ready" })
            
            // REQUIRED: External dependencies
            .AddUrlGroup(
                new Uri(config["ExternalServices:PaymentGateway"]),
                name: "payment-gateway",
                tags: new[] { "external", "ready" })
            
            // REQUIRED: Disk space
            .AddDiskStorageHealthCheck(
                options => options.AddDrive("C:\\", minimumFreeMegabytes: 1024),
                name: "disk-space",
                tags: new[] { "infrastructure" })
            
            // REQUIRED: Memory usage
            .AddPrivateMemoryHealthCheck(1024 * 1024 * 1024, name: "memory");  // 1GB
        
        return services;
    }
}

public class Startup
{
    public void Configure(IApplicationBuilder app)
    {
        // REQUIRED: Separate liveness and readiness endpoints
        app.UseHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = (check) => check.Tags.Contains("live") || check.Name == "self",
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });
        
        app.UseHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = (check) => check.Tags.Contains("ready"),
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });
    }
}

// VALIDATION:
// ☐ /health/live returns 200 if app can handle requests
// ☐ /health/ready returns 200 if all dependencies available
// ☐ Health checks run on Kubernetes probes
// ☐ Degraded state reported (not just healthy/unhealthy)
// ☐ Health check response includes dependency status
```

### Distributed Tracing

**OpenTelemetry Implementation:**
```csharp
// REQUIRED: Comprehensive distributed tracing
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddOpenTelemetry()
            .WithTracing(builder =>
            {
                builder
                    // REQUIRED: Instrument ASP.NET Core
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.Filter = (httpContext) =>
                        {
                            // Don't trace health checks
                            return !httpContext.Request.Path.StartsWithSegments("/health");
                        };
                    })
                    
                    // REQUIRED: Instrument HTTP clients
                    .AddHttpClientInstrumentation()
                    
                    // REQUIRED: Instrument database calls
                    .AddEntityFrameworkCoreInstrumentation(options =>
                    {
                        options.SetDbStatementForText = true;
                        options.SetDbStatementForStoredProcedure = true;
                    })
                    
                    // REQUIRED: Instrument Redis
                    .AddRedisInstrumentation()
                    
                    // REQUIRED: Export to Jaeger/Tempo
                    .AddJaegerExporter(options =>
                    {
                        options.AgentHost = "jaeger";
                        options.AgentPort = 6831;
                    });
            })
            .WithMetrics(builder =>
            {
                builder
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddProcessInstrumentation()
                    .AddPrometheusExporter();
            });
    }
}

// CUSTOM SPAN INSTRUMENTATION:
public async Task<Order> ProcessOrderAsync(Guid orderId)
{
    using var activity = ActivitySource.StartActivity("ProcessOrder");
    activity?.SetTag("order.id", orderId);
    activity?.SetTag("service.name", "OrderService");
    
    try
    {
        var order = await _repository.GetByIdAsync(orderId);
        
        // Child span for payment processing
        using var paymentActivity = ActivitySource.StartActivity("ProcessPayment");
        paymentActivity?.SetTag("payment.amount", order.TotalAmount);
        
        await _paymentService.ProcessAsync(order);
        
        activity?.SetTag("order.status", "completed");
        return order;
    }
    catch (Exception ex)
    {
        activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity?.RecordException(ex);
        throw;
    }
}

// VALIDATION:
// ☐ All HTTP requests traced end-to-end
// ☐ Database queries included in traces
// ☐ External API calls traced
// ☐ Trace context propagated (W3C Trace Context)
// ☐ Error traces include exception details
// ☐ Custom business events tagged in spans
// ☐ Trace sampling configured (100% dev, 10% prod)
```

### Incident Response Readiness

**Runbook and Playbook Standards:**
```markdown
# REQUIRED: Comprehensive runbooks for common incidents

## Incident: High API Error Rate

### Detection
- Alert: Error rate >1% for 5 minutes
- Grafana dashboard: API Errors panel
- PagerDuty: Critical alert sent to on-call engineer

### Triage Steps
1. Check Grafana dashboard for affected endpoints
2. Query Loki logs for error details:
   ```
   {app="myapp"} |= "ERROR" | json | status >= 500
   ```
3. Check Jaeger for failed request traces
4. Verify database connectivity (health check endpoint)
5. Check upstream service status pages

### Resolution Steps

#### Scenario A: Database Connection Pool Exhausted
1. Scale up API replicas: `kubectl scale deployment myapp --replicas=10`
2. Monitor connection pool metrics
3. If persists, restart database connection pool:
   ```bash
   kubectl exec -it myapp-pod -- /app/scripts/reset-db-pool.sh
   ```

#### Scenario B: External Service Outage
1. Enable circuit breaker manually (feature flag)
2. Switch to cached responses
3. Communicate status to customers via status page

#### Scenario C: Code Deployment Issue
1. Rollback deployment:
   ```bash
   kubectl rollout undo deployment/myapp
   ```
2. Verify error rate returns to normal
3. Post-mortem: Review code changes in failed deployment

### Communication
- Post in #incidents Slack channel
- Update status page: status.example.com
- Notify stakeholders if user-facing impact

### Post-Incident
- Create post-mortem document within 48 hours
- Identify root cause and preventive measures
- Update runbook with lessons learned

## Incident: High Latency (P95 >1s)

### Detection
- Alert: P95 latency >1000ms for 10 minutes
- Grafana: API Latency panel shows spike

### Triage Steps
1. Identify slow endpoints (Grafana query):
   ```
   topk(5, rate(http_request_duration_seconds_sum[5m]) 
        / rate(http_request_duration_seconds_count[5m]))
   ```
2. Check database slow query log
3. Analyze Jaeger traces for bottlenecks
4. Check cache hit ratio (should be >80%)

### Resolution Steps
1. Warm up cache for frequently accessed data
2. Scale up replicas if CPU/memory high
3. Identify and kill long-running queries
4. Enable read replicas for read-heavy endpoints

### VALIDATION:
### ☐ Runbooks documented for top 10 incident types
### ☐ Runbooks tested quarterly (game day exercises)
### ☐ Incident response time <15 minutes (MTTR)
### ☐ On-call rotation documented and staffed
### ☐ Escalation paths defined
### ☐ Communication templates prepared
```

---

## Production Release Governance

### Pre-Production Checklist

**Comprehensive Release Readiness Validation:**
```
PRE-PRODUCTION SIGN-OFF CHECKLIST

FUNCTIONALITY:
☐ All acceptance criteria met and validated
☐ User acceptance testing (UAT) completed
☐ Regression testing passed (no existing features broken)
☐ Edge cases tested (null, empty, boundary values)
☐ Error handling verified (graceful degradation)
☐ Feature flags configured (gradual rollout)

PERFORMANCE:
☐ Load testing completed (target: 1000 req/s, P95 <200ms)
☐ Stress testing passed (graceful degradation under load)
☐ Database query performance verified (<100ms)
☐ Memory leak testing passed (4-hour soak test)
☐ No N+1 queries detected
☐ Caching strategy validated (>80% hit ratio)

SECURITY:
☐ Security audit completed (no critical vulnerabilities)
☐ OWASP Top 10 mitigation verified
☐ Dependency vulnerabilities resolved (zero critical/high)
☐ Penetration testing completed (if major changes)
☐ Secrets rotation completed (no hardcoded credentials)
☐ HTTPS enforced (HSTS header configured)
☐ Security headers validated (CSP, X-Frame-Options, etc.)

RELIABILITY:
☐ Health checks configured (/health/live, /health/ready)
☐ Circuit breakers tested (external service failures)
☐ Retry logic validated (exponential backoff)
☐ Graceful shutdown implemented (SIGTERM handling)
☐ Database migration tested (rollback strategy)
☐ Backward compatibility verified (API contracts)

OBSERVABILITY:
☐ Logging instrumented (structured JSON logs)
☐ Metrics exported (Prometheus format)
☐ Distributed tracing enabled (OpenTelemetry)
☐ Dashboards created/updated (Grafana)
☐ Alerts configured (critical: error rate, latency)
☐ Runbooks updated (incident response procedures)

DEPLOYMENT:
☐ Deployment strategy defined (blue-green, canary, rolling)
☐ Rollback plan documented and tested
☐ Database migrations backward-compatible
☐ Feature flags ready (for gradual rollout)
☐ Smoke tests automated (post-deployment validation)
☐ Deployment runbook reviewed

DOCUMENTATION:
☐ API documentation updated (OpenAPI/Swagger)
☐ Architecture decision records (ADRs) created
☐ Release notes prepared (user-facing changes)
☐ Operational documentation updated (runbooks)
☐ Migration guide (if breaking changes)

COMPLIANCE:
☐ Privacy impact assessment (if handling PII)
☐ Data retention policies followed
☐ Audit logging enabled (sensitive operations)
☐ Compliance requirements met (GDPR, SOC 2, etc.)

COMMUNICATION:
☐ Stakeholders notified (release communication)
☐ Customer-facing changes communicated
☐ On-call engineer briefed
☐ Maintenance window scheduled (if downtime required)
```

### Change Management Process

**Production Change Workflow:**
```
PRODUCTION CHANGE CATEGORIES:

STANDARD CHANGE (Pre-approved, low risk)
- Examples: Feature flag toggle, configuration update, certificate renewal
- Approval: Tech Lead
- Deployment Window: Anytime (automated)
- Rollback: Automatic (via feature flag or config revert)

NORMAL CHANGE (Standard review process)
- Examples: New feature, API changes, database schema update
- Approval: Engineering Manager + Staff Engineer
- Deployment Window: Business hours (with on-call standby)
- Rollback: Documented rollback procedure

EMERGENCY CHANGE (Critical fix, expedited process)
- Examples: Security vulnerability patch, production outage fix
- Approval: On-call engineer + Engineering Manager (post-deployment review)
- Deployment Window: Immediate
- Rollback: Pre-tested rollback script

MAJOR CHANGE (High risk, extensive review)
- Examples: Infrastructure migration, major architecture change
- Approval: CTO + Engineering Leadership + Architecture Review Board
- Deployment Window: Planned maintenance window (off-hours)
- Rollback: Full rollback plan tested in staging

CHANGE REQUEST TEMPLATE:
---
Title: [Brief description of change]
Category: [Standard / Normal / Emergency / Major]
Requestor: [Name, team]
Target Date: [YYYY-MM-DD]

Description:
[Detailed description of what is changing and why]

Impact Analysis:
- User-facing impact: [None / Low / Medium / High]
- Downtime required: [Yes / No] Duration: [X minutes]
- Affected systems: [List of services/components]
- Dependencies: [List of dependent systems]

Risk Assessment:
- Risk level: [Low / Medium / High / Critical]
- Mitigation: [How risks are mitigated]
- Rollback strategy: [Detailed rollback procedure]

Testing:
- Testing completed: [Unit, integration, E2E, load, security]
- Test environment: [Staging / Pre-production]
- Sign-off: [QA Engineer name]

Deployment Plan:
1. [Step-by-step deployment procedure]
2. [Validation steps]
3. [Monitoring checkpoints]

Rollback Plan:
1. [Step-by-step rollback procedure]
2. [Validation after rollback]

Communication:
- Stakeholders notified: [Yes / No]
- Customer communication: [Required / Not required]
- Status page update: [Yes / No]

Approval:
- Tech Lead: [Name] [Date]
- Engineering Manager: [Name] [Date]
- Security Engineer: [Name] [Date] (if security-related)
---

VALIDATION:
☐ All changes tracked (change management system)
☐ Approval obtained before deployment
☐ Rollback tested in pre-production
☐ Communication plan executed
☐ Post-deployment review completed
```

### Post-Deployment Validation

**Post-Release Monitoring:**
```
POST-DEPLOYMENT VALIDATION (First 24 Hours)

IMMEDIATE (0-15 minutes):
☐ Smoke tests passed (automated)
☐ Health check endpoints returning 200 OK
☐ Error rate <0.1% (pre-deployment baseline)
☐ P95 latency within normal range (±10%)
☐ Zero 5xx errors from new endpoints
☐ Canary metrics stable (if canary deployment)

SHORT-TERM (15 minutes - 2 hours):
☐ User-facing features validated manually
☐ Critical user journeys tested
☐ Database migrations completed successfully
☐ No degradation in Core Web Vitals
☐ Cache warming completed
☐ Load balancer traffic distribution even
☐ No unexpected alerts triggered

MEDIUM-TERM (2-24 hours):
☐ Error rates stable (no increase from baseline)
☐ Latency metrics stable (P50, P95, P99)
☐ Resource utilization within limits (CPU <70%, memory <80%)
☐ No memory leaks detected
☐ Database performance stable (query times)
☐ Third-party integrations functioning
☐ Business metrics tracking (orders, signups, revenue)

ROLLBACK TRIGGERS:
- Error rate >1% for 5 minutes
- P95 latency >2x baseline for 10 minutes
- Any 5xx errors on critical endpoints
- Database connection pool exhaustion
- Memory leak detected (>90% usage sustained)
- Critical user journey failure
- Security incident detected

POST-DEPLOYMENT REVIEW (Within 48 hours):
☐ Metrics dashboard reviewed
☐ User feedback collected
☐ Incidents logged and analyzed
☐ Lessons learned documented
☐ Rollback plan updated (if issues encountered)
☐ Success criteria validated
```

---

## Technical Debt Assessment Model

### Technical Debt Identification

**Debt Classification System:**
```
TECHNICAL DEBT CATEGORIES:

CODE QUALITY DEBT:
- Code smells: God objects, shotgun surgery, feature envy
- Complexity: Cyclomatic complexity >15, nested conditionals >4
- Duplication: Code clones >50 lines
- Coupling: Tight coupling between modules
- Cohesion: Low cohesion (unrelated responsibilities in one class)

ARCHITECTURAL DEBT:
- Layer violations: Infrastructure in domain layer
- Missing patterns: No repository pattern, no CQRS for complex domains
- Scalability issues: Single-threaded processing, no caching
- Technology obsolescence: Deprecated frameworks, unsupported libraries

TEST DEBT:
- Low coverage: <85% code coverage
- Missing tests: Critical paths untested
- Flaky tests: >2% flakiness rate
- Slow tests: Test suite >15 minutes
- No E2E tests: Critical user journeys untested

SECURITY DEBT:
- Vulnerabilities: Known CVEs in dependencies
- Missing security controls: No rate limiting, no input validation
- Outdated dependencies: Packages >1 year old
- Configuration issues: Debug mode in production, verbose errors

INFRASTRUCTURE DEBT:
- Manual processes: Manual deployments, no IaC
- No monitoring: Missing metrics, no alerting
- No disaster recovery: No backups, no failover
- Scaling limitations: No horizontal scaling, no autoscaling

DOCUMENTATION DEBT:
- Missing docs: No API documentation, no runbooks
- Outdated docs: Documentation doesn't match code
- No architecture diagrams: System design not documented
```

### Technical Debt Scoring

**Debt Prioritization Matrix:**
```
DEBT SCORE FORMULA:

Debt Score = (Impact × Probability × Spread) - Remediation Cost

Impact (1-10):
1-3: Low (minor inconvenience, workarounds available)
4-7: Medium (affects productivity, intermittent issues)
8-10: High (blocks features, production incidents)

Probability (1-10):
1-3: Rare (unlikely to cause issues)
4-7: Occasional (happens sometimes)
8-10: Frequent (happens regularly)

Spread (1-5):
1: Isolated (affects one component)
2-3: Contained (affects one service)
4-5: Widespread (affects multiple services/teams)

Remediation Cost (1-10):
1-3: Low (< 1 week of effort)
4-7: Medium (1-4 weeks of effort)
8-10: High (>1 month of effort)

PRIORITIZATION:
- High Priority: Score >60 (tackle immediately)
- Medium Priority: Score 30-60 (schedule in next quarter)
- Low Priority: Score <30 (backlog, opportunistic fixes)

EXAMPLE:
Technical Debt Item: N+1 Query Problem in Orders API

Impact: 8 (API latency >1s, user-facing impact)
Probability: 10 (happens on every page load)
Spread: 3 (affects Orders service only)
Remediation Cost: 2 (simple fix, add eager loading)

Debt Score = (8 × 10 × 3) - 2 = 240 - 2 = 238
Priority: HIGH (immediate fix required)
```

### Technical Debt Tracking

**Debt Management Process:**
```markdown
# TECHNICAL DEBT REGISTER

## TD-001: N+1 Query in Orders API

**Category:** Performance Debt
**Priority:** High
**Score:** 238
**Discovered:** 2026-01-15
**Affected Component:** OrdersController.GetOrders()

**Description:**
Orders API makes N+1 database queries when loading order items.
For 100 orders with 10 items each, this results in 101 database queries instead of 2.

**Impact:**
- API response time: 1.2 seconds (target: <200ms)
- Database load increased 50x
- Poor user experience (slow page loads)

**Remediation Plan:**
1. Add `.Include(o => o.Items)` to EF Core query
2. Add integration test to prevent regression
3. Monitor query count in logs

**Estimated Effort:** 2 days
**Assigned To:** Backend Team
**Target Date:** 2026-02-01

**Status:** In Progress

---

## TD-002: Missing API Rate Limiting

**Category:** Security Debt
**Priority:** High
**Score:** 210

[Details...]

---

## QUARTERLY DEBT RETIREMENT GOALS:
Q1 2026:
- Resolve all high-priority debt (score >60)
- Reduce medium-priority debt by 50%
- Refactor legacy authentication module

Q2 2026:
- Implement CQRS for Order domain
- Upgrade to .NET 9
- Migrate to Kubernetes

VALIDATION:
☐ Technical debt tracked in issue tracker (Jira, GitHub Issues)
☐ Debt scored and prioritized quarterly
☐ 20% of sprint capacity allocated to debt retirement
☐ Debt metrics tracked over time (trend analysis)
☐ Architectural debt reviewed by Principal Engineers
```

---

## Engineering Scoring & Risk Classification System

### Quality Score Calculation

**Enterprise Quality Score (EQS):**
```
ENTERPRISE QUALITY SCORE (0-100):

EQS = (Code Quality × 0.25) + 
      (Test Coverage × 0.20) + 
      (Security Score × 0.25) + 
      (Performance Score × 0.15) + 
      (Architecture Score × 0.10) + 
      (Operational Readiness × 0.05)

CODE QUALITY SCORE (0-100):
- SonarQube Quality Gate: Pass = 100, Fail = 0
- Code Coverage: (Actual Coverage / 85) × 100 (capped at 100)
- Cyclomatic Complexity: 100 - (Avg Complexity / 20 × 100)
- Code Duplication: 100 - (Duplication % × 10)
- Code Smells: 100 - (Critical Smells × 10)

TEST COVERAGE SCORE (0-100):
- Unit Test Coverage: (Line Coverage / 85) × 50
- Integration Test Coverage: (Critical Paths Covered / Total) × 30
- E2E Test Coverage: (User Journeys Covered / Total) × 20

SECURITY SCORE (0-100):
- Vulnerability Scan: 100 if zero critical/high, else 0
- OWASP Top 10: 100 if all mitigated, else (Mitigated / 10) × 100
- Dependency Audit: 100 - (Critical Vulnerabilities × 20)
- Security Headers: (Headers Present / 8) × 100
- Authentication: 100 if MFA + JWT secure, else 50

PERFORMANCE SCORE (0-100):
- API Latency: 100 if P95 <200ms, linear decline to 0 at >1s
- Database Queries: 100 if all <100ms, else (Fast Queries / Total) × 100
- Cache Hit Ratio: Actual Hit Ratio × 100
- Core Web Vitals: (LCP + FID + CLS scores) / 3

ARCHITECTURE SCORE (0-100):
- Clean Architecture: 100 if compliant, else 50
- SOLID Principles: Manual review (0-100)
- Design Patterns: Manual review (0-100)
- Scalability: 100 if horizontally scalable, else 50

OPERATIONAL READINESS SCORE (0-100):
- Health Checks: 25 if present
- Monitoring: 25 if comprehensive
- Logging: 25 if structured JSON
- Runbooks: 25 if documented

EXAMPLE CALCULATION:
Code Quality: 92 (SonarQube pass, 87% coverage, low complexity)
Test Coverage: 88 (87% line coverage, all critical paths, major journeys)
Security: 100 (zero vulnerabilities, OWASP compliant)
Performance: 85 (P95 180ms, all queries fast, 82% cache hit)
Architecture: 90 (Clean Architecture, good SOLID adherence)
Operational: 100 (all criteria met)

EQS = (92 × 0.25) + (88 × 0.20) + (100 × 0.25) + (85 × 0.15) + (90 × 0.10) + (100 × 0.05)
EQS = 23 + 17.6 + 25 + 12.75 + 9 + 5
EQS = 92.35 / 100

RATING:
90-100: Excellent (Production-ready, exemplary quality)
75-89: Good (Production-ready, minor improvements)
60-74: Acceptable (Requires improvements before production)
<60: Needs Work (Not production-ready, significant issues)
```

### Risk Classification

**Production Risk Matrix:**
```
RISK ASSESSMENT FORMULA:

Risk Score = (Severity × Likelihood × Detectability) / Mitigation Factor

Severity (1-10):
1-2: Negligible (no user impact)
3-5: Minor (limited impact, workarounds available)
6-8: Major (significant impact, degraded service)
9-10: Critical (service outage, data loss, security breach)

Likelihood (1-10):
1-2: Rare (<1% probability)
3-5: Possible (1-10% probability)
6-8: Likely (10-50% probability)
9-10: Almost Certain (>50% probability)

Detectability (1-10):
1-2: Easily Detected (automated alerts, immediate visibility)
3-5: Detectable (monitoring will catch within minutes)
6-8: Hard to Detect (manual investigation required)
9-10: Hidden (requires deep investigation, user reports)

Mitigation Factor (1-10):
10: Fully mitigated (redundancy, automatic failover)
5: Partially mitigated (manual intervention possible)
1: No mitigation (no recovery strategy)

RISK LEVELS:
Critical: Risk Score >70 (deployment blocker)
High: Risk Score 40-70 (requires mitigation plan)
Medium: Risk Score 20-40 (acceptable with monitoring)
Low: Risk Score <20 (acceptable)

EXAMPLE RISK ASSESSMENTS:

Risk 1: Database Connection Pool Exhaustion
Severity: 9 (service outage)
Likelihood: 6 (possible under load)
Detectability: 2 (alerts configured)
Mitigation: 7 (connection pool sizing, scaling, circuit breaker)

Risk Score = (9 × 6 × 2) / 7 = 108 / 7 = 15.4
Risk Level: LOW (acceptable with current mitigations)

Risk 2: SQL Injection Vulnerability
Severity: 10 (data breach)
Likelihood: 8 (if input validation missing)
Detectability: 6 (requires security scan)
Mitigation: 2 (no parameterized queries)

Risk Score = (10 × 8 × 6) / 2 = 480 / 2 = 240
Risk Level: CRITICAL (deployment blocker)

RISK REGISTER:
Risk ID | Description | Risk Score | Level | Mitigation
R-001 | DB Connection Pool | 15.4 | Low | Monitoring + autoscaling
R-002 | SQL Injection | 240 | Critical | BLOCK: Implement parameterized queries
R-003 | API Rate Limit | 45 | High | Implement rate limiting
```

---

## Enterprise Best Practices Appendix

### Code Review Best Practices

**Effective Code Review Checklist:**
```
CODE REVIEW GUIDELINES FOR REVIEWERS:

BEFORE REVIEWING:
☐ Understand the context (read ticket/story)
☐ Review architecture decision records (ADRs)
☐ Check CI/CD pipeline status (all green)
☐ Verify automated checks passed (linting, tests, security)

DURING REVIEW:
☐ Functionality: Does code meet requirements?
☐ Correctness: Is logic sound, edge cases handled?
☐ Design: Does it follow Clean Architecture, SOLID?
☐ Security: Any vulnerabilities (SQL injection, XSS, etc.)?
☐ Performance: Any obvious bottlenecks (N+1 queries)?
☐ Tests: Adequate coverage, meaningful assertions?
☐ Readability: Clear variable names, comments where needed?
☐ Maintainability: Will future engineers understand this?

PROVIDE CONSTRUCTIVE FEEDBACK:
✅ GOOD: "Consider extracting this logic into a separate method for better testability. Example: [code snippet]"
❌ BAD: "This is messy, refactor it."

✅ GOOD: "This query could cause an N+1 problem. Use .Include() to eager load related entities."
❌ BAD: "N+1 query"

APPROVAL CRITERIA:
- APPROVE: Code meets all standards, no blocking issues
- REQUEST CHANGES: Blocking issues (security, correctness, architecture violations)
- COMMENT: Non-blocking suggestions for improvement

REVIEW TURNAROUND:
- Small PRs (<200 lines): 2 hours
- Medium PRs (200-500 lines): 4 hours
- Large PRs (>500 lines): 1 day
- Break down PRs >1000 lines

VALIDATION:
☐ All PRs reviewed by ≥2 engineers
☐ Security-sensitive changes reviewed by security engineer
☐ Architecture changes reviewed by principal engineer
☐ Review comments addressed before merge
☐ No merge without approval
```

### Git Workflow Standards

**Branch Strategy and Commit Conventions:**
```
GIT WORKFLOW (Git Flow):

BRANCHES:
- main: Production-ready code (protected, no direct commits)
- develop: Integration branch for features
- feature/*: New features (branch from develop)
- hotfix/*: Critical production fixes (branch from main)
- release/*: Release preparation (branch from develop)

BRANCH NAMING:
feature/TICKET-123-user-authentication
hotfix/TICKET-456-payment-gateway-fix
release/v2.1.0

COMMIT MESSAGE CONVENTION (Conventional Commits):
<type>(<scope>): <subject>

<body>

<footer>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, no logic change)
- refactor: Code refactoring (no feature change)
- perf: Performance improvement
- test: Adding tests
- chore: Build process, dependencies, tooling

Example:
feat(auth): add multi-factor authentication

Implement TOTP-based MFA for user accounts.
Users can enable MFA in account settings.

Closes #123

PULL REQUEST TEMPLATE:
---
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Security implications considered
- [ ] Performance impact assessed

## Related Issues
Closes #123

## Screenshots (if applicable)
[Add screenshots]
---

VALIDATION:
☐ Descriptive commit messages (not "fix bug" or "update code")
☐ Atomic commits (one logical change per commit)
☐ No merge commits in feature branches (rebase before merge)
☐ Signed commits (GPG signature for main/develop)
☐ PR description includes context and rationale
```

### Performance Optimization Patterns

**Common Performance Optimization Techniques:**
```typescript
// 1. MEMOIZATION (React)
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => heavyProcessing(item));
  }, [data]);
  
  return <div>{processedData}</div>;
});

// 2. DEBOUNCING (User input)
const SearchBar = () => {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useDebounce((value) => {
    api.search(value);
  }, 300);
  
  const handleChange = (e) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };
};

// 3. VIRTUALIZATION (Long lists)
import { FixedSizeList } from 'react-window';

const LargeList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>{items[index]}</div>
    )}
  </FixedSizeList>
);

// 4. CODE SPLITTING
const AdminPanel = lazy(() => import('./AdminPanel'));

// 5. IMAGE OPTIMIZATION
<img
  src="image.jpg"
  srcSet="image-400w.jpg 400w, image-800w.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  loading="lazy"
  alt="Description"
/>

// 6. API REQUEST BATCHING
const batchRequests = (requests) => {
  return Promise.all(requests.map(r => api.get(r)));
};

// 7. CACHING (React Query)
const { data } = useQuery(['orders', customerId], 
  () => api.getOrders(customerId),
  {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 30 * 60 * 1000  // 30 minutes
  }
);
```

### Security Best Practices Summary

**Security Checklist (Quick Reference):**
```
INPUT VALIDATION:
☐ Whitelist validation (not just blacklist)
☐ Parameterized queries (no string concatenation)
☐ Sanitize user input (DOMPurify for HTML)
☐ Validate on server-side (not just client)
☐ Length limits enforced (prevent DoS)

AUTHENTICATION:
☐ MFA enabled for privileged accounts
☐ Password minimum 12 characters
☐ bcrypt/Argon2 for password hashing
☐ Account lockout after failed attempts
☐ Session timeout after inactivity

AUTHORIZATION:
☐ Resource-level authorization (not just role checks)
☐ Principle of least privilege
☐ Authorization at every layer
☐ 403 Forbidden (not 404) for unauthorized access

DATA PROTECTION:
☐ HTTPS only (HSTS header)
☐ Sensitive data encrypted at rest (AES-256)
☐ JWT in httpOnly cookies (not localStorage)
☐ Secrets in Key Vault (not config files)
☐ PII/PCI data minimization

SECURITY HEADERS:
☐ Content-Security-Policy
☐ X-Frame-Options: DENY
☐ X-Content-Type-Options: nosniff
☐ Strict-Transport-Security
☐ Referrer-Policy

DEPENDENCIES:
☐ Automated vulnerability scanning (Snyk, Dependabot)
☐ Zero critical/high vulnerabilities
☐ Regular dependency updates
☐ No deprecated packages

LOGGING & MONITORING:
☐ Security events logged (auth failures, authorization failures)
☐ No secrets logged (passwords, tokens)
☐ Centralized logging (SIEM integration)
☐ Real-time alerts for suspicious activity
```

---

## Conclusion

This Software Engineering Quality Assurance Master Framework provides a comprehensive, enterprise-grade evaluation standard for React + .NET application ecosystems. It is designed for use by principal engineers, software architects, technical leads, QA engineers, security auditors, and AI-assisted code review systems.

### Framework Application

**For Human Engineers:**
- Use as a pre-production release checklist
- Reference during architecture reviews
- Guide for code review standards
- Benchmark for technical debt prioritization
- Foundation for engineering excellence programs

**For AI Engineering Agents:**
- Structured validation criteria for autonomous code review
- Machine-readable quality standards for automated analysis
- Pattern recognition templates for architecture evaluation
- Risk assessment logic for security and performance auditing
- Scoring algorithms for engineering quality measurement

### Continuous Improvement

This framework should be treated as a living document:
- Review quarterly and update with industry best practices
- Incorporate lessons learned from production incidents
- Evolve with technology changes (new frameworks, patterns, tools)
- Gather feedback from engineering teams and refine criteria
- Track metrics over time to measure quality improvements

### Success Metrics

Organizations adopting this framework should measure:
- Reduction in production incidents (MTBF increase)
- Faster incident resolution (MTTR reduction)
- Improved deployment frequency (daily deployments)
- Higher code quality scores (EQS >90)
- Reduced technical debt (debt score trending down)
- Enhanced security posture (zero critical vulnerabilities)
- Better performance metrics (P95 latency <200ms)

### Final Validation

**Before Production Deployment:**
```
FINAL GATE CHECKLIST:

☐ Enterprise Quality Score (EQS): ≥90/100
☐ Security Score: 100/100 (zero critical vulnerabilities)
☐ Performance Score: ≥85/100
☐ Test Coverage: ≥85%
☐ All critical/high risks mitigated
☐ Production readiness checklist completed
☐ Runbooks documented and tested
☐ Stakeholder sign-off obtained

IF ANY ITEM FAILS: Deployment blocked until resolved.
```

---

**Document Version:** 2.0  
**Last Updated:** 2026-Q2  
**Maintained By:** Engineering Excellence Team  
**Review Cycle:** Quarterly

**License:** Internal Use Only - Enterprise Engineering Standard

---

*This framework represents the collective expertise of principal engineers, security specialists, performance engineers, and DevOps leaders. It embodies the standards expected in elite software organizations and serves as the definitive quality benchmark for modern React + .NET application development.*
