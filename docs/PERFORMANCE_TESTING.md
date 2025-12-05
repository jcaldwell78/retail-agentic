# Performance & Load Testing Guide

This document outlines the performance and load testing approach for the Retail Agentic platform.

## Overview

Performance testing ensures the platform meets performance targets under various load conditions. Our testing strategy covers:

1. **Backend Load Testing** - JMeter tests for API endpoints
2. **Frontend Performance Testing** - Lighthouse CI for web performance
3. **Performance Budgets** - Defined thresholds for key metrics
4. **Monitoring & Baselines** - Tracking performance over time

## Performance Goals

### Backend API Performance Targets

| Metric | Target | Measured At |
|--------|--------|-------------|
| Response Time (p50) | < 100ms | All endpoints |
| Response Time (p95) | < 200ms | Read operations |
| Response Time (p95) | < 500ms | Write operations |
| Response Time (p99) | < 1000ms | All endpoints |
| Throughput | > 100 req/sec | Per instance |
| Error Rate | < 1% | Under normal load |
| Error Rate | < 5% | Under peak load |

### Frontend Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint (FCP) | < 2.0s | Desktop |
| Largest Contentful Paint (LCP) | < 3.0s | Desktop |
| Cumulative Layout Shift (CLS) | < 0.1 | No units |
| Total Blocking Time (TBT) | < 300ms | Desktop |
| Speed Index | < 3.5s | Desktop |
| Time to Interactive (TTI) | < 4.0s | Desktop |
| Lighthouse Performance Score | > 90 | Desktop |
| Lighthouse Accessibility Score | > 90 | All |

### Resource Budgets

**Consumer Web:**
- JavaScript: < 400 KB (gzipped)
- CSS: < 100 KB (gzipped)
- Images: < 500 KB (per page)
- Fonts: < 100 KB
- Total Page Weight: < 1.2 MB

**Admin Web:**
- JavaScript: < 500 KB (gzipped)
- CSS: < 100 KB (gzipped)
- Images: < 300 KB (per page)
- Fonts: < 100 KB
- Total Page Weight: < 1.3 MB

## Backend Load Testing with JMeter

### Setup

1. **Install Apache JMeter**
   ```bash
   # Download from https://jmeter.apache.org/download_jmeter.cgi
   # Extract and add bin directory to PATH
   jmeter --version
   ```

2. **Navigate to Load Tests Directory**
   ```bash
   cd backend/load-tests
   ```

3. **Start Backend Services**
   ```bash
   cd ../
   mvn spring-boot:run
   ```

### Test Plans

#### 1. ProductAPI_LoadTest.jmx

Tests Product API under load with multi-tenant support.

**Endpoints:**
- `GET /api/v1/products` - List products (target: < 200ms p95)
- `GET /api/v1/products/{id}` - Get by ID (target: < 100ms p95)
- `GET /api/v1/products/search` - Search (target: < 300ms p95)

**Run Test:**
```bash
./run-load-test.sh --scenario medium --test product
```

Or directly with JMeter:
```bash
jmeter -n -t ProductAPI_LoadTest.jmx \
  -JbaseUrl=http://localhost:8080 \
  -JtenantId=tenant-1 \
  -Jusers=50 \
  -JrampUp=30 \
  -Jduration=300 \
  -l results/product-test.jtl \
  -e -o results/product-report
```

#### 2. OrderAPI_LoadTest.jmx (Coming Soon)

Tests Order creation and retrieval under load.

#### 3. AuthAPI_LoadTest.jmx (Coming Soon)

Tests authentication endpoints including:
- Login
- Token validation
- Rate limiting

#### 4. MultiTenant_LoadTest.jmx (Coming Soon)

Tests tenant isolation under concurrent multi-tenant load.

### Load Test Scenarios

| Scenario | Users | Ramp-Up | Duration | Purpose |
|----------|-------|---------|----------|---------|
| Light | 10 | 10s | 1 min | Smoke test |
| Medium | 50 | 30s | 5 min | Normal load |
| Heavy | 200 | 60s | 10 min | Peak load |
| Stress | 500 | 120s | 15 min | Breaking point |

### Running Load Tests

