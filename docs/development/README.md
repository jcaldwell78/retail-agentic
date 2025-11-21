# Development Documentation

This directory contains guides, patterns, and best practices for developing the retail platform.

## Contents

### Backend Development
- [Backend Guide](./backend/README.md) - Java/Spring Boot/Reactor development
- [Backend Setup](./backend/setup.md) - Local environment setup
- [Backend Patterns](./backend/patterns.md) - Code patterns and best practices

### Frontend Development
- [Frontend Guide](./frontend/README.md) - React/TypeScript development
- [Frontend Setup](./frontend/setup.md) - Local environment setup
- [Frontend Patterns](./frontend/patterns.md) - Code patterns and best practices

### Testing
- [Testing Guide](./testing.md) - Unit, integration, and E2E testing strategies

## Quick Start

### Prerequisites

- Java 21 (Temurin distribution recommended)
- Node.js 20 LTS
- Docker Desktop
- Git
- Maven 3.9+
- npm 10+

### Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd retail-agentic

# Start infrastructure (MongoDB, Redis, Elasticsearch, PostgreSQL)
docker-compose up -d

# Backend setup
cd backend
mvn clean install
mvn spring-boot:run

# Frontend setup (consumer-web)
cd consumer-web
npm install
npm run dev

# Frontend setup (admin-web)
cd admin-web
npm install
npm run dev
```

### Access Applications

- **Consumer Web**: http://localhost:3000
- **Admin Web**: http://localhost:3001
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/swagger-ui.html

## Development Workflow

### Feature Development

1. **Planning** - Break down feature into tasks
2. **Architecture** - Design technical approach
3. **Design** - Create UI/UX designs (if needed)
4. **Backend** - Implement API endpoints
5. **Frontend** - Implement UI components
6. **Testing** - Write unit, integration, and E2E tests
7. **Integration** - Verify end-to-end functionality
8. **Review** - Code review and PR validation

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency production fixes

### Commit Messages

Follow conventional commits:

```
feat(products): add search by dynamic attributes
fix(auth): resolve token expiration issue
docs(api): update API versioning guidelines
test(orders): add integration tests for checkout flow
chore(deps): upgrade Spring Boot to 3.2.1
```

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all tests pass locally
4. Push branch and create PR
5. GitHub Actions runs automated checks:
   - Code quality (ESLint, Checkstyle, SpotBugs)
   - Security scanning (OWASP, npm audit)
   - Unit tests (backend and frontend)
   - Integration tests
   - E2E tests
   - Build verification
6. Address PR feedback
7. Merge after approval and passing checks

## Code Quality Standards

### Backend (Java)

- **Code Coverage**: Minimum 80% for new code
- **Static Analysis**: Checkstyle, SpotBugs
- **Code Style**: Google Java Style Guide
- **Testing**: Unit tests with StepVerifier, integration tests with WebTestClient

### Frontend (TypeScript)

- **Code Coverage**: Minimum 80% for new code
- **Linting**: ESLint with TypeScript rules
- **Type Safety**: Strict TypeScript mode enabled
- **Testing**: React Testing Library, Vitest

## Key Technologies

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Programming language |
| Spring Boot | 3.2+ | Application framework |
| Project Reactor | 2023.0+ | Reactive programming |
| MongoDB | 7 | Document database |
| Redis | 7 | Cache and real-time data |
| Elasticsearch | 8 | Search engine |
| PostgreSQL | 15 | Relational database (payments) |
| Maven | 3.9+ | Build tool |

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI library |
| TypeScript | 5.3+ | Type-safe JavaScript |
| Vite | 5+ | Build tool |
| Tailwind CSS | 3+ | Utility CSS framework |
| shadcn/ui | Latest | Component library |
| React Router | 6+ | Client-side routing |
| Vitest | 1+ | Testing framework |
| Playwright | 1+ | E2E testing |

## Best Practices

### General

1. **Keep it simple** - Favor simplicity over complexity
2. **DRY principle** - Don't repeat yourself
3. **SOLID principles** - Object-oriented design
4. **Test-driven** - Write tests first or alongside code
5. **Document as you go** - Update docs with code changes

### Backend-Specific

1. **Reactive all the way** - Use Mono/Flux consistently
2. **Tenant isolation** - Always filter by tenantId
3. **Error handling** - Use proper exception handling
4. **Database indexing** - Compound indexes with tenantId first
5. **API versioning** - Version APIs from the start

### Frontend-Specific

1. **Component composition** - Build small, reusable components
2. **Type safety** - Leverage TypeScript fully
3. **Accessibility** - WCAG 2.1 AA compliance mandatory
4. **Performance** - Lazy load, memoize, virtualize
5. **Tenant context** - Always use TenantProvider

## Troubleshooting

### Common Issues

**Backend won't start**
- Check if MongoDB/Redis/Elasticsearch/PostgreSQL are running
- Verify database connection strings in application.yml
- Check for port conflicts (8080)

**Frontend build fails**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`
- Verify Node version: `node --version` (should be 20+)

**Tests failing**
- Ensure test databases are clean
- Check for port conflicts
- Verify test environment variables

**Docker issues**
- Restart Docker Desktop
- Prune containers: `docker system prune`
- Check logs: `docker-compose logs <service>`

## Related Documentation

- [Architecture Guide](../architecture/README.md) - System design and patterns
- [Deployment Guide](../deployment/README.md) - Infrastructure and deployment
- [Testing Strategy](./.claude/agents/TESTING.md) - Comprehensive testing approach

## Getting Help

- Check existing documentation
- Review agent definitions in `.claude/agents/`
- Consult with team members
- Create issues for bugs or unclear documentation
