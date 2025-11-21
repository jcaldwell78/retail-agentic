# Architecture Documentation

This directory contains high-level architectural documentation for the retail platform.

## Contents

### System Overview
- [System Overview](./system-overview.md) - High-level system architecture, components, and data flow

### Core Architectural Patterns
- [Multi-Tenancy Architecture](./multi-tenancy.md) - Tenant isolation, subdomain routing, and whitelabel branding
- [Database Strategy](./database-strategy.md) - Polyglot persistence with MongoDB, Redis, Elasticsearch, and PostgreSQL
- [API Design](./api-design.md) - RESTful API conventions, reactive patterns, and versioning

## Key Architectural Decisions

### Technology Stack

**Backend**
- Java 21 (latest LTS)
- Spring Boot 3.2+ with WebFlux
- Project Reactor for reactive programming
- Maven for build management

**Frontend**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for UI components
- React Router for navigation

**Databases**
- MongoDB 7 - Primary data store for products, orders, tenants
- Redis 7 - Caching and real-time data
- Elasticsearch 8 - Full-text search with dynamic attributes
- PostgreSQL 15 - Financial transactions (ACID compliance)

**Infrastructure**
- Kubernetes for orchestration
- Helm/Helmfile for deployment management
- Docker for containerization
- GitHub Actions for CI/CD

### Architectural Principles

1. **Multi-Tenancy First** - Every design decision considers tenant isolation and whitelabel branding
2. **Reactive All The Way** - Non-blocking I/O from HTTP to database using Project Reactor
3. **Polyglot Persistence** - Use the right database for each use case
4. **API-First Design** - Backend exposes RESTful APIs consumed by multiple frontends
5. **Scalability** - Horizontal scaling via Kubernetes, stateless services
6. **Security** - Tenant isolation, OWASP compliance, secure secrets management
7. **Observability** - Comprehensive logging, metrics, and distributed tracing

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project context for AI agents
- [Development Guide](../development/README.md) - Implementation patterns and practices
- [Deployment Guide](../deployment/README.md) - Infrastructure and deployment processes

## For Architects

When making architectural decisions:
1. Document the decision and rationale in the appropriate file
2. Update architecture diagrams if structure changes
3. Consider impact on multi-tenancy and scalability
4. Ensure consistency with existing patterns
5. Update [CLAUDE.md](../../CLAUDE.md) and agent definitions as needed
