# Architecture Documentation

This directory contains comprehensive architectural documentation for the Retail Agentic platform.

---

## Table of Contents

### Core Architecture Documents

1. **[System Architecture](./system-architecture.md)** - Overall system design and architecture principles
   - High-level architecture diagrams
   - Component architecture
   - Data flow patterns
   - Technology stack decisions
   - Scalability strategy
   - Security architecture

2. **[Multi-Tenancy Architecture](./multi-tenancy.md)** - Tenant isolation and whitelabel capabilities
   - Tenant resolution strategies (subdomain vs path)
   - Data isolation patterns
   - Whitelabel branding implementation
   - Tenant context propagation
   - Security considerations
   - Performance optimization

3. **[Database Strategy](./database-strategy.md)** - Polyglot persistence approach
   - Database selection criteria
   - MongoDB (document store)
   - Redis (cache and sessions)
   - Elasticsearch (search engine)
   - PostgreSQL (transactional data)
   - Data flow patterns
   - Migration strategy

4. **[Deployment Architecture](./deployment.md)** - Infrastructure and DevOps
   - Infrastructure architecture (AWS + Kubernetes)
   - Container strategy (Docker)
   - Kubernetes deployment patterns
   - CI/CD pipeline (GitHub Actions)
   - Environment strategy
   - Monitoring and observability
   - Disaster recovery

---

## Architecture Overview

### System Context

Retail Agentic is a **cloud-native, multi-tenant e-commerce platform** built on modern architectural principles:

