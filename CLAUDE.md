# Retail Agentic - Project Context

## Project Overview

This is a monorepo containing a full-stack retail platform with a reactive backend and two frontend applications. The project uses specialized AI subagents for design, planning, delegation, implementation, and testing.

## Architecture

### Monorepo Structure

```
retail-agentic/
├── backend/           # Java Spring reactive backend
├── consumer-web/      # Customer-facing React+TypeScript app
├── admin-web/         # Administrative React+TypeScript app
└── shared/            # Shared utilities, types, and configurations
```

### Technology Stack

#### Backend
- **Language**: Java
- **Framework**: Spring Boot
- **Reactive Programming**: Project Reactor (Mono/Flux)
- **Data Storage**: Polyglot persistence - NoSQL preferred for performance/scalability
- **Key Characteristics**:
  - Non-blocking, reactive API design
  - Event-driven architecture
  - Backpressure handling
  - Asynchronous data processing

#### Frontend Applications

**PRIORITY: Clean & Modern UI/UX**
- Minimalist, user-centered design
- Tailwind CSS + shadcn/ui component library
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design
- Smooth animations and transitions

**Consumer Web**
- **Framework**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Purpose**: Customer-facing e-commerce interface
- **Features**: Product browsing, cart, checkout, user accounts
- **Design Focus**: Clean, modern, conversion-optimized

**Admin Web**
- **Framework**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Purpose**: Administrative dashboard for managing the retail platform
- **Features**: Product management, order processing, analytics, user management
- **Design Focus**: Data-dense, efficient workflows, clear information hierarchy

## Development Workflow

### Specialized Subagents

This project leverages AI subagents for different aspects of development:

1. **UI/UX Designer Agent**: Design systems, user flows, visual design (NEW - PRIORITY)
2. **Architect Agent**: Architecture and system design decisions
3. **Planner Agent**: Breaking down features into implementation tasks
4. **Backend Developer Agent**: Writing reactive Java/Spring backend code
5. **Frontend Developer Agent**: Implementing React/TypeScript UI per design specs
6. **Testing Agent**: Creating and running tests, ensuring quality
7. **Integration Agent**: Ensuring components work together seamlessly
8. **DevOps Agent**: Build systems, CI/CD, infrastructure

### Best Practices

#### Backend (Java/Spring/Reactor)
- Use Mono<T> for 0..1 results
- Use Flux<T> for 0..N results
- Avoid blocking operations in reactive pipelines
- Use appropriate schedulers for blocking operations when unavoidable
- Implement proper error handling with onErrorResume/onErrorReturn
- Use functional composition with operators (map, flatMap, filter, etc.)

#### Frontend (React/TypeScript)
- **PRIORITY**: Implement clean, modern UI/UX per design specifications
- Use Tailwind CSS + shadcn/ui for all styling
- Strict TypeScript configuration (no `any` types)
- Component-based architecture following design system
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design
- Smooth animations and transitions (200-300ms)
- Type-safe API clients
- Shared component libraries between apps
- Performance optimization (lazy loading, code splitting)

#### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test reactive streams with StepVerifier (backend)
- React Testing Library for frontend components

## Key Considerations

### Reactive Programming
The backend uses reactive programming patterns. Key points:
- All database operations should be reactive
- API endpoints return Mono or Flux
- Chain operations rather than blocking
- Consider backpressure in stream processing

### Monorepo Benefits
- Shared code and types across projects
- Consistent tooling and CI/CD
- Atomic commits across frontend and backend
- Easier refactoring across boundaries

### API Design
- RESTful endpoints for CRUD operations
- Consider WebSocket or Server-Sent Events for real-time features
- Consistent error responses
- API versioning strategy
- OpenAPI/Swagger documentation

### Multi-Tenancy Architecture

**Tenant Identification**
- Support both **subdomain** and **URL path** strategies
  - Subdomain: `store1.retail.com`, `store2.retail.com`
  - Path: `retail.com/store1`, `retail.com/store2`
- Tenant resolved at gateway/middleware layer
- Tenant context propagated through reactive chain

**Whitelabel Branding**
Each store/tenant has customizable branding:
- Logo and brand assets
- Color scheme (primary, secondary, accent colors)
- Typography (font families)
- Custom domain support
- Store name and metadata
- Email templates and notifications

