# Guides and How-Tos

This directory contains practical guides for common tasks and workflows.

## Contents

- [Getting Started](./getting-started.md) - Quick start guide for new developers
- [Contributing](./contributing.md) - How to contribute to the project

## Available Guides

### For New Team Members

- **Getting Started** - Set up your development environment and run the platform locally
- **Project Overview** - Understand the system architecture and tech stack
- **Development Workflow** - Learn the branching strategy and PR process

### For Developers

- **Backend Development** - Write reactive Java services
- **Frontend Development** - Build React components with TypeScript
- **Testing Guide** - Write unit, integration, and E2E tests
- **Multi-Tenancy** - Implement tenant-aware features
- **Whitelabel Branding** - Add customizable UI elements

### For DevOps

- **Local Kubernetes Setup** - Run the stack in minikube or kind
- **Helm Chart Development** - Create and update Helm charts
- **CI/CD Configuration** - Modify GitHub Actions workflows
- **Monitoring Setup** - Configure Prometheus and Grafana

### For Designers

- **Design System** - Use and extend the design system
- **Component Library** - shadcn/ui component usage
- **Whitelabel Guidelines** - Design for multiple brands
- **Accessibility** - Ensure WCAG 2.1 AA compliance

## Quick Links

### Documentation
- [Architecture Overview](../architecture/README.md)
- [Design System](../design/README.md)
- [Development Guide](../development/README.md)
- [Deployment Guide](../deployment/README.md)

### Tools and Resources
- [CLAUDE.md](../../CLAUDE.md) - AI agent context
- [Agent Descriptors](../../.claude/agents/README.md) - AI agent roles
- [GitHub Repository](#) - Source code
- [CI/CD Dashboard](#) - Build and deployment status

### External Resources
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Project Reactor Documentation](https://projectreactor.io/docs/core/release/reference/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)

## Common Tasks

### Start Local Development

```bash
# Start infrastructure
docker-compose up -d

# Start backend
cd backend && mvn spring-boot:run

# Start consumer web
cd consumer-web && npm run dev

# Start admin web
cd admin-web && npm run dev
```

### Run Tests

```bash
# Backend tests
cd backend && mvn test

# Frontend tests
cd consumer-web && npm test

# Integration tests
cd backend && mvn verify -P integration-tests

# E2E tests
npm run test:e2e
```

### Deploy to Local Kubernetes

```bash
# Setup cluster
./scripts/setup-local-k8s.sh

# Deploy services
helmfile -e dev sync

# Check status
kubectl get pods -n retail-platform
```

### Create a New Component

```bash
# Add shadcn/ui component
npx shadcn-ui@latest add button

# Create custom component
# See frontend patterns guide
```

## Getting Help

### Documentation
1. Search this documentation
2. Check agent descriptors in `.claude/agents/`
3. Review CLAUDE.md for project context

### Code Questions
1. Review existing code examples
2. Check test files for usage patterns
3. Ask team members or in team chat

### Bugs and Issues
1. Check if issue already exists
2. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs or screenshots

### Feature Requests
1. Discuss with team first
2. Create proposal with:
   - Problem statement
   - Proposed solution
   - Alternatives considered
   - Implementation impact

## Best Practices

### Code Quality
- Write tests for all new code (80%+ coverage)
- Follow existing code patterns
- Use TypeScript/Java type safety
- Document complex logic

### Git Workflow
- Create feature branches from `develop`
- Write clear commit messages (conventional commits)
- Keep PRs focused and reviewable
- Respond to PR feedback promptly

### Security
- Never commit secrets or credentials
- Use environment variables for config
- Validate all user input
- Follow OWASP guidelines

### Performance
- Profile before optimizing
- Use appropriate data structures
- Cache expensive operations
- Monitor production metrics

## Contributing

See [Contributing Guide](./contributing.md) for detailed information on:
- Code standards and style guides
- PR review process
- Documentation requirements
- Testing requirements
- Release process

## Support and Contact

- **Technical Questions**: Team chat or GitHub discussions
- **Bug Reports**: GitHub issues
- **Security Issues**: Email security@example.com
- **General Inquiries**: team@example.com
