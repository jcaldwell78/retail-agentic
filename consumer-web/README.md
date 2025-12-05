# Retail Platform - Consumer Web

Multi-tenant retail storefront application for end consumers to browse products, manage shopping carts, and complete purchases.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 5
- **Routing**: React Router 6
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint
- **Styling**: CSS (ready for Tailwind CSS integration)

## Prerequisites

- Node.js 20 or later
- npm 10 or later

## Quick Start

### Install Dependencies

```bash
# From the consumer-web directory
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

Production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run build
npm run preview
```

## Running in Isolation

The consumer web application can run independently of the backend for UI development and testing.

### Standalone Mode (Mock Backend)

By default, the app proxies API calls to `http://localhost:8080`. For isolation testing:

#### Option 1: Mock Service Worker (MSW)

```bash
# Install MSW
npm install -D msw

# Setup mock handlers (future enhancement)
# Create src/mocks/handlers.ts with API mocks
```

#### Option 2: Vite Proxy Configuration

Edit `vite.config.ts` to proxy to a different backend or mock server:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://mock-backend:8080',
        changeOrigin: true,
      },
    },
  },
})
```

#### Option 3: Backend Unavailable (UI Development)

The app gracefully handles backend unavailability:
- Health check failures are displayed with error states
- UI components can be developed and tested independently
- Storybook integration (future enhancement) for isolated component development

## Available Scripts

### `npm run dev`
Starts the development server with hot module replacement (HMR).
- Opens on `http://localhost:3000`
- Auto-reloads on file changes
- Proxies `/api/*` requests to backend

### `npm run build`
Creates an optimized production build.
- Type-checks TypeScript
- Bundles with Vite
- Outputs to `dist/`
- Ready for deployment

### `npm run preview`
Previews the production build locally.
- Serves the `dist/` directory
- Useful for testing production builds

### `npm test`
Runs tests in watch mode.
- Re-runs tests on file changes
- Ideal for TDD workflow

### `npm run test:ui`
Opens Vitest UI for interactive testing.
- Visual test runner
- Detailed test reports
- Filter and search tests

### `npm run test:coverage`
Generates test coverage report.
- Creates coverage/ directory
- HTML report for viewing in browser

### `npm run lint`
Runs ESLint to check code quality.
- Checks TypeScript and React best practices
- Reports unused directives
- Max 0 warnings policy

### `npm run type-check`
Runs TypeScript compiler without emitting files.
- Validates TypeScript types
- Useful for CI/CD pipelines

## Environment Configuration

### Development

Create a `.env.local` file for local overrides:

```bash
# Backend API URL (defaults to proxy if not set)
VITE_API_URL=http://localhost:8080

# Other environment variables
VITE_TENANT_ID=demo-store
```

### Production

Environment variables for production builds:

```bash
# Set before building
export VITE_API_URL=https://api.retail.com
npm run build
```

## Project Structure

```
consumer-web/
├── public/                          # Static assets
│   └── vite.svg                     # Favicon
├── src/
│   ├── assets/                      # Images, fonts, etc.
│   ├── components/                  # React components (future)
│   ├── hooks/                       # Custom React hooks (future)
│   ├── pages/                       # Page components (future)
│   ├── services/                    # API client services (future)
│   ├── styles/                      # Global styles
│   ├── test/
│   │   └── setup.ts                 # Test configuration
│   ├── types/                       # TypeScript type definitions
│   ├── utils/                       # Utility functions
│   ├── App.tsx                      # Root component
│   ├── App.css                      # App styles
│   ├── App.test.tsx                 # App tests
│   ├── main.tsx                     # Application entry point
│   └── vite-env.d.ts                # Vite type definitions
├── .eslintrc.cjs                    # ESLint configuration
├── index.html                       # HTML template
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # TypeScript config for build tools
├── vite.config.ts                   # Vite configuration
├── vitest.config.ts                 # Vitest configuration
├── Dockerfile                       # Docker build instructions
├── nginx.conf                       # Nginx configuration for production
└── README.md                        # This file
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Make Changes

Edit files in `src/`. The browser will auto-reload.

### 3. Write Tests

Create `.test.tsx` files alongside components:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 4. Run Tests

```bash
# Watch mode
npm test