**Data Isolation**
- **Shared database** with tenant discriminator (recommended for this scale)
- All collections/tables include `tenantId` field
- Automatic filtering in all queries
- Tenant-aware indexes for performance
- Admin portal can access all tenants (with proper authorization)

**Flexible Product Attributes**
Different product types support different attributes:
- Core attributes (common): name, description, price, images
- **Dynamic attributes** (type-specific): color, size, material, dimensions, etc.
- Attribute definitions stored per tenant
- Attributes are fully searchable in Elasticsearch
- UI dynamically renders based on product type

**Architecture Benefits**
- Single codebase serves all tenants
- Easy to onboard new stores
- Centralized updates and maintenance
- Shared infrastructure costs
- Cross-tenant analytics possible

### Database Strategy

**Polyglot Persistence Approach**

We prefer NoSQL solutions when they provide significant performance or scalability benefits. Choose the right database for each use case:

**NoSQL Solutions (Preferred for most use cases)**
- **MongoDB**: Primary choice for product catalog, user data, orders
  - Document model fits retail domain naturally
  - Excellent query performance with proper indexing
  - Horizontal scalability for high traffic
  - Reactive driver support (Spring Data Reactive MongoDB)

- **Redis**: Caching, sessions, real-time inventory
  - Sub-millisecond response times
  - Perfect for shopping carts, session management
  - Pub/sub for real-time features
  - Reactive support via Spring Data Redis Reactive

- **Elasticsearch**: Product search, analytics
  - Full-text search with advanced relevance
  - Faceted search and filtering
  - Analytics and aggregations
  - Near real-time indexing

**Relational (PostgreSQL) - Use only when:**
- Complex transactions with ACID guarantees required
- Strong referential integrity is critical
- Complex joins are unavoidable
- Data model is truly relational

**Decision Criteria**
1. **Performance**: Will NoSQL provide 10x+ improvement?
2. **Scalability**: Do we need to scale horizontally?
3. **Data Model**: Does document/key-value model fit naturally?
4. **Query Patterns**: Are queries simple lookups or need complex joins?
5. **Consistency**: Can we work with eventual consistency?

**Default Choices for Retail Platform**
- Product Catalog → MongoDB (flexible schema, fast queries)
- Shopping Carts → Redis (ephemeral, high-speed access)
- User Profiles → MongoDB (document model fits well)
- Orders → MongoDB (embedded line items, no joins needed)
- Inventory → Redis + MongoDB (real-time + persistence)
- Search → Elasticsearch (full-text search required)
- Analytics → Elasticsearch (aggregations and reporting)
- Payment Transactions → PostgreSQL (ACID required)

## Project Status

This project is in initial setup phase. Future development will establish:
- Directory structure for all three main components
- Build system and dependency management
- CI/CD pipelines
- Development environment setup
- Shared libraries and utilities

## Getting Started

(To be populated as project structure is established)

### Backend Setup
- Java version requirements
- Build tool (Maven/Gradle)
- Database setup
- Environment configuration

### Frontend Setup
- Node.js version requirements
- Package manager (npm/yarn/pnpm)
- Environment variables
- Development server commands

## Notes for AI Agents

When working on this project:
- **PRIORITY: Clean, modern UI/UX is critical to project success**
- UI/UX Designer agent should create designs before frontend implementation
- Frontend developers must implement designs pixel-perfect using Tailwind + shadcn/ui
- All UIs must meet WCAG 2.1 AA accessibility standards
- **CRITICAL: Multi-tenant architecture - all data must be tenant-isolated**
- Every MongoDB document must include `tenantId` field
- All queries must filter by tenant (automatic via middleware)
- Support flexible product attributes per product type
- Whitelabel branding must be configurable per tenant
- Always consider the reactive nature of the backend
- **Prefer NoSQL databases** when they provide performance or scalability benefits
- Use MongoDB for document storage (products, users, orders)
- Use Redis for caching and real-time data (carts, sessions, inventory)
- Use Elasticsearch for search and analytics
- Reserve PostgreSQL for transactions requiring ACID guarantees
- All database operations must use reactive drivers (no blocking)
- Maintain type safety across TypeScript frontends
- Keep APIs consistent between consumer and admin interfaces
- Share common components and utilities where appropriate
- Document architectural decisions, especially database choices
- Consider scalability and performance implications
- Test reactive streams properly with appropriate tools
