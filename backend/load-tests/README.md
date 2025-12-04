# Load Testing with Apache JMeter

This directory contains JMeter load test plans for the Retail Agentic backend API.

## Prerequisites

1. **Install Apache JMeter**
   - Download from: https://jmeter.apache.org/download_jmeter.cgi
   - Extract and add `bin` directory to PATH
   - Verify: `jmeter --version`

2. **Start Backend Services**
   ```bash
   # From backend directory
   mvn spring-boot:run
   ```

3. **Ensure Test Data Exists**
   - The backend should have test products, orders, and users
   - Run database seed scripts if needed

## Test Plans

### 1. ProductAPI_LoadTest.jmx
Tests Product API endpoints under load.

**Endpoints Tested:**
- `GET /api/v1/products` - List products with pagination
- `GET /api/v1/products/{id}` - Get product by ID
- `GET /api/v1/products/search` - Search products

**Performance Targets:**
- List products: < 200ms (p95)
- Get by ID: < 100ms (p95)
- Search: < 300ms (p95)
- Error rate: < 1%
- Throughput: > 100 req/sec

### 2. OrderAPI_LoadTest.jmx
Tests Order API endpoints under load.

**Endpoints Tested:**
- `GET /api/v1/orders` - List orders with pagination
- `GET /api/v1/orders/{id}` - Get order by ID
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/my-orders` - Get current user's orders
- `PUT /api/v1/orders/{id}/status` - Update order status

**Performance Targets:**
- List orders: < 200ms (p95)
- Get by ID: < 150ms (p95)
- Create order: < 500ms (p95)
- Update status: < 300ms (p95)
- Error rate: < 1%
- Throughput: > 75 req/sec

### 3. AuthAPI_LoadTest.jmx
Tests Authentication endpoints under load.

**Endpoints Tested:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/validate` - Validate JWT token
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

**Performance Targets:**
- Login: < 300ms (p95)
- Token validation: < 100ms (p95)
- Token refresh: < 200ms (p95)
- Registration: < 500ms (p95)
- Error rate: < 1%
- Throughput: > 50 req/sec

### 4. MultiTenant_LoadTest.jmx
Tests multi-tenant isolation under concurrent load from multiple tenants.

**Test Strategy:**
- Simulates 3 concurrent tenants (tenant-1, tenant-2, tenant-3)
- Each tenant has independent thread groups
- Tests ensure no cross-tenant data leakage
- Validates tenant isolation under high concurrency

**Endpoints Tested:**
- `GET /api/v1/products` with different tenant IDs

**Performance Targets:**
- No cross-tenant data in responses (0 violations)
- Response time degradation < 20% under multi-tenant load
- All tenant isolation assertions must pass
- Error rate: < 1%

## Running Load Tests

### GUI Mode (Development)

For test development and debugging:

```bash
jmeter -t ProductAPI_LoadTest.jmx
```

### CLI Mode (Production)

For actual load testing:

```bash
# Basic run with defaults
jmeter -n -t ProductAPI_LoadTest.jmx -l results/product-api-results.jtl -e -o results/product-api-report

# Custom parameters
jmeter -n -t ProductAPI_LoadTest.jmx \
  -JbaseUrl=http://localhost:8080 \
  -JtenantId=tenant-1 \
  -Jusers=100 \
  -JrampUp=30 \
  -Jduration=300 \
  -l results/product-api-results.jtl \
  -e -o results/product-api-report
```

### Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `baseUrl` | Backend API base URL | `http://localhost:8080` |
| `tenantId` | Tenant ID for X-Tenant-ID header | `tenant-1` |
| `users` | Number of concurrent users | `100` |
| `rampUp` | Ramp-up period in seconds | `30` |
| `duration` | Test duration in seconds | `300` (5 min) |

### Running Multiple Test Scenarios

#### Light Load (10 users, 1 min)
```bash
jmeter -n -t ProductAPI_LoadTest.jmx \
  -Jusers=10 -JrampUp=10 -Jduration=60 \
  -l results/light-load.jtl -e -o results/light-load-report
```

