# End-to-End Testing with Playwright

This document describes how to run E2E tests for the consumer-web and admin-web applications using Playwright.

## Overview

Both frontend applications are configured with Playwright for E2E testing. Tests can run against:
- **Mock Server**: Uses MSW (Mock Service Worker) to simulate backend API
- **Real Backend**: Tests against an actual running backend server

## Setup

### Install Playwright Browsers

Before running E2E tests for the first time, install the Playwright browsers:

```bash
# For consumer-web
cd consumer-web
npm run playwright:install

# For admin-web
cd admin-web
npm run playwright:install
```

## Running Tests

### Consumer Web

```bash
cd consumer-web

# Run all E2E tests (default: against real backend if available)
npm run test:e2e

# Run E2E tests with mock server (no backend needed)
npm run test:e2e:mock

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests (step through execution)
npm run test:e2e:debug
```

### Admin Web

```bash
cd admin-web

# Run all E2E tests
npm run test:e2e

# Run E2E tests with mock server
npm run test:e2e:mock

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

## Test Modes

### Mock Server Mode

**When to use**:
- Running tests locally without backend
- CI/CD pipelines
- Fast feedback during development
- Testing frontend in isolation

**How it works**:
- MSW intercepts all API requests
- Returns mock data based on handlers in `src/mocks/handlers.ts`
- No external dependencies required

**Example**:
```bash
npm run test:e2e:mock
```

**Note**: The scripts use `cross-env` for cross-platform compatibility, so they work on Windows, macOS, and Linux.

### Real Backend Mode

**When to use**:
- Integration testing
- Validating against actual backend
- Testing with real data

**Prerequisites**:
- Backend must be running on `http://localhost:8080`
- Database must be seeded with test data

**Example**:
```bash
# Start backend first
cd backend
mvn spring-boot:run

# Then run tests
cd consumer-web
npm run test:e2e
```

## Test Structure

### Consumer Web Tests (`consumer-web/e2e/`)

- `example.spec.ts`: Comprehensive E2E tests covering:
  - Home page and product display
  - Product detail pages
  - Shopping cart functionality
  - Search functionality
  - Responsive design

### Admin Web Tests (`admin-web/e2e/`)

- `admin.spec.ts`: Admin dashboard E2E tests covering:
  - Authentication (login/logout)
  - Dashboard overview and metrics
  - Product management (CRUD operations)
  - Order management
  - Responsive design

## Mock Server Configuration

### Adding Mock Data

Edit the mock handlers to customize test data:

**Consumer Web**: `consumer-web/src/mocks/handlers.ts`
**Admin Web**: `admin-web/src/mocks/handlers.ts`

Example:
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/products', () => {
    return HttpResponse.json([
      { id: '1', name: 'Test Product', price: 99.99 },
      // Add more mock products...
    ]);
  }),
];
```

### Adding New Endpoints

```typescript
// In src/mocks/handlers.ts
export const handlers = [
  // ... existing handlers

  http.post('/api/v1/custom-endpoint', async ({ request }) => {
    const body = await request.json();
    // Process request and return mock response
    return HttpResponse.json({ success: true });
  }),
];
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Interact with page
    await page.click('[data-testid="button"]');

    // Assert results
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```typescript
   <button data-testid="add-to-cart-button">Add to Cart</button>
   ```

2. **Wait for elements** before interacting:
   ```typescript
   await page.waitForSelector('[data-testid="product-card"]');
   ```

3. **Test user flows**, not implementation details

4. **Keep tests independent** - each test should work in isolation

5. **Use descriptive test names**:
   ```typescript
   test('should add product to cart and update cart badge', async ({ page }) => {
     // ...
   });
   ```

## Configuration

### Playwright Config

**Consumer Web**: `consumer-web/playwright.config.ts`
**Admin Web**: `admin-web/playwright.config.ts`

Key configurations:
- `testDir`: Location of test files (`./e2e`)
- `baseURL`: Base URL for tests
- `projects`: Browser configurations (Chrome by default, others available)
- `webServer`: Auto-start dev server before tests

**Default Browser**: Chrome (chromium)

**Enable Additional Browsers**: Uncomment the browser configurations in `playwright.config.ts`:
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  // Uncomment to test on Firefox
  // {
  //   name: 'firefox',
  //   use: { ...devices['Desktop Firefox'] },
  // },
  // Uncomment to test on Safari
  // {
  //   name: 'webkit',
  //   use: { ...devices['Desktop Safari'] },
  // },
],
```

Or run specific browsers via command line:
```bash
# Run on specific browser
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on all browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Environment Variables

- `USE_MOCK_SERVER=true`: Enable mock server mode
- `BASE_URL`: Override base URL for tests
- `CI=true`: CI mode (affects retries and parallelization)

## Debugging Tests

### Using Playwright Inspector

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect DOM
- View network requests
- Debug selectors

### Using Headed Mode

```bash
npm run test:e2e:headed
```

See the browser while tests run.

### Using UI Mode

```bash
npm run test:e2e:ui
```

Interactive mode with:
- Visual test runner
- Time travel through test execution
- Network and console logs
- Screenshots and videos

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd consumer-web
          npm ci
          npm run playwright:install

      - name: Run E2E tests with mock server
        run: |
          cd consumer-web
          npm run test:e2e:mock

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: consumer-web/playwright-report/
```

## Troubleshooting

### Tests Fail with "Target closed"

**Cause**: App crashes or navigation issues

**Solution**: Check browser console logs, ensure mock handlers are correct

### Tests Timeout

**Cause**: Elements not loading, slow operations

**Solution**:
- Increase timeout in config
- Check if element selectors are correct
- Verify mock server is responding

### Mock Server Not Working

**Cause**: MSW not initialized

**Solution**: Verify `e2e/setup.ts` is being executed

### Port Already in Use

**Cause**: Dev server still running

**Solution**: Kill existing dev server or change port in config

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
