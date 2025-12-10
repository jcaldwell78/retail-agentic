# Deployment Runbook

This runbook provides step-by-step procedures for deploying the Retail Agentic platform to staging and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Overview](#environment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Procedures](#deployment-procedures)
- [Rollback Procedures](#rollback-procedures)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Database Migrations](#database-migrations)
- [Monitoring & Alerts](#monitoring--alerts)

---

## Prerequisites

### Required Tools

- Docker & Docker Compose (v2.0+)
- kubectl (v1.28+)
- Helm (v3.12+)
- AWS CLI (v2.0+) or equivalent cloud CLI
- Node.js (v20+)
- Java JDK (v21+)
- Maven (v3.9+)

### Access Requirements

- [ ] AWS/Cloud provider credentials configured
- [ ] Kubernetes cluster access (kubeconfig)
- [ ] Docker registry access (push permissions)
- [ ] Database connection credentials
- [ ] Secrets manager access (AWS Secrets Manager / HashiCorp Vault)
- [ ] Monitoring dashboard access (Grafana)
- [ ] Alert channels configured (Slack, PagerDuty)

### Environment Variables

Ensure these are configured in your deployment environment:

```bash
# Database
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
ELASTICSEARCH_URL=https://...
POSTGRES_URL=jdbc:postgresql://...

# Authentication
JWT_SECRET=<secure-random-string>
JWT_EXPIRATION=86400000

# External Services
PAYPAL_CLIENT_ID=<paypal-client-id>
PAYPAL_CLIENT_SECRET=<paypal-client-secret>
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USERNAME=<smtp-username>
SMTP_PASSWORD=<smtp-password>

# Feature Flags
ENABLE_RATE_LIMITING=true
ENABLE_CSRF_PROTECTION=true
```

---

## Environment Overview

| Environment | Purpose | URL | Branch |
|-------------|---------|-----|--------|
| Development | Local development | localhost | feature/* |
| Staging | Pre-production testing | staging.example.com | develop |
| Production | Live traffic | *.example.com | main |

### Infrastructure Components

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │   (WAF + CDN)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │     (ALB)       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│  Consumer Web │   │   Admin Web   │   │  Backend API  │
│   (React)     │   │    (React)    │   │ (Spring Boot) │
└───────────────┘   └───────────────┘   └───────┬───────┘
                                                │
                    ┌───────────────────────────┴───────────────────────────┐
                    │                                                       │
            ┌───────▼───────┐   ┌───────────────┐   ┌───────────────────┐
            │   MongoDB     │   │    Redis      │   │  Elasticsearch    │
            │  (Primary)    │   │   (Cache)     │   │    (Search)       │
            └───────────────┘   └───────────────┘   └───────────────────┘
```

---

## Pre-Deployment Checklist

### Before Every Deployment

- [ ] All tests passing in CI/CD pipeline
- [ ] Code review approved and merged
- [ ] No critical security vulnerabilities (OWASP scan passed)
- [ ] Database migrations reviewed (if applicable)
- [ ] Feature flags configured for gradual rollout
- [ ] Monitoring dashboards ready
- [ ] On-call team notified
- [ ] Deployment window confirmed (prefer low-traffic periods)

### Production-Specific Checklist

- [ ] Staging deployment verified
- [ ] Load testing completed (2x expected traffic)
- [ ] Rollback plan documented
- [ ] Customer support team notified
- [ ] Status page prepared (if maintenance expected)

---

## Deployment Procedures

### 1. Build Artifacts

#### Backend

```bash
# Navigate to backend directory
cd backend

# Run tests
mvn clean test

# Build JAR with production profile
mvn clean package -DskipTests -Pprod

# Build Docker image
docker build -t retail-backend:${VERSION} .

# Push to registry
docker tag retail-backend:${VERSION} registry.example.com/retail-backend:${VERSION}
docker push registry.example.com/retail-backend:${VERSION}
```

#### Consumer Web

```bash
# Navigate to consumer-web directory
cd consumer-web

# Install dependencies
npm ci

# Run tests
npm test -- --run

# Build production bundle
npm run build

# Build Docker image
docker build -t retail-consumer-web:${VERSION} .

# Push to registry
docker tag retail-consumer-web:${VERSION} registry.example.com/retail-consumer-web:${VERSION}
docker push registry.example.com/retail-consumer-web:${VERSION}
```

#### Admin Web

```bash
# Navigate to admin-web directory
cd admin-web

# Install dependencies
npm ci

# Run tests
npm test -- --run

# Build production bundle
npm run build

# Build Docker image
docker build -t retail-admin-web:${VERSION} .

# Push to registry
docker tag retail-admin-web:${VERSION} registry.example.com/retail-admin-web:${VERSION}
docker push registry.example.com/retail-admin-web:${VERSION}
```

### 2. Deploy to Staging

#### Option A: Helm Deployment

```bash
# Update Helm values for staging
cd deploy/helm

# Deploy backend
helm upgrade --install retail-backend ./retail-backend \
  --namespace staging \
  --set image.tag=${VERSION} \
  --set environment=staging \
  -f values-staging.yaml

# Deploy consumer-web
helm upgrade --install retail-consumer-web ./retail-consumer-web \
  --namespace staging \
  --set image.tag=${VERSION} \
  -f values-staging.yaml

# Deploy admin-web
helm upgrade --install retail-admin-web ./retail-admin-web \
  --namespace staging \
  --set image.tag=${VERSION} \
  -f values-staging.yaml
```

#### Option B: kubectl Deployment

```bash
# Update image version in manifests
kubectl set image deployment/retail-backend \
  retail-backend=registry.example.com/retail-backend:${VERSION} \
  --namespace staging

kubectl set image deployment/retail-consumer-web \
  retail-consumer-web=registry.example.com/retail-consumer-web:${VERSION} \
  --namespace staging

kubectl set image deployment/retail-admin-web \
  retail-admin-web=registry.example.com/retail-admin-web:${VERSION} \
  --namespace staging
```

### 3. Verify Staging Deployment

```bash
# Check pod status
kubectl get pods -n staging -l app=retail-backend
kubectl get pods -n staging -l app=retail-consumer-web
kubectl get pods -n staging -l app=retail-admin-web

# Check deployment status
kubectl rollout status deployment/retail-backend -n staging
kubectl rollout status deployment/retail-consumer-web -n staging
kubectl rollout status deployment/retail-admin-web -n staging

# Run health checks
curl -f https://staging-api.example.com/api/v1/health
curl -f https://staging.example.com/
curl -f https://admin.staging.example.com/
```

### 4. Deploy to Production

#### Blue-Green Deployment

```bash
# Deploy to green environment
kubectl set image deployment/retail-backend-green \
  retail-backend=registry.example.com/retail-backend:${VERSION} \
  --namespace production

# Wait for green to be ready
kubectl rollout status deployment/retail-backend-green -n production

# Run smoke tests against green
./scripts/smoke-tests.sh green

# Switch traffic to green (update ingress/service selector)
kubectl patch service retail-backend -n production \
  -p '{"spec":{"selector":{"deployment":"green"}}}'

# Verify traffic switch
curl -f https://api.example.com/api/v1/health

# Scale down blue (after verification period)
kubectl scale deployment retail-backend-blue --replicas=0 -n production
```

#### Rolling Deployment

```bash
# Trigger rolling update
kubectl set image deployment/retail-backend \
  retail-backend=registry.example.com/retail-backend:${VERSION} \
  --namespace production

# Monitor rollout
kubectl rollout status deployment/retail-backend -n production --watch

# If issues detected, immediately rollback
kubectl rollout undo deployment/retail-backend -n production
```

### 5. Post-Deployment Verification

```bash
# Health check all services
curl -f https://api.example.com/api/v1/health
curl -f https://www.example.com/
curl -f https://admin.example.com/

# Verify API version
curl https://api.example.com/api/v1/version

# Check logs for errors
kubectl logs -l app=retail-backend -n production --tail=100 | grep -i error

# Monitor metrics dashboard
# Open Grafana: https://grafana.example.com/d/retail-overview
```

---

## Rollback Procedures

### Automatic Rollback (Kubernetes)

```bash
# Rollback to previous revision
kubectl rollout undo deployment/retail-backend -n production

# Rollback to specific revision
kubectl rollout undo deployment/retail-backend --to-revision=5 -n production

# View rollout history
kubectl rollout history deployment/retail-backend -n production
```

### Blue-Green Rollback

```bash
# Switch traffic back to blue
kubectl patch service retail-backend -n production \
  -p '{"spec":{"selector":{"deployment":"blue"}}}'

# Verify rollback
curl -f https://api.example.com/api/v1/health
```

### Database Rollback

```bash
# If database migrations were applied, run rollback script
cd backend
./scripts/db-rollback.sh ${PREVIOUS_VERSION}

# Verify data integrity
./scripts/data-integrity-check.sh
```

### Rollback Triggers

Immediately rollback if:
- Error rate exceeds 5% for 5 minutes
- p95 latency exceeds 500ms for 10 minutes
- Any health check fails for 3 consecutive minutes
- Payment processing failures detected
- Critical security vulnerability discovered

---

## Health Checks

### Endpoints

| Service | Health Endpoint | Expected Response |
|---------|-----------------|-------------------|
| Backend | `/api/v1/health` | `{"status":"UP"}` |
| Backend | `/actuator/health` | `{"status":"UP"}` |
| Consumer Web | `/` | HTTP 200 |
| Admin Web | `/` | HTTP 200 |

### Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

BACKEND_URL=${BACKEND_URL:-https://api.example.com}
CONSUMER_URL=${CONSUMER_URL:-https://www.example.com}
ADMIN_URL=${ADMIN_URL:-https://admin.example.com}

echo "Checking backend health..."
if curl -sf "${BACKEND_URL}/api/v1/health" > /dev/null; then
  echo "✅ Backend: HEALTHY"
else
  echo "❌ Backend: UNHEALTHY"
  exit 1
fi

echo "Checking consumer-web health..."
if curl -sf "${CONSUMER_URL}" > /dev/null; then
  echo "✅ Consumer Web: HEALTHY"
else
  echo "❌ Consumer Web: UNHEALTHY"
  exit 1
fi

echo "Checking admin-web health..."
if curl -sf "${ADMIN_URL}" > /dev/null; then
  echo "✅ Admin Web: HEALTHY"
else
  echo "❌ Admin Web: UNHEALTHY"
  exit 1
fi

echo ""
echo "All services healthy!"
```

### Dependency Health

```bash
# Check MongoDB
kubectl exec -it deploy/retail-backend -n production -- \
  curl -sf localhost:8080/actuator/health/mongo

# Check Redis
kubectl exec -it deploy/retail-backend -n production -- \
  curl -sf localhost:8080/actuator/health/redis

# Check Elasticsearch
kubectl exec -it deploy/retail-backend -n production -- \
  curl -sf localhost:8080/actuator/health/elasticsearch
```

---

## Troubleshooting

### Common Issues

#### 1. Pod CrashLoopBackOff

```bash
# Check pod events
kubectl describe pod <pod-name> -n production

# Check recent logs
kubectl logs <pod-name> -n production --previous

# Common causes:
# - Missing environment variables
# - Database connection failures
# - Out of memory (OOM)
# - Application startup errors
```

#### 2. High Error Rate

```bash
# Check application logs
kubectl logs -l app=retail-backend -n production --tail=500 | grep -i error

# Check recent deployments
kubectl rollout history deployment/retail-backend -n production

# Check resource utilization
kubectl top pods -n production

# If needed, scale up
kubectl scale deployment/retail-backend --replicas=5 -n production
```

#### 3. Database Connection Issues

```bash
# Test MongoDB connection
kubectl exec -it deploy/retail-backend -n production -- \
  mongosh "${MONGODB_URI}" --eval "db.stats()"

# Test Redis connection
kubectl exec -it deploy/retail-backend -n production -- \
  redis-cli -u "${REDIS_URL}" ping

# Check connection pool
kubectl logs -l app=retail-backend -n production | grep -i "connection pool"
```

#### 4. High Latency

```bash
# Check pod resource usage
kubectl top pods -n production

# Check for slow queries (MongoDB)
kubectl exec -it deploy/mongodb -n production -- \
  mongosh --eval "db.currentOp({'secs_running': {\$gte: 5}})"

# Check Redis latency
kubectl exec -it deploy/redis -n production -- \
  redis-cli --latency

# Scale horizontally if needed
kubectl scale deployment/retail-backend --replicas=10 -n production
```

#### 5. SSL/TLS Certificate Issues

```bash
# Check certificate expiration
kubectl get certificates -n production
kubectl describe certificate <cert-name> -n production

# Force certificate renewal (cert-manager)
kubectl delete certificate <cert-name> -n production
# cert-manager will auto-recreate
```

### Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| On-Call Engineer | PagerDuty | Immediate |
| Platform Lead | @platform-lead | 15 minutes |
| Security Team | @security | Immediate (security issues) |
| Database Admin | @dba | 30 minutes |

---

## Database Migrations

### Migration Process

1. **Create migration script**
   ```bash
   cd backend
   ./scripts/create-migration.sh "add-user-preferences-field"
   ```

2. **Test migration locally**
   ```bash
   docker-compose up -d mongodb
   ./scripts/run-migration.sh local
   ```

3. **Test migration on staging**
   ```bash
   ./scripts/run-migration.sh staging
   ./scripts/verify-migration.sh staging
   ```

4. **Run migration on production**
   ```bash
   # During deployment window
   ./scripts/run-migration.sh production
   ./scripts/verify-migration.sh production
   ```

### Migration Best Practices

- Always backup before migrations
- Use incremental, reversible migrations
- Test migrations with production-like data
- Monitor database during migration
- Have rollback scripts ready

### Example Migration Script

```javascript
// migrations/2025-01-15-add-user-preferences.js
module.exports = {
  async up(db) {
    await db.collection('users').updateMany(
      { preferences: { $exists: false } },
      { $set: { preferences: { newsletter: true, notifications: true } } }
    );
  },

  async down(db) {
    await db.collection('users').updateMany(
      {},
      { $unset: { preferences: "" } }
    );
  }
};
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Error Rate | > 1% | > 5% |
| p95 Latency | > 300ms | > 500ms |
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 70% | > 90% |
| Active Connections | > 80% of pool | > 95% of pool |
| Order Completion Rate | < 90% | < 80% |

### Grafana Dashboards

- **Application Overview**: `/d/retail-overview`
- **Infrastructure**: `/d/retail-infrastructure`
- **Business Metrics**: `/d/retail-business`
- **Security Events**: `/d/retail-security`

### Alert Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty + Slack #alerts | < 5 minutes |
| Warning | Slack #alerts | < 30 minutes |
| Info | Slack #monitoring | Next business day |

### Sample Alert Rules

```yaml
# prometheus/alerts.yaml
groups:
  - name: retail-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) / rate(http_server_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_server_requests_duration_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}s"

      - alert: ServiceDown
        expr: up{job="retail-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend service is down"
          description: "Backend has been down for more than 1 minute"
```

---

## Appendix

### Environment Setup Commands

```bash
# Setup kubectl context
aws eks update-kubeconfig --name retail-cluster --region us-east-1

# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Setup Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### Useful Commands

```bash
# View all resources
kubectl get all -n production

# Port forward for local debugging
kubectl port-forward svc/retail-backend 8080:8080 -n production

# Execute shell in pod
kubectl exec -it deploy/retail-backend -n production -- /bin/sh

# Copy logs locally
kubectl logs deploy/retail-backend -n production > backend-logs.txt

# View resource quotas
kubectl describe resourcequota -n production
```

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-15 | Initial deployment runbook |

---

## Support

For deployment support:
- Slack: #platform-support
- Email: platform@example.com
- On-Call: PagerDuty @retail-oncall
