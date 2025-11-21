# Deployment Documentation

This directory contains guides for deploying the retail platform to various environments.

## Contents

- [Local Setup](./local-setup.md) - Setting up local development environment
- [Kubernetes Deployment](./kubernetes.md) - Deploying to Kubernetes with Helm/Helmfile
- [CI/CD Pipeline](./ci-cd.md) - Automated testing and deployment workflows

## Deployment Environments

### Local Development
- **Purpose**: Local development and testing
- **Infrastructure**: Docker Compose or local Kubernetes (minikube/kind)
- **Databases**: Local containers (MongoDB, Redis, Elasticsearch, PostgreSQL)
- **Scale**: Single replica per service
- **Access**: localhost or *.retail.local

### Staging
- **Purpose**: Pre-production testing and QA
- **Infrastructure**: Kubernetes cluster
- **Databases**: Managed services with test data
- **Scale**: 2 replicas per service
- **Access**: *.staging.retail.com
- **Auto-deploy**: On merge to `develop` branch

### Production
- **Purpose**: Live customer traffic
- **Infrastructure**: Kubernetes cluster with auto-scaling
- **Databases**: Managed services with production data
- **Scale**: 3-20 replicas per service (auto-scaled)
- **Access**: *.retail.com and custom tenant domains
- **Auto-deploy**: On merge to `main` branch (after staging validation)

## Deployment Tools

### Kubernetes + Helm + Helmfile

The platform uses Kubernetes for orchestration with Helm charts for packaging and Helmfile for managing multiple releases across environments.

**Why Kubernetes?**
- Container orchestration and auto-scaling
- Self-healing and rolling updates
- Service discovery and load balancing
- Secret management
- Resource limits and health checks

**Why Helm?**
- Package management for Kubernetes
- Templating for environment-specific configs
- Version management and rollback
- Dependency management

**Why Helmfile?**
- Declarative management of multiple Helm releases
- Environment-based configuration
- Deploy entire stack with one command
- Dependency ordering between services

### Directory Structure

```
helm/
├── charts/
│   ├── retail-backend/        # Backend Helm chart
│   ├── consumer-web/          # Consumer web Helm chart
│   ├── admin-web/             # Admin web Helm chart
│   └── infrastructure/        # Database charts
├── environments/
│   ├── dev.yaml              # Development overrides
│   ├── staging.yaml          # Staging overrides
│   └── prod.yaml             # Production overrides
└── helmfile.yaml             # Main Helmfile configuration
```

## Quick Start

### Deploy to Local Kubernetes

```bash
# Start local cluster (minikube or kind)
./scripts/setup-local-k8s.sh

# Build images
docker build -t registry.example.com/retail-backend:dev ./backend
docker build -t registry.example.com/retail-consumer-web:dev ./consumer-web
docker build -t registry.example.com/retail-admin-web:dev ./admin-web

# Deploy with Helmfile
export MONGODB_ROOT_PASSWORD=devpassword
export REDIS_PASSWORD=devpassword
export POSTGRES_PASSWORD=devpassword
helmfile -e dev sync

# Check status
kubectl get pods -n retail-platform
```

### Deploy to Staging/Production

```bash
# Set environment secrets (use secure secret management)
export MONGODB_ROOT_PASSWORD=$(cat /secure/mongodb-password)
export REDIS_PASSWORD=$(cat /secure/redis-password)
export POSTGRES_PASSWORD=$(cat /secure/postgres-password)

# Set image tags from CI/CD
export BACKEND_IMAGE_TAG=${GIT_SHA}
export FRONTEND_IMAGE_TAG=${GIT_SHA}
export ADMIN_IMAGE_TAG=${GIT_SHA}

# Deploy to staging
helmfile -e staging sync

# Deploy to production (after validation)
helmfile -e prod sync
```

## CI/CD Pipeline

### GitHub Actions Workflows

The platform uses GitHub Actions for automated testing and deployment:

1. **PR Validation** (`.github/workflows/pr-validation.yml`)
   - Code quality checks (ESLint, Checkstyle, SpotBugs)
   - Security scanning (OWASP, npm audit)
   - Unit tests (backend and frontend)
   - Integration tests
   - End-to-end tests
   - Build verification
   - Coverage reporting

2. **Main Branch CI/CD** (`.github/workflows/ci.yml`)
   - Run all tests
   - Build Docker images
   - Push to container registry
   - Deploy to staging
   - Run smoke tests
   - Deploy to production (manual approval)