#### Medium Load (50 users, 5 min)
```bash
jmeter -n -t ProductAPI_LoadTest.jmx \
  -Jusers=50 -JrampUp=30 -Jduration=300 \
  -l results/medium-load.jtl -e -o results/medium-load-report
```

#### Heavy Load (200 users, 10 min)
```bash
jmeter -n -t ProductAPI_LoadTest.jmx \
  -Jusers=200 -JrampUp=60 -Jduration=600 \
  -l results/heavy-load.jtl -e -o results/heavy-load-report
```

#### Stress Test (500 users, 15 min)
```bash
jmeter -n -t ProductAPI_LoadTest.jmx \
  -Jusers=500 -JrampUp=120 -Jduration=900 \
  -l results/stress-test.jtl -e -o results/stress-test-report
```

## Analyzing Results

### 1. HTML Report

After the test completes, open the HTML report:

```bash
# On Windows
start results/product-api-report/index.html

# On Mac
open results/product-api-report/index.html

# On Linux
xdg-open results/product-api-report/index.html
```

### 2. Key Metrics to Check

**Response Times:**
- Average response time
- p50, p90, p95, p99 percentiles
- Min/Max response times

**Throughput:**
- Requests per second
- Bytes per second

**Error Rate:**
- Error percentage
- Error types and messages

**Resource Utilization (check separately):**
- CPU usage
- Memory usage
- Database connections
- Thread pool utilization

### 3. JTL Results File

The `.jtl` file contains raw test results. View with JMeter GUI:

```bash
jmeter -t ProductAPI_LoadTest.jmx -l results/product-api-results.jtl
```

## Performance Baselines

After establishing baselines, record them here:

| Test Scenario | Users | Duration | Avg Response (ms) | p95 Response (ms) | Throughput (req/s) | Error Rate (%) |
|---------------|-------|----------|-------------------|-------------------|-------------------|----------------|
| Light Load | 10 | 1 min | TBD | TBD | TBD | TBD |
| Medium Load | 50 | 5 min | TBD | TBD | TBD | TBD |
| Heavy Load | 200 | 10 min | TBD | TBD | TBD | TBD |
| Stress Test | 500 | 15 min | TBD | TBD | TBD | TBD |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

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

      - name: Check Performance Thresholds
        run: |
          # Parse JTL file and fail if thresholds exceeded
          # Example: fail if p95 > 200ms or error rate > 1%
          echo "Checking performance thresholds..."
```

## Best Practices

### 1. Test Environment
- Use a staging environment that mirrors production
- Don't run load tests against production
- Ensure consistent test data

### 2. Gradual Load Increase
- Always use ramp-up periods
- Start with light load and increase gradually
- Monitor system resources during tests

### 3. Realistic Scenarios
- Model real user behavior with think times
- Use varied request patterns
- Include authentication and tenant isolation

### 4. Baseline and Monitor
- Establish performance baselines
- Track performance over time
- Set up alerts for regressions

### 5. Distributed Testing
For very high loads, use distributed testing:

```bash
# On master node
jmeter -n -t ProductAPI_LoadTest.jmx \
  -R server1,server2,server3 \
  -l results/distributed-test.jtl
```

## Troubleshooting

### High Error Rates
- Check backend logs for errors
- Verify database connections
- Check rate limiting configuration
- Ensure sufficient resources (CPU, memory)

### Low Throughput
- Check connection pooling settings
- Verify keep-alive is enabled
- Check for blocking operations in reactive code
- Monitor database query performance

### Timeouts
- Increase timeout settings if needed
- Check for slow database queries
- Verify network latency
- Check for thread starvation

### Memory Issues
- Increase JMeter heap size: `JVM_ARGS="-Xms1g -Xmx4g" jmeter ...`
- Reduce result logging detail
- Use CSV output instead of XML

## References

- [Apache JMeter Documentation](https://jmeter.apache.org/usermanual/index.html)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Performance Testing Guidelines](https://www.apache.org/dist/jmeter/docs/usermanual/index.html)

## Contact

For questions or issues with load testing, contact the performance engineering team.
