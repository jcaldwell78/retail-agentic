import { test, expect } from '@playwright/test';

/**
 * E2E tests for Admin Dashboard
 * Tests can run against mock server or real backend
 */

test.describe('Admin Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display key metrics', async ({ page }) => {
    // Check that metrics are displayed
    await expect(page.locator('[data-testid="metric-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-avg-order"]')).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    // Check that charts are rendered
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status-chart"]')).toBeVisible();
  });

  test('should display top products', async ({ page }) => {
    await expect(page.locator('[data-testid="top-products"]')).toBeVisible();

    // Check that products are listed
    const productItems = page.locator('[data-testid="top-product-item"]');
    expect(await productItems.count()).toBeGreaterThan(0);
  });
});

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to products
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL(/\/products/);
  });

  test('should display products list', async ({ page }) => {
    // Check that products table is displayed
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();

    // Check that products are listed
    const productRows = page.locator('[data-testid="product-row"]');
    expect(await productRows.count()).toBeGreaterThan(0);
  });

  test('should filter products by status', async ({ page }) => {
    // Select active status filter
    await page.selectOption('[data-testid="status-filter"]', 'ACTIVE');

    // Wait for results
    await page.waitForTimeout(500);

    // All visible products should be active
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();

    for (let i = 0; i < count; i++) {
      const status = await productRows.nth(i).locator('[data-testid="product-status"]').textContent();
      expect(status?.trim()).toBe('ACTIVE');
    }
  });

  test('should search products', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="product-search"]', 'Product 1');

    // Wait for results
    await page.waitForTimeout(500);

    // Results should match search term
    const productRows = page.locator('[data-testid="product-row"]');
    const firstProduct = await productRows.first().locator('[data-testid="product-name"]').textContent();
    expect(firstProduct).toContain('Product 1');
  });

  test('should create new product', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-product-button"]');

    // Fill in product form
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.fill('[data-testid="product-sku"]', 'TEST-001');
    await page.fill('[data-testid="product-price"]', '99.99');
    await page.fill('[data-testid="product-stock"]', '100');

    // Submit form
    await page.click('[data-testid="save-product-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should edit existing product', async ({ page }) => {
    // Click edit on first product
    await page.locator('[data-testid="edit-product"]').first().click();

    // Update product name
    await page.fill('[data-testid="product-name"]', 'Updated Product');

    // Save changes
    await page.click('[data-testid="save-product-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should delete product', async ({ page }) => {
    // Get initial product count
    const initialCount = await page.locator('[data-testid="product-row"]').count();

    // Click delete on first product
    await page.locator('[data-testid="delete-product"]').first().click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Wait for deletion
    await page.waitForTimeout(500);

    // Product count should decrease
    const newCount = await page.locator('[data-testid="product-row"]').count();
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to orders
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL(/\/orders/);
  });

  test('should display orders list', async ({ page }) => {
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();

    // Check that orders are listed
    const orderRows = page.locator('[data-testid="order-row"]');
    expect(await orderRows.count()).toBeGreaterThan(0);
  });

  test('should filter orders by status', async ({ page }) => {
    await page.selectOption('[data-testid="order-status-filter"]', 'PENDING');

    // Wait for results
    await page.waitForTimeout(500);

    // All visible orders should be pending
    const orderRows = page.locator('[data-testid="order-row"]');
    const count = await orderRows.count();

    for (let i = 0; i < count; i++) {
      const status = await orderRows.nth(i).locator('[data-testid="order-status"]').textContent();
      expect(status?.trim()).toBe('PENDING');
    }
  });

  test('should view order details', async ({ page }) => {
    // Click on first order
    await page.locator('[data-testid="order-row"]').first().click();

    // Should navigate to order details
    await expect(page).toHaveURL(/\/orders\/\w+/);

    // Should display order information
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-customer"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
  });

  test('should update order status', async ({ page }) => {
    // Click on first order
    await page.locator('[data-testid="order-row"]').first().click();

    // Change status
    await page.selectOption('[data-testid="order-status-select"]', 'PROCESSING');

    // Save changes
    await page.click('[data-testid="update-status-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Dashboard should be visible
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Sidebar should be collapsible on tablet
    await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
  });
});