```
┌─────────────────────────────────────────────────────────────┐
│                     Retail Agentic Platform                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Consumer Web │  │  Admin Web   │  │   Backend API   │   │
│  │   (React)    │  │   (React)    │  │  (Spring Boot)  │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│         │                  │                    │            │
│         └──────────────────┴────────────────────┘            │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │                                      │             │
│  ┌──────▼───────┐  ┌────────┐  ┌────────┐  ┌──▼──────┐     │
│  │   MongoDB    │  │ Redis  │  │   ES   │  │   PG    │     │
│  │  (Products,  │  │(Carts, │  │(Search)│  │(Payment)│     │
│  │   Orders)    │  │ Cache) │  │        │  │         │     │
│  └──────────────┘  └────────┘  └────────┘  └─────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Characteristics

| Characteristic | Implementation | Document Reference |
|----------------|---------------|-------------------|
| **Multi-Tenancy** | Shared database with tenant discriminator | [Multi-Tenancy](./multi-tenancy.md) |
| **Reactive Programming** | Spring WebFlux + Project Reactor | [System Architecture](./system-architecture.md) |
| **Polyglot Persistence** | MongoDB, Redis, Elasticsearch, PostgreSQL | [Database Strategy](./database-strategy.md) |
| **Cloud-Native** | Docker + Kubernetes on AWS | [Deployment](./deployment.md) |
| **Scalability** | Horizontal pod autoscaling, database sharding | [System Architecture](./system-architecture.md) |
| **Security** | Tenant isolation, JWT auth, HTTPS-only | [System Architecture](./system-architecture.md) |
| **Observability** | Prometheus + Grafana + distributed tracing | [Deployment](./deployment.md) |

---

## Key Architectural Decisions

### 1. Multi-Tenancy Pattern

**Decision**: Shared database, shared schema with tenant discriminator

**Rationale**:
- ✅ Cost-effective for MVP (single infrastructure)
- ✅ Simple tenant onboarding
- ✅ Easier maintenance and upgrades
- ✅ Sufficient isolation for SaaS platform

**Alternative Considered**: Database-per-tenant (rejected due to operational complexity)

**Reference**: [Multi-Tenancy Architecture](./multi-tenancy.md)

---

### 2. Reactive Programming

**Decision**: Spring WebFlux with Project Reactor

**Rationale**:
- ✅ Non-blocking I/O for better resource utilization
- ✅ Built-in backpressure handling
- ✅ Better performance under high load
- ✅ Reactive database drivers available

**Alternative Considered**: Traditional Spring MVC (rejected due to blocking I/O)

**Reference**: [System Architecture - Reactive Patterns](./system-architecture.md#reactive-pipeline-example)

---

### 3. Polyglot Persistence

**Decision**: Use right database for each use case

**Rationale**:
- ✅ **MongoDB**: Fast document queries, flexible schema for products
- ✅ **Redis**: Sub-millisecond latency for carts and cache
- ✅ **Elasticsearch**: Full-text search with relevance scoring
- ✅ **PostgreSQL**: ACID compliance for financial transactions

**Alternative Considered**: Single database (rejected due to performance trade-offs)

**Reference**: [Database Strategy](./database-strategy.md)

---

### 4. Container Orchestration

**Decision**: Kubernetes (EKS) on AWS

**Rationale**:
- ✅ Horizontal autoscaling
- ✅ Self-healing and rolling updates
- ✅ Declarative configuration
- ✅ Industry standard

**Alternative Considered**: AWS ECS (rejected due to limited ecosystem)

**Reference**: [Deployment Architecture](./deployment.md)

---

### 5. Frontend Technology

**Decision**: React with TypeScript + Tailwind CSS + shadcn/ui

**Rationale**:
- ✅ Component-based architecture
- ✅ Type safety with TypeScript
- ✅ Rapid UI development with Tailwind + shadcn/ui
- ✅ Excellent ecosystem and tooling

**Alternative Considered**: Vue.js (rejected due to team expertise)

**Reference**: [System Architecture - Frontend Stack](./system-architecture.md#frontend-stack)

---

## Architecture Principles

### 1. Multi-Tenancy First
Every design decision considers tenant isolation and whitelabel capabilities. Data segregation is enforced at the application layer with zero tolerance for cross-tenant data leaks.

### 2. Reactive All The Way
Non-blocking, asynchronous processing from HTTP layer to database. Use Project Reactor for stream processing with proper backpressure handling.

### 3. Polyglot Persistence
Choose the right database for each use case. Optimize for performance and developer productivity.

### 4. API-First Design
Backend exposes well-defined RESTful APIs consumed by multiple frontends. OpenAPI documentation, versioned endpoints, consistent error handling.

### 5. Independent Deployability
Each component (backend, consumer-web, admin-web) can build, test, and run independently. Test isolation with in-memory databases and mocked APIs.

### 6. Security by Design
Security integrated at every layer: tenant isolation, JWT authentication, HTTPS-only, input validation, rate limiting.

### 7. Observability
Comprehensive monitoring with structured logging, application metrics, and distributed tracing. Fast incident detection and resolution.

---

## Technology Stack Summary

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Java | 21 (LTS) | Backend language |
| **Framework** | Spring Boot | 3.2+ | Application framework |
| **Reactive** | Project Reactor | 3.6+ | Reactive streams |
| **Build** | Maven | 3.9+ | Dependency management |
| **API Docs** | SpringDoc OpenAPI | 2.3+ | API documentation |

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20 (LTS) | JavaScript runtime |
| **Framework** | React | 18+ | UI library |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript |
| **Build** | Vite | 5+ | Fast build tool |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS |
| **Components** | shadcn/ui | Latest | Accessible components |
| **State** | TanStack Query | 5+ | Server state management |

### Data

| Database | Version | Use Case | Access Pattern |
|----------|---------|----------|---------------|
| **MongoDB** | 7.0+ | Products, Orders, Tenants | Reactive MongoDB |
| **Redis** | 7.2+ | Carts, Cache, Sessions | Reactive Redis |
| **Elasticsearch** | 8.11+ | Product Search | Reactive Elasticsearch |
| **PostgreSQL** | 15+ | Payment Transactions | R2DBC |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Runtime** | Docker | Packaging |
| **Orchestration** | Kubernetes (EKS) | Scaling & deployment |
| **CI/CD** | GitHub Actions | Automation |
| **Cloud** | AWS | Infrastructure |
| **Monitoring** | Prometheus + Grafana | Observability |
| **CDN** | CloudFlare | Content delivery |

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (p95)** | <500ms | Prometheus metrics |
| **Product Search** | <1s | Elasticsearch query time |
| **Page Load (FCP)** | <1.5s | Lighthouse |
| **Page Load (LCP)** | <2.5s | Core Web Vitals |
| **Cart Operations** | <100ms | Redis latency |
| **Uptime** | >99.5% | AWS CloudWatch |

---

## Scalability Strategy

### Horizontal Scaling

| Component | Scaling Method | Trigger | Max |
|-----------|---------------|---------|-----|
| **Backend API** | Kubernetes HPA | 70% CPU | 10 pods |
| **Frontend** | Kubernetes HPA | Request count | 4 pods |
| **MongoDB** | Sharding by tenantId | Storage | N nodes |
| **Redis** | Cluster mode | Memory | N nodes |
| **Elasticsearch** | Add data nodes | Query throughput | N nodes |

**Reference**: [System Architecture - Scalability](./system-architecture.md#scalability-strategy)

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────┐
│   Perimeter Security (WAF, DDoS, TLS)   │
├─────────────────────────────────────────┤
│   Application Security (JWT, CSRF)      │
├─────────────────────────────────────────┤
│   Data Security (Tenant Isolation)      │
├─────────────────────────────────────────┤
│   Infrastructure (Network, IAM)         │
└─────────────────────────────────────────┘
```