#### Using Helper Script
```bash
# Light load test
./run-load-test.sh --scenario light

# Heavy load on staging
./run-load-test.sh --scenario heavy --url https://staging.example.com

# Stress test specific API
./run-load-test.sh --scenario stress --test product
```

#### Using JMeter Directly
```bash
# Custom parameters
jmeter -n -t ProductAPI_LoadTest.jmx \
  -JbaseUrl=http://localhost:8080 \
  -JtenantId=tenant-1 \
  -Jusers=100 \
  -JrampUp=30 \
  -Jduration=300 \
  -l results/custom-test.jtl \
  -e -o results/custom-report
```

### Analyzing Load Test Results

1. **HTML Report**: Open `results/{test-name}_report/index.html`
2. **Key Metrics**:
   - Response times (min, avg, max, p50, p90, p95, p99)
   - Throughput (requests/second)
   - Error rate (%)
   - Response time over time graph
   - Transactions per second

3. **Performance Degradation**:
   - Compare results across different load levels
   - Identify breaking points
   - Check resource utilization (CPU, memory, connections)

## Frontend Performance Testing with Lighthouse CI

### Setup

Both consumer-web and admin-web have Lighthouse CI configured.

1. **Install Dependencies**
   ```bash
   cd consumer-web  # or admin-web
   npm install
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

### Running Lighthouse CI

#### Full Audit (Collect + Assert)
```bash
npm run lighthouse
```

This will:
1. Start preview server
2. Run Lighthouse on configured URLs
3. Assert against performance budgets
4. Generate reports

#### Collect Only
```bash
npm run lighthouse:collect
```

#### Assert Only (after collection)
```bash
npm run lighthouse:assert
```

### Lighthouse Configuration

Configuration files:
- `consumer-web/lighthouserc.json`
- `admin-web/lighthouserc.json`

**Pages Tested:**

*Consumer Web:*
- Homepage (`/`)
- Products page (`/products`)
- Cart page (`/cart`)
- Checkout page (`/checkout`)

*Admin Web:*
- Dashboard (`/`)
- Products page (`/products`)
- Orders page (`/orders`)
- Customers page (`/customers`)

### Performance Budgets

Budget configuration files:
- `consumer-web/performance-budgets.json`
- `admin-web/performance-budgets.json`

**Budget Categories:**

1. **Timing Budgets**
   - FCP, LCP, CLS, TBT, Speed Index, TTI

2. **Resource Size Budgets**
   - JavaScript, CSS, Images, Fonts, Total

3. **Resource Count Budgets**
   - Number of scripts, stylesheets, images, fonts

### Interpreting Lighthouse Results

**Performance Score Breakdown:**
- 90-100: Excellent
- 50-89: Needs improvement
- 0-49: Poor

**Key Metrics:**
- **FCP**: When first content appears
- **LCP**: When main content loads
- **CLS**: Visual stability (lower is better)
- **TBT**: Time main thread is blocked
- **TTI**: When page becomes interactive

**Common Issues:**
- Slow FCP → Reduce render-blocking resources
- Slow LCP → Optimize images, lazy load
- High CLS → Reserve space for dynamic content
- High TBT → Reduce JavaScript execution time

## Continuous Integration

### GitHub Actions - Backend Load Tests

Add to `.github/workflows/load-tests.yml`:

```yaml
name: Backend Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install JMeter
        run: |
          wget https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.2.tgz
          tar -xzf apache-jmeter-5.6.2.tgz
          echo "$PWD/apache-jmeter-5.6.2/bin" >> $GITHUB_PATH

      - name: Start Backend
        run: |
          cd backend
          mvn spring-boot:run &
          sleep 30

      - name: Run Load Tests
        run: |
          cd backend/load-tests
          jmeter -n -t ProductAPI_LoadTest.jmx \
            -Jusers=50 -JrampUp=30 -Jduration=180 \
            -l results/load-test.jtl \
            -e -o results/load-test-report

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: backend/load-tests/results/
```

### GitHub Actions - Frontend Performance Tests

Add to `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI

on:
  pull_request:
    paths:
      - 'consumer-web/**'
      - 'admin-web/**'
  workflow_dispatch:

