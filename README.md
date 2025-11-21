# Retail Platform - Multi-Tenant E-Commerce System

A modern, scalable multi-tenant retail platform built with reactive architecture, designed for whitelabel e-commerce solutions.

## Overview

This platform enables multiple retail businesses (tenants) to operate their own branded storefronts from a shared infrastructure. Each tenant gets:

- **Whitelabel Branding** - Custom logos, colors, fonts, and domains
- **Flexible Product Catalogs** - Dynamic attributes per product type (size, color, warranty, etc.)
- **Powerful Search** - Full-text search with faceted filtering on custom attributes
- **Admin Dashboard** - Comprehensive management tools
- **Scalable Infrastructure** - Kubernetes-based with auto-scaling

## Architecture

### Technology Stack

**Backend**
- Java 21 with Spring Boot 3.2+ and WebFlux
- Project Reactor for reactive, non-blocking I/O
- MongoDB, Redis, Elasticsearch, PostgreSQL (polyglot persistence)
- Maven for build management

**Frontend**
- React 18+ with TypeScript
- Tailwind CSS + shadcn/ui component library
- Vite for fast builds
- Two applications: consumer storefront and admin dashboard

**Infrastructure**
- Kubernetes for container orchestration
- Helm + Helmfile for deployment management
- Docker for containerization
- GitHub Actions for CI/CD

### Key Features

#### Multi-Tenancy
- Subdomain-based tenant identification (`store1.retail.com`, `store2.retail.com`)
- Path-based routing alternative (`retail.com/store1`, `retail.com/store2`)
- Custom domain support for enterprise tenants
- Complete tenant data isolation

#### Whitelabel Branding
- Customizable colors, logos, and fonts per tenant
- CSS custom properties for dynamic theming
- Tenant-specific domains with SSL certificates
- Consistent UI across all tenant brands

#### Flexible Product Attributes
- Dynamic attributes based on product type
- Example: Clothing has size/color, Electronics has warranty/model
- All custom attributes are searchable
- Faceted search with dynamic filters

#### Reactive Architecture
- Non-blocking I/O from HTTP to database
- Project Reactor Mono/Flux throughout
- Horizontal scalability
- Efficient resource utilization

## Quick Start

### Prerequisites

- Java 21
- Node.js 20 LTS
- Docker Desktop
- Maven 3.9+
- npm 10+

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd retail-agentic

# Start databases (MongoDB, Redis, Elasticsearch, PostgreSQL)
docker-compose up -d

# Start backend
cd backend
mvn spring-boot:run

# Start consumer web (in new terminal)
cd consumer-web
npm install
npm run dev

# Start admin web (in new terminal)
cd admin-web
npm install
npm run dev
```

**Access:**
- Consumer Web: http://localhost:3000
- Admin Web: http://localhost:3001
- Backend API: http://localhost:8080

### Using Kubernetes Locally

```bash
# Setup local cluster (minikube or kind)
./scripts/setup-local-k8s.sh

# Deploy entire stack
helmfile -e dev sync