3. **Deployment Workflow** (`.github/workflows/deploy.yml`)
   - Configure kubectl
   - Install Helm and Helmfile
   - Deploy with environment-specific configs
   - Wait for rollout completion
   - Run post-deployment validation

### Deployment Process

```
Code Push
    ↓
GitHub Actions Triggered
    ↓
Run Tests (Unit, Integration, E2E)
    ↓
Build Docker Images
    ↓
Push to Registry
    ↓
Deploy to Staging
    ↓
Smoke Tests
    ↓
Manual Approval (Production only)
    ↓
Deploy to Production
    ↓
Monitor Rollout
    ↓
Post-Deployment Validation
```

## Infrastructure as Code

### Kubernetes Resources

Each service deploys:
- **Deployment** - Pod specification and replica count
- **Service** - Internal load balancing
- **Ingress** - External routing with TLS
- **HorizontalPodAutoscaler** - Auto-scaling based on CPU/memory
- **ConfigMap** - Non-sensitive configuration
- **Secret** - Sensitive configuration (passwords, tokens)

### Resource Limits

| Service | Requests (CPU/Memory) | Limits (CPU/Memory) | Replicas (Min/Max) |
|---------|----------------------|---------------------|-------------------|
| Backend | 500m / 512Mi | 1000m / 1Gi | 3-20 |
| Consumer Web | 100m / 128Mi | 200m / 256Mi | 2-8 |
| Admin Web | 100m / 128Mi | 200m / 256Mi | 2-6 |
| MongoDB | 1000m / 2Gi | 2000m / 4Gi | 3 (StatefulSet) |
| Redis | 250m / 256Mi | 500m / 512Mi | 3 (Master + 2 Replicas) |
| Elasticsearch | 1000m / 2Gi | 2000m / 4Gi | 3 |
| PostgreSQL | 500m / 1Gi | 1000m / 2Gi | 1 (Primary) |

### Health Checks

**Liveness Probe** - Is the service alive?
- Kubernetes restarts pod if probe fails
- Example: `GET /actuator/health/liveness`

**Readiness Probe** - Is the service ready for traffic?
- Kubernetes removes pod from load balancer if probe fails
- Example: `GET /actuator/health/readiness`

## Secrets Management

### Development
- Plain environment variables in `.env` file
- Local secrets in `.env.local` (git-ignored)

### Staging/Production
- Kubernetes Secrets
- External secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Secrets injected as environment variables or mounted files

```bash
# Create Kubernetes secret
kubectl create secret generic retail-backend-secrets \
  --from-literal=mongodb-uri="mongodb://..." \
  --from-literal=redis-password="..." \
  -n retail-platform
```

## Monitoring and Observability

### Logging
- Centralized logging with ELK stack (Elasticsearch, Logstash, Kibana)
- Structured JSON logs
- Log aggregation by tenant, service, trace ID

### Metrics
- Prometheus for metrics collection
- Grafana for visualization
- Per-tenant metrics
- Application metrics (request rate, latency, errors)
- Infrastructure metrics (CPU, memory, disk, network)

### Tracing
- Distributed tracing with OpenTelemetry
- Trace requests across services
- Identify performance bottlenecks

### Alerting
- Alert on critical errors
- Alert on performance degradation
- Alert on infrastructure issues
- PagerDuty/Slack integration

## Rollback Strategy

### Helm Rollback

```bash
# List release history
helm list -n retail-platform

# Rollback to previous version
helm rollback retail-backend -n retail-platform

# Rollback to specific revision
helm rollback retail-backend 5 -n retail-platform
```

### Helmfile Rollback

```bash
# Rollback all services
helmfile -e prod apply --state-values-file .helmfile.d/prev-state.yaml
```

### Database Rollback

- Database migrations are versioned
- Downgrade scripts for each migration
- Test rollback in staging first

## Disaster Recovery

### Backup Strategy

**MongoDB** - Daily full backups, continuous oplog
**Redis** - RDB snapshots every 5 minutes, AOF persistence
**PostgreSQL** - Continuous archiving with point-in-time recovery
**Elasticsearch** - Daily snapshots to S3

### Recovery Procedures

1. Restore databases from latest backup
2. Deploy last known good version of services
3. Verify data integrity
4. Resume traffic

## Related Documentation

- [Local Setup Guide](./local-setup.md) - Detailed local environment setup
- [Kubernetes Guide](./kubernetes.md) - Kubernetes and Helm configuration
- [CI/CD Guide](./ci-cd.md) - Pipeline configuration and workflows
- [DevOps Agent](../../.claude/agents/DEVOPS.md) - Infrastructure and deployment patterns
