import { test, expect } from '@playwright/test';

/**
 * Example E2E tests for consumer storefront
 * These tests can run against mock server or real backend
 */

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded
    await expect(page).toHaveTitle(/Consumer Web/i);
  });

  test('should display products', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Check that at least one product is displayed
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCount(await productCards.count());
    expect(await productCards.count()).toBeGreaterThan(0);
  });
});

test.describe('Product Details', () => {
  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/');

    // Wait for products and click first one
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/products\/\w+/);

    // Should show product details
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });
});

test.describe('Shopping Cart', () => {
  test('should add product to cart', async ({ page }) => {
    await page.goto('/');

    // Add first product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Cart count should increase
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1');

    // Navigate to cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page).toHaveURL(/\/cart/);

    // Should show cart items
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(1);
  });

  test('should update cart item quantity', async ({ page }) => {
    // Add product to cart first
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Go to cart
    await page.locator('[data-testid="cart-button"]').click();

    // Increase quantity
    const increaseButton = page.locator('[data-testid="increase-quantity"]').first();
    await increaseButton.click();

    // Quantity should be 2
    const quantityDisplay = page.locator('[data-testid="item-quantity"]').first();
    await expect(quantityDisplay).toHaveText('2');

    // Cart badge should show 2
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add product to cart first
    await page.goto('/');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Go to cart
    await page.locator('[data-testid="cart-button"]').click();

    // Remove item
    await page.locator('[data-testid="remove-item"]').first().click();

    // Cart should be empty
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();

    // Cart badge should show 0 or not be visible
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).not.toBeVisible();
  });
});

test.describe('Search', () => {
  test('should search for products', async ({ page }) => {
    await page.goto('/');

    // Enter search query
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('headphones');
    await searchInput.press('Enter');

    // Should show search results
    await expect(page).toHaveURL(/\/search\?q=headphones/);

    // Should display matching products
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);

    // Product should match search term
    const firstProductName = await productCards.first().locator('h3').textContent();
    expect(firstProductName?.toLowerCase()).toContain('headphones');
  });

  test('should show no results message for non-existent products', async ({ page }) => {
    await page.goto('/');

    // Search for non-existent product
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistentproduct12345');
    await searchInput.press('Enter');

    // Should show no results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Products should still be visible
    await page.waitForSelector('[data-testid="product-card"]');
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Should show products in grid
    await page.waitForSelector('[data-testid="product-card"]');
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });
});