jobs:
  lighthouse-consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd consumer-web
          npm ci

      - name: Build
        run: |
          cd consumer-web
          npm run build

      - name: Run Lighthouse CI
        run: |
          cd consumer-web
          npm run lighthouse

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-consumer-results
          path: consumer-web/.lighthouseci/

  lighthouse-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd admin-web
          npm ci

      - name: Build
        run: |
          cd admin-web
          npm run build

      - name: Run Lighthouse CI
        run: |
          cd admin-web
          npm run lighthouse

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-admin-results
          path: admin-web/.lighthouseci/
```

## Performance Monitoring

### Establishing Baselines

1. **Run Initial Tests**
   ```bash
   # Backend
   ./run-load-test.sh --scenario medium > baseline-backend.txt

   # Frontend
   cd consumer-web && npm run lighthouse > baseline-consumer.txt
   cd admin-web && npm run lighthouse > baseline-admin.txt
   ```

2. **Record Baseline Metrics**
   - Document in performance spreadsheet
   - Commit baseline reports to repository
   - Set up alerts for regressions

3. **Track Over Time**
   - Run tests weekly/monthly
   - Compare against baselines
   - Investigate regressions immediately

### Performance Regression Detection

**Backend:**
- p95 response time increases > 20%
- Throughput decreases > 15%
- Error rate increases > 2%

**Frontend:**
- Lighthouse score drops > 5 points
- LCP increases > 500ms
- JavaScript bundle size > 10% increase

## Performance Optimization Tips

### Backend Optimization

1. **Database Queries**
   - Add indexes for frequently queried fields
   - Use projection to limit returned fields
   - Implement query result caching

2. **Reactive Streams**
   - Avoid blocking operations
   - Use appropriate schedulers
   - Implement backpressure handling

3. **Caching**
   - Cache frequently accessed data (Redis)
   - Use tenant-aware caching
   - Set appropriate TTLs

4. **Connection Pooling**
   - Configure pool sizes appropriately
   - Monitor pool utilization
   - Tune timeouts

### Frontend Optimization

1. **Code Splitting**
   - Route-based code splitting
   - Component lazy loading
   - Vendor chunk separation

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Responsive images
   - Image CDN

3. **Bundle Size**
   - Tree shaking
   - Remove unused dependencies
   - Compress assets

4. **Caching**
   - Service workers
   - Long-term caching for static assets
   - API response caching

## Troubleshooting

### High Backend Response Times

**Check:**
- Database query performance (enable slow query log)
- Connection pool exhaustion
- Blocking operations in reactive code
- External API latency
- CPU/memory utilization

**Tools:**
- Spring Boot Actuator metrics
- Database query profiler
- JVM profiler (YourKit, VisualVM)
- APM tools (New Relic, Datadog)

### Poor Frontend Performance

**Check:**
- Bundle size (use webpack-bundle-analyzer)
- Render-blocking resources
- Image sizes and formats
- Third-party scripts
- Memory leaks

**Tools:**
- Chrome DevTools Performance tab
- Lighthouse
- WebPageTest
- Coverage tool (unused code)

### Load Test Failures

**Check:**
- Backend logs for errors
- Database connection limits
- Rate limiting configuration
- JMeter heap size
- Network latency

## Best Practices

### Load Testing

1. **Realistic Scenarios**
   - Model actual user behavior
   - Include think times
   - Mix read/write operations

2. **Gradual Load Increase**
   - Always use ramp-up periods
   - Start with light load
   - Increase gradually to find limits

3. **Environment Parity**
   - Test in staging environment
   - Match production configuration
   - Use production-like data volume

4. **Monitor System Resources**
   - CPU, memory, disk I/O
   - Database connections
   - Thread pools
   - Network bandwidth

### Performance Testing

1. **Test Early and Often**
   - Performance tests in CI/CD
   - Test before merging
   - Catch regressions early

2. **Set Realistic Budgets**
   - Based on user expectations
   - Consider device/network diversity
   - Allow some tolerance

3. **Prioritize Critical Paths**
   - Focus on user-facing pages
   - Optimize conversion funnels
   - Test most-used features

4. **Track Trends**
   - Regular performance audits
   - Historical data analysis
   - Proactive optimization

## References

- [Apache JMeter Documentation](https://jmeter.apache.org/usermanual/index.html)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
- [Backend Performance Testing README](../backend/load-tests/README.md)

## Contact

For questions about performance testing, contact the performance engineering team or refer to the project documentation.