# Single run
npm test -- --run

# With coverage
npm run test:coverage
```

### 5. Type Check

```bash
npm run type-check
```

### 6. Lint Code

```bash
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

## Testing

This application supports multiple types of testing to ensure quality and reliability.

### Unit Tests

Test individual components and functions using Vitest:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- MyComponent.test.tsx

# Open interactive UI
npm run test:ui
```

**Writing Unit Tests:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### End-to-End (E2E) Tests

E2E tests use Playwright to test the entire application from a user's perspective.

#### Prerequisites

Install Playwright browsers (one-time setup):

```bash
npm run playwright:install
```

#### Running E2E Tests

```bash
# Run all E2E tests (against real backend if available)
npm run test:e2e

# Run with mock server (no backend needed) - RECOMMENDED
npm run test:e2e:mock

# Interactive mode with time-travel debugging
npm run test:e2e:ui

# See browser while tests run
npm run test:e2e:headed

# Debug mode with step-through execution
npm run test:e2e:debug
```

#### Test Modes

**Mock Server Mode (Recommended for Development)**

Uses MSW (Mock Service Worker) to simulate backend API responses:

```bash
# Use mock server (recommended)
npm run test:e2e:mock
```

**Note**: The scripts use `cross-env` for cross-platform compatibility (works on Windows, macOS, and Linux).

Benefits:
- No backend required
- Fast execution
- Predictable test data
- Perfect for CI/CD
- Isolated frontend testing

**Real Backend Mode**

Tests against actual running backend:

```bash
# Start backend first
cd ../backend
mvn spring-boot:run

# Then run E2E tests
cd ../consumer-web
npm run test:e2e
```

Benefits:
- Full integration testing
- Validates real API contracts
- Tests with actual data

#### E2E Test Structure

Tests are located in `e2e/` directory:

```
e2e/
├── example.spec.ts        # Main E2E test suite
└── setup.ts               # Test setup and configuration
```

**Writing E2E Tests:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Product Search', () => {
  test('should search and display results', async ({ page }) => {
    await page.goto('/')

    // Search for products
    await page.fill('[data-testid="search-input"]', 'laptop')
    await page.click('[data-testid="search-button"]')

    // Verify results
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Search Results')
  })
})
```

#### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="add-to-cart">Add to Cart</button>
   ```

2. **Mock API responses** in `src/mocks/handlers.ts`:
   ```typescript
   http.get('/api/v1/products', () => {
     return HttpResponse.json([
       { id: '1', name: 'Test Product', price: 99.99 }
     ])
   })
   ```

3. **Test user flows**, not implementation details

4. **Keep tests independent** - each test should work in isolation

### Component Tests

Test React components with user interactions:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShoppingCart from './ShoppingCart'

it('should add item to cart', async () => {
  const user = userEvent.setup()
  render(<ShoppingCart />)

  await user.click(screen.getByTestId('add-to-cart'))
  expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
})
```

### Integration Tests

Test multiple components working together:

```typescript
it('should complete checkout flow', async () => {
  render(<App />)

  // Add to cart
  await user.click(screen.getByTestId('add-to-cart'))

  // Go to checkout
  await user.click(screen.getByTestId('checkout-button'))

  // Complete purchase
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByTestId('place-order'))

  expect(screen.getByText('Order confirmed')).toBeInTheDocument()
})
```

### Test Coverage