# Check status
kubectl get pods -n retail-platform
```

## Project Structure

```
retail-agentic/
├── backend/                 # Java/Spring Boot backend
├── consumer-web/            # Customer-facing React app
├── admin-web/               # Admin dashboard React app
├── helm/                    # Helm charts for deployment
│   ├── charts/              # Service-specific charts
│   ├── environments/        # Environment configs
│   └── helmfile.yaml        # Helmfile configuration
├── scripts/                 # Utility scripts
├── docs/                    # Documentation
│   ├── architecture/        # System design docs
│   ├── design/              # UI/UX design system
│   ├── development/         # Development guides
│   ├── deployment/          # Infrastructure docs
│   └── guides/              # How-to guides
├── .claude/                 # Claude Code AI agent configs
│   └── agents/              # Agent descriptor files
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
├── docker-compose.yml       # Local development stack
├── CLAUDE.md                # AI agent project context
└── README.md                # This file
```

## Documentation

### Core Documentation

- **[Architecture](./docs/architecture/README.md)** - System design, multi-tenancy, database strategy
- **[Design System](./docs/design/README.md)** - UI/UX guidelines, whitelabel theming, components
- **[Development](./docs/development/README.md)** - Backend and frontend development guides
- **[Deployment](./docs/deployment/README.md)** - Kubernetes, Helm, CI/CD pipelines
- **[Guides](./docs/guides/README.md)** - Getting started and how-to guides

### AI Agent Configuration

This project uses AI agents for development. Agent descriptors are in `.claude/agents/`:

- **[ARCHITECT.md](./.claude/agents/ARCHITECT.md)** - System design and architecture decisions
- **[BACKEND_DEVELOPER.md](./.claude/agents/BACKEND_DEVELOPER.md)** - Java/Spring/Reactor implementation
- **[FRONTEND_DEVELOPER.md](./.claude/agents/FRONTEND_DEVELOPER.md)** - React/TypeScript implementation
- **[UI_UX_DESIGNER.md](./.claude/agents/UI_UX_DESIGNER.md)** - Design system and UI specifications
- **[TESTING.md](./.claude/agents/TESTING.md)** - Test strategies and implementation
- **[INTEGRATION.md](./.claude/agents/INTEGRATION.md)** - Component integration and E2E validation
- **[DEVOPS.md](./.claude/agents/DEVOPS.md)** - Infrastructure and deployment
- **[PLANNER.md](./.claude/agents/PLANNER.md)** - Task breakdown and coordination

See [CLAUDE.md](./CLAUDE.md) for AI agent usage and project context.

## Development Workflow

### Feature Development

1. **Plan** - Break down feature into tasks
2. **Design** - Create UI/UX designs (if applicable)
3. **Architect** - Design technical approach
4. **Implement** - Develop backend and frontend
5. **Test** - Write unit, integration, and E2E tests
6. **Review** - Submit PR with automated validation
7. **Deploy** - Merge triggers auto-deployment

### Testing

```bash
# Backend unit tests
cd backend && mvn test

# Frontend unit tests
cd consumer-web && npm test

# Integration tests
cd backend && mvn verify -P integration-tests

# E2E tests
npm run test:e2e

# All tests
./scripts/run-tests.sh
```

### Pull Request Validation

GitHub Actions automatically runs on every PR:
- ✓ Code quality (ESLint, Checkstyle, SpotBugs)
- ✓ Security scanning (OWASP, npm audit)
- ✓ Unit tests (80% coverage minimum)
- ✓ Integration tests
- ✓ E2E tests
- ✓ Build verification

All checks must pass before merging.

## Deployment

### Environments

- **Development** - Local Docker Compose or Kubernetes
- **Staging** - Kubernetes cluster (auto-deploy from `develop` branch)
- **Production** - Kubernetes cluster (auto-deploy from `main` branch)

### Deployment Commands

```bash
# Deploy to staging
helmfile -e staging sync

# Deploy to production
helmfile -e prod sync

# Rollback
helm rollback -n retail-platform retail-backend
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| Spring Boot + WebFlux | Reactive backend framework |
| Project Reactor | Reactive streams (Mono/Flux) |
| MongoDB | Primary document database |
| Redis | Caching and real-time data |
| Elasticsearch | Full-text search |
| PostgreSQL | Financial transactions (ACID) |
| React + TypeScript | Frontend applications |
| Tailwind CSS + shadcn/ui | UI styling and components |
| Kubernetes + Helm | Container orchestration |
| GitHub Actions | CI/CD automation |

## Design Principles

### Multi-Tenancy First
Every feature considers tenant isolation and whitelabel branding from the start.

### Reactive All The Way
Non-blocking I/O from HTTP requests through to database operations.

### Polyglot Persistence
Use the right database for each use case: documents, cache, search, transactions.

### API-First
Backend exposes RESTful APIs consumed by multiple frontend applications.

### Clean and Modern UI
Prioritize user experience with accessible, responsive, and performant interfaces.

### Automated Testing
Comprehensive unit, integration, and E2E tests ensure quality.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/guides/contributing.md) for:

- Code standards and style guides
- Branch and commit conventions
- PR submission and review process
- Testing requirements
- Documentation guidelines

## Security

- All tenant data is isolated by `tenantId`
- Database queries automatically filter by tenant
- OWASP dependency scanning
- Security headers and CORS configuration
- SSL/TLS for all communications

Report security vulnerabilities to: security@example.com

## License

[Add your license here]

## Support

- **Documentation**: Start with [Getting Started](./docs/guides/getting-started.md)
- **Issues**: Submit via [GitHub Issues](https://github.com/your-org/retail-agentic/issues)
- **Questions**: Team chat or GitHub Discussions
- **AI Agents**: See [Agent Descriptors](./.claude/agents/README.md)

## Acknowledgments

Built with modern technologies and best practices for scalable, multi-tenant e-commerce.
