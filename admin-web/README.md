# Retail Platform - Admin Dashboard

Multi-tenant retail administration dashboard for managing tenants, products, orders, and system configuration.

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
# From the admin-web directory
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3001`.

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

The admin dashboard can run independently of the backend for UI development and testing.

### Standalone Mode (Mock Backend)

By default, the app proxies API calls to `http://localhost:8080`. For isolation testing:

#### Option 1: Mock Service Worker (MSW)

```bash
# Install MSW
npm install -D msw

# Setup mock handlers for admin APIs
# Create src/mocks/handlers.ts with tenant/admin API mocks
```

#### Option 2: Vite Proxy Configuration

Edit `vite.config.ts` to proxy to a different backend or mock server:

```typescript
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://mock-admin-backend:8080',
        changeOrigin: true,
      },
    },
  },
})
```

#### Option 3: Backend Unavailable (UI Development)

The admin dashboard gracefully handles backend unavailability:
- Health check failures are displayed with error states
- Admin UI components can be developed and tested independently
- Storybook integration (future enhancement) for isolated component development

## Available Scripts

### `npm run dev`
Starts the development server with hot module replacement (HMR).
- Opens on `http://localhost:3001`
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

# Admin-specific settings
VITE_ADMIN_ROLE_REQUIRED=true
```

### Production

Environment variables for production builds:

```bash
# Set before building
export VITE_API_URL=https://api.retail.com
export VITE_ADMIN_ROLE_REQUIRED=true
npm run build
```

## Project Structure

```
admin-web/
├── public/                          # Static assets
│   └── vite.svg                     # Favicon
├── src/
│   ├── assets/                      # Images, fonts, etc.
│   ├── components/                  # React components (future)
│   │   ├── tenants/                 # Tenant management components
│   │   ├── products/                # Product management components
│   │   ├── orders/                  # Order management components
│   │   ├── users/                   # User management components
│   │   ├── analytics/               # Analytics dashboards
│   │   └── shared/                  # Shared UI components
│   ├── hooks/                       # Custom React hooks (future)
│   ├── pages/                       # Page components (future)
│   │   ├── Dashboard/               # Main dashboard
│   │   ├── Tenants/                 # Tenant management
│   │   ├── Products/                # Product catalog
│   │   ├── Orders/                  # Order management
│   │   ├── Settings/                # System settings
│   │   └── Reports/                 # Reporting and analytics
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

Admin dashboard will be available at `http://localhost:3001`.

### 2. Make Changes

Edit files in `src/`. The browser will auto-reload.

### 3. Write Tests

Create `.test.tsx` files alongside components:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TenantList from './TenantList'