**Key Security Measures**:
- ✅ HTTPS-only (TLS 1.3)
- ✅ JWT authentication (RS256)
- ✅ Tenant isolation enforced programmatically
- ✅ Input validation (Jakarta Validation)
- ✅ Rate limiting per tenant
- ✅ OWASP Top 10 compliance
- ✅ Regular security scanning (Trivy)

**Reference**: [System Architecture - Security](./system-architecture.md#security-architecture)

---

## Development Workflow

### Local Development

```bash
# Backend (runs independently)
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Consumer Web (runs with mocked API)
cd consumer-web
npm run dev

# Admin Web
cd admin-web
npm run dev

# Full stack (Docker Compose)
docker-compose up
```

### CI/CD Pipeline

```
Git Push → Lint → Test → Build → Scan → Deploy Staging → E2E Tests → Deploy Production
```

**Reference**: [Deployment - CI/CD Pipeline](./deployment.md#cicd-pipeline)

---

## Monitoring and Observability

### Metrics Collection

```
Application → Prometheus → Grafana Dashboards
         ↓
    CloudWatch
```

### Key Dashboards

1. **Application Dashboard**
   - Request rate, response time, error rate
   - JVM metrics (memory, GC, threads)
   - Database connection pool

2. **Business Dashboard**
   - Orders per hour, revenue
   - Cart abandonment rate
   - Product search queries

3. **Infrastructure Dashboard**
   - Pod CPU/memory utilization
   - Network I/O, disk I/O
   - Node health

**Reference**: [Deployment - Monitoring](./deployment.md#monitoring-and-observability)

---

## Related Documentation

### Product Documentation
- [MVP Requirements](../product/mvp-requirements.md) - Feature specifications
- [User Stories](../product/user-stories.md) - Detailed user stories
- [API Specifications](../product/api-specifications.md) - REST API docs

### Development Guides
- [Backend Development](../development/backend/README.md) - Java/Spring patterns
- [Frontend Development](../development/frontend/README.md) - React/TypeScript patterns
- [Testing Strategy](../development/README.md) - Test approaches

### Deployment Guides
- [Deployment Guide](../deployment/README.md) - Infrastructure setup
- [DevOps Runbooks](../deployment/runbooks/) - Operational procedures

---

## For Architects

When making architectural decisions:

1. **Document the Decision**
   - Update the relevant architecture document
   - Include rationale and alternatives considered
   - Reference related documents

2. **Update Diagrams**
   - Use Mermaid for consistency
   - Keep diagrams in sync with implementation
   - Include both high-level and detailed views

3. **Consider Impact**
   - Multi-tenancy: Does this affect tenant isolation?
   - Scalability: How does this scale?
   - Security: Are there security implications?
   - Performance: What's the performance impact?

4. **Maintain Consistency**
   - Follow established patterns
   - Use standardized technology stack
   - Align with architecture principles

5. **Update Context**
   - Update [CLAUDE.md](../../CLAUDE.md) if needed
   - Update agent definitions for AI assistance
   - Notify the team of significant changes

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2024-11-21 | Architect Agent | Complete architecture documentation |
| 1.0 | 2024-11-21 | Initial | Basic structure |

---

**Maintained By**: Architecture Team
**Last Reviewed**: November 21, 2024
**Next Review**: December 2024