Generate and view coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# View in browser (creates coverage/index.html)
open coverage/index.html
```

Target coverage: **80%** for all files

### Continuous Integration

All tests run automatically in CI/CD:

```yaml
- Unit tests (npm test -- --run)
- E2E tests with mock server (npm run test:e2e:mock)
- Type checking (npm run type-check)
- Linting (npm run lint)
```

### Troubleshooting Tests

**E2E Tests Fail with "Target closed"**
- Check browser console for errors
- Verify mock handlers in `src/mocks/handlers.ts`
- Ensure elements have correct `data-testid` attributes

**Tests Timeout**
- Increase timeout in `playwright.config.ts`
- Check if elements are loading correctly
- Verify mock server is responding

**Mock Server Not Working**
- Ensure `USE_MOCK_SERVER=true` is set
- Check that `e2e/setup.ts` is being executed
- Verify handlers are properly configured

For more details, see [E2E_TESTING.md](../E2E_TESTING.md)

## Building for Production

### Local Production Build

```bash
# Build
npm run build

# Test locally
npm run preview
```

### Docker Build

```bash
# Build image
docker build -t consumer-web:latest .

# Run container
docker run -p 3000:80 consumer-web:latest

# Access at http://localhost:3000
```

### Deployment

The production build is a static site that can be deployed to:
- **Nginx/Apache**: Serve the `dist/` directory
- **CDN**: Upload to S3, Cloudflare, etc.
- **Vercel/Netlify**: Connect GitHub repo for auto-deploy
- **Kubernetes**: Use the provided Dockerfile

## API Integration

### Backend Proxy

In development, API calls are proxied automatically:

```typescript
// This goes to http://localhost:8080/api/v1/health
const response = await fetch('/api/v1/health')
```

### Generated API Client

Use OpenAPI Generator to create type-safe clients:

```bash
# Generate from running backend
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-fetch \
  -o src/generated/api

# Use in code
import { DefaultApi } from '@/generated/api'
const api = new DefaultApi()
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- --port 3001
```

### Backend Connection Issues

```bash
# Check if backend is running
curl http://localhost:8080/api/v1/health

# Check proxy configuration in vite.config.ts
```

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Test Failures

```bash
# Clear test cache
npm test -- --clearCache

# Run specific test
npm test -- MyComponent.test.tsx

# Debug mode
npm test -- --inspect-brk
```

### Type Errors

```bash
# Check types
npm run type-check

# Strict mode may catch issues early
# Review tsconfig.json settings
```

## Code Quality

### ESLint Configuration

Rules enforced:
- React hooks rules
- TypeScript best practices
- No unused variables
- Consistent code style

### TypeScript Configuration

Strict mode enabled:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer
```

### Lazy Loading

```typescript
// Code splitting with React.lazy
const ProductPage = lazy(() => import('./pages/ProductPage'))

<Suspense fallback={<Loading />}>
  <ProductPage />
</Suspense>
```

### Image Optimization

- Use WebP format with fallbacks
- Implement lazy loading for images
- Serve responsive images

## Accessibility

### WCAG 2.1 AA Compliance

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader testing
- Color contrast ratios

### Testing Accessibility

```bash
# Install axe-core
npm install -D @axe-core/react

# Use in tests
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<App />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Multi-Tenancy

### Tenant Detection

The app detects tenants from:
- Subdomain: `tenant1.retail.com`
- Path: `retail.com/tenant1`
- Header: `X-Tenant-ID`

### Whitelabel Branding

Customize per tenant:
- Logo
- Colors (CSS custom properties)
- Fonts
- Layout preferences

```css
/* CSS Custom Properties for theming */
:root {
  --brand-primary: #3B82F6;
  --brand-secondary: #10B981;
  --brand-accent: #EC4899;
}
```

## Additional Resources

- [Frontend Development Guide](../docs/development/frontend/README.md)
- [Design System](../docs/design/README.md)
- [Architecture Documentation](../docs/architecture/README.md)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

## Support

For issues or questions:
1. Check existing documentation in `docs/`
2. Review the [Frontend Development Guide](../docs/development/frontend/README.md)
3. Check GitHub Issues
4. Contact the development team

## License

Proprietary - All rights reserved