describe('TenantList', () => {
  it('should display tenant list', () => {
    render(<TenantList />)
    expect(screen.getByText('Tenants')).toBeInTheDocument()
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

## Admin Features (Future)

### Tenant Management
- Create/edit/delete tenants
- Configure tenant settings
- Manage tenant subscriptions
- View tenant usage metrics

### Product Catalog Management
- Bulk product import/export
- Product categorization
- Dynamic attribute management
- Image management
- Inventory tracking

### Order Management
- View all orders across tenants
- Order status management
- Refund processing
- Bulk order operations

### User Management
- Admin user accounts
- Role-based access control (RBAC)
- Permission management
- Audit logs

### Analytics & Reporting
- Sales dashboards
- Tenant performance metrics
- Product analytics
- Custom report builder

### System Configuration
- Global settings
- Email templates
- Payment gateway configuration
- Search engine optimization

## Authentication & Authorization

### Admin Authentication

Admin users must authenticate before accessing the dashboard:

```typescript
// Example authentication check
const isAdmin = useAuth()

if (!isAdmin) {
  return <Navigate to="/login" />
}
```

### Role-Based Access Control

Different admin roles have different permissions:
- **Super Admin**: Full system access
- **Tenant Admin**: Manage specific tenant
- **Support**: View-only access
- **Developer**: API access and debugging

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
npm test -- TenantList.test.tsx

# Open interactive UI
npm run test:ui
```

**Writing Unit Tests:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductForm from './ProductForm'

describe('ProductForm', () => {
  it('should validate required fields', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    render(<ProductForm onSubmit={handleSubmit} />)

    await user.click(screen.getByTestId('save-product-button'))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
```

### End-to-End (E2E) Tests

E2E tests use Playwright to test the entire admin dashboard from a user's perspective.

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
cd ../admin-web
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
├── admin.spec.ts          # Main admin E2E test suite
└── setup.ts               # Test setup and configuration
```

**Test Coverage:**
- Authentication (login/logout)
- Dashboard overview and metrics
- Product management (CRUD operations)
- Order management
- Filtering and search
- Responsive design

**Writing E2E Tests:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'admin@example.com')
    await page.fill('[data-testid="password-input"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.click('[data-testid="nav-products"]')
  })

  test('should create new product', async ({ page }) => {
    await page.click('[data-testid="create-product-button"]')
    await page.fill('[data-testid="product-name"]', 'New Product')
    await page.fill('[data-testid="product-price"]', '99.99')
    await page.click('[data-testid="save-product-button"]')

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})
```

#### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="delete-product">Delete</button>
   ```

2. **Mock API responses** in `src/mocks/handlers.ts`:
   ```typescript
   http.get('/api/v1/admin/products', () => {
     return HttpResponse.json({
       content: [
         { id: '1', name: 'Product 1', status: 'ACTIVE' }
       ],
       totalElements: 1
     })
   })
   ```

3. **Test admin workflows**, not implementation details

4. **Setup authentication** in beforeEach for protected routes

### Component Tests

Test React components with admin workflows:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TenantCreationForm from './TenantCreationForm'

it('should create new tenant', async () => {
  const user = userEvent.setup()
  const handleCreate = vi.fn()
  render(<TenantCreationForm onCreate={handleCreate} />)

  await user.type(screen.getByLabelText('Tenant Name'), 'New Store')
  await user.type(screen.getByLabelText('Domain'), 'newstore.com')
  await user.click(screen.getByText('Create Tenant'))

  expect(handleCreate).toHaveBeenCalledWith({
    name: 'New Store',
    domain: 'newstore.com'
  })
})
```

### Integration Tests

Test admin workflows end-to-end:

```typescript
it('should complete product import', async () => {
  render(<App />)

  // Navigate to products
  await user.click(screen.getByTestId('nav-products'))

  // Upload CSV file
  const file = new File(['name,price\nTest,99.99'], 'products.csv')
  await user.upload(screen.getByTestId('file-upload'), file)
  await user.click(screen.getByTestId('import-button'))

  // Verify products added
  expect(screen.getByText('100 products imported')).toBeInTheDocument()
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

**E2E Tests Fail with Authentication**
- Verify mock auth handlers in `src/mocks/handlers.ts`
- Check that login credentials match mock data
- Ensure session/token handling is correct

**Tests Timeout**
- Increase timeout in `playwright.config.ts`
- Check if data tables are loading correctly
- Verify mock server pagination responses

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
docker build -t admin-web:latest .

# Run container
docker run -p 3001:80 admin-web:latest

# Access at http://localhost:3001
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
// This goes to http://localhost:8080/api/v1/admin/tenants
const response = await fetch('/api/v1/admin/tenants')
```

### Generated API Client

Use OpenAPI Generator to create type-safe clients:

```bash
# Generate from running backend
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8080/v3/api-docs \
  -g typescript-fetch \
  -o src/generated/api

# Use in admin components
import { AdminApi } from '@/generated/api'
const api = new AdminApi()
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use a different port
npm run dev -- --port 3002
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
npm test -- TenantList.test.tsx

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

### Code Splitting

```typescript
// Lazy load admin sections
const TenantManagement = lazy(() => import('./pages/TenantManagement'))
const ProductManagement = lazy(() => import('./pages/ProductManagement'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/tenants" element={<TenantManagement />} />
    <Route path="/products" element={<ProductManagement />} />
  </Routes>
</Suspense>
```

### Data Tables

For large datasets:
- Virtual scrolling (react-window, react-virtual)
- Server-side pagination
- Debounced search
- Optimistic UI updates

## Accessibility

### WCAG 2.1 AA Compliance

- Semantic HTML
- ARIA labels for admin controls
- Keyboard shortcuts for power users
- Screen reader announcements
- High contrast mode

### Testing Accessibility

```bash
# Install axe-core
npm install -D @axe-core/react

# Use in tests
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<AdminDashboard />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Security Considerations

### Admin-Specific Security

- **Authentication**: Required for all admin routes
- **Authorization**: Role-based access control (RBAC)
- **Session Management**: Secure session handling
- **CSRF Protection**: Token-based CSRF prevention
- **Audit Logging**: Log all admin actions
- **Data Masking**: Sensitive data (PII, payment info) properly masked

### Security Headers

Nginx configuration includes:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`

## Monitoring & Logging

### Admin Activity Logging

Log all admin actions for audit trail:
```typescript
logAdminAction({
  action: 'TENANT_CREATED',
  user: currentUser.id,
  details: { tenantId: newTenant.id },
  timestamp: new Date().toISOString()
})
```

### Error Tracking

Integration with error tracking services:
- Sentry
- Rollbar
- Custom error reporting

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
