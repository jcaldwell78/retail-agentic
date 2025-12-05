import { test, expect } from '@playwright/test';

/**
 * E2E tests for product discovery, listing, filtering, and details
 * Tests product browsing, search, filtering, and product detail pages
 */

test.describe('Product Listing Page', () => {
  test('should display products grid', async ({ page }) => {
    await page.goto('/products');

    // Should show products
    await page.waitForSelector('[data-testid="product-card"]');
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('should display product information on cards', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');
    const firstProduct = page.locator('[data-testid="product-card"]').first();

    // Should show product details
    await expect(firstProduct.locator('[data-testid="product-image"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('should toggle between grid and list view', async ({ page }) => {
    await page.goto('/products');

    // Default should be grid view
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

    // Switch to list view
    await page.click('[data-testid="view-list"]');
    await expect(page.locator('[data-testid="products-list"]')).toBeVisible();

    // Switch back to grid view
    await page.click('[data-testid="view-grid"]');
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
  });

  test('should paginate results', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');

    // Should show pagination
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

    // Get first product name
    const firstProductName = await page.locator('[data-testid="product-card"]').first()
      .locator('[data-testid="product-name"]').textContent();

    // Go to next page
    await page.click('[data-testid="next-page"]');
    await page.waitForTimeout(500);

    // First product should be different
    const newFirstProductName = await page.locator('[data-testid="product-card"]').first()
      .locator('[data-testid="product-name"]').textContent();

    expect(firstProductName).not.toBe(newFirstProductName);
  });

  test('should implement infinite scroll (if enabled)', async ({ page }) => {
    await page.goto('/products?view=infinite');

    await page.waitForSelector('[data-testid="product-card"]');
    const initialCount = await page.locator('[data-testid="product-card"]').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Should load more products
    const newCount = await page.locator('[data-testid="product-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});

test.describe('Product Filtering', () => {
  test('should filter by category', async ({ page }) => {
    await page.goto('/products');

    // Select category filter
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-electronics"]');

    // Wait for results
    await page.waitForTimeout(500);

    // All products should be in electronics category
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const category = await productCards.nth(i).getAttribute('data-category');
      expect(category).toContain('electronics');
    }
  });

  test('should filter by price range', async ({ page }) => {
    await page.goto('/products');

    // Set price range
    await page.fill('[data-testid="price-min"]', '50');
    await page.fill('[data-testid="price-max"]', '200');
    await page.click('[data-testid="apply-price-filter"]');

    // Wait for results
    await page.waitForTimeout(500);

    // Check that products are within price range
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const priceText = await productCards.nth(i).locator('[data-testid="product-price"]').textContent();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
      expect(price).toBeGreaterThanOrEqual(50);
      expect(price).toBeLessThanOrEqual(200);
    }
  });

  test('should filter by brand', async ({ page }) => {
    await page.goto('/products');

    // Select brand filter
    await page.click('[data-testid="filter-brand"]');
    await page.check('[data-testid="brand-apple"]');

    // Wait for results
    await page.waitForTimeout(500);

    // All products should be Apple brand
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const brand = await productCards.nth(i).getAttribute('data-brand');
      expect(brand?.toLowerCase()).toBe('apple');
    }
  });

  test('should filter by rating', async ({ page }) => {
    await page.goto('/products');

    // Select minimum rating
    await page.click('[data-testid="filter-rating"]');
    await page.click('[data-testid="rating-4-and-up"]');

    // Wait for results
    await page.waitForTimeout(500);

    // All products should have rating >= 4
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const ratingText = await productCards.nth(i).locator('[data-testid="product-rating"]').getAttribute('data-rating');
      const rating = parseFloat(ratingText || '0');
      expect(rating).toBeGreaterThanOrEqual(4);
    }
  });

  test('should filter by availability', async ({ page }) => {
    await page.goto('/products');

    // Show only in-stock items
    await page.check('[data-testid="filter-in-stock"]');

    // Wait for results
    await page.waitForTimeout(500);

    // All products should be in stock
    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(productCards.nth(i).locator('[data-testid="out-of-stock"]')).not.toBeVisible();
    }
  });

  test('should apply multiple filters simultaneously', async ({ page }) => {
    await page.goto('/products');

    // Apply category filter
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-electronics"]');

    // Apply price filter
    await page.fill('[data-testid="price-min"]', '100');
    await page.fill('[data-testid="price-max"]', '500');
    await page.click('[data-testid="apply-price-filter"]');

    // Apply brand filter
    await page.click('[data-testid="filter-brand"]');
    await page.check('[data-testid="brand-apple"]');

    // Wait for results
    await page.waitForTimeout(500);

    // Should show filtered results
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);

    // Verify filters are applied
    const firstProduct = productCards.first();
    const category = await firstProduct.getAttribute('data-category');
    const brand = await firstProduct.getAttribute('data-brand');
    const priceText = await firstProduct.locator('[data-testid="product-price"]').textContent();
    const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');

    expect(category).toContain('electronics');
    expect(brand?.toLowerCase()).toBe('apple');
    expect(price).toBeGreaterThanOrEqual(100);
    expect(price).toBeLessThanOrEqual(500);
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/products');

    // Apply some filters
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-electronics"]');
    await page.check('[data-testid="filter-in-stock"]');

    // Wait for filtered results
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('[data-testid="product-card"]').count();

    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    await page.waitForTimeout(500);

    // Should show more products
    const unfilteredCount = await page.locator('[data-testid="product-card"]').count();
    expect(unfilteredCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should show no results message when filters match nothing', async ({ page }) => {
    await page.goto('/products');

    // Apply impossible filters
    await page.fill('[data-testid="price-min"]', '99999');
    await page.fill('[data-testid="price-max"]', '100000');
    await page.click('[data-testid="apply-price-filter"]');

    // Wait for results
    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/no products found/i);
  });
});

test.describe('Product Sorting', () => {
  test('should sort by price: low to high', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');

    // Select sort option
    await page.selectOption('[data-testid="sort-select"]', 'price-asc');
    await page.waitForTimeout(500);

    // Get first few prices
    const prices: number[] = [];
    const productCards = page.locator('[data-testid="product-card"]');
    const count = Math.min(await productCards.count(), 5);

    for (let i = 0; i < count; i++) {
      const priceText = await productCards.nth(i).locator('[data-testid="product-price"]').textContent();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
      prices.push(price);
    }

    // Verify ascending order
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  test('should sort by price: high to low', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');

    // Select sort option
    await page.selectOption('[data-testid="sort-select"]', 'price-desc');
    await page.waitForTimeout(500);

    // Get first few prices
    const prices: number[] = [];
    const productCards = page.locator('[data-testid="product-card"]');
    const count = Math.min(await productCards.count(), 5);

    for (let i = 0; i < count; i++) {
      const priceText = await productCards.nth(i).locator('[data-testid="product-price"]').textContent();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
      prices.push(price);
    }

    // Verify descending order
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  test('should sort by popularity', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');
    await page.selectOption('[data-testid="sort-select"]', 'popularity');
    await page.waitForTimeout(500);

    // Should show products (order determined by backend)
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('should sort by newest', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');
    await page.selectOption('[data-testid="sort-select"]', 'newest');
    await page.waitForTimeout(500);

    // Should show products (order determined by backend)
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  test('should sort by rating', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');
    await page.selectOption('[data-testid="sort-select"]', 'rating');
    await page.waitForTimeout(500);

    // Get first few ratings
    const ratings: number[] = [];
    const productCards = page.locator('[data-testid="product-card"]');
    const count = Math.min(await productCards.count(), 5);

    for (let i = 0; i < count; i++) {
      const ratingText = await productCards.nth(i).locator('[data-testid="product-rating"]').getAttribute('data-rating');
      const rating = parseFloat(ratingText || '0');
      ratings.push(rating);
    }

    // Verify descending order
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
    }
  });
});

test.describe('Product Search', () => {
  test('should search products by name', async ({ page }) => {
    await page.goto('/products');

    // Enter search query
    await page.fill('[data-testid="product-search"]', 'laptop');
    await page.press('[data-testid="product-search"]', 'Enter');

    // Wait for results
    await page.waitForTimeout(500);

    // Should show matching products
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);

    // Products should match search term
    const firstProductName = await productCards.first().locator('[data-testid="product-name"]').textContent();
    expect(firstProductName?.toLowerCase()).toContain('laptop');
  });

  test('should show search suggestions/autocomplete', async ({ page }) => {
    await page.goto('/products');

    // Start typing
    await page.fill('[data-testid="product-search"]', 'headph');

    // Should show autocomplete suggestions
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    const suggestions = page.locator('[data-testid="search-suggestion"]');
    expect(await suggestions.count()).toBeGreaterThan(0);
  });

  test('should navigate to product from autocomplete', async ({ page }) => {
    await page.goto('/products');

    // Type and wait for suggestions
    await page.fill('[data-testid="product-search"]', 'headph');
    await page.waitForSelector('[data-testid="search-suggestions"]');

    // Click first suggestion
    await page.locator('[data-testid="search-suggestion"]').first().click();

    // Should navigate to product page or apply search
    await page.waitForURL(/products|search/);
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/products');

    // Search for non-existent product
    await page.fill('[data-testid="product-search"]', 'xyznonexistent123');
    await page.press('[data-testid="product-search"]', 'Enter');
    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
    await page.goto('/products');

    // Perform search
    await page.fill('[data-testid="product-search"]', 'laptop');
    await page.press('[data-testid="product-search"]', 'Enter');
    await page.waitForTimeout(500);

    const searchResultCount = await page.locator('[data-testid="product-card"]').count();

    // Clear search
    await page.click('[data-testid="clear-search"]');
    await page.waitForTimeout(500);

    // Should show all products
    const allProductsCount = await page.locator('[data-testid="product-card"]').count();
    expect(allProductsCount).toBeGreaterThanOrEqual(searchResultCount);
  });
});

test.describe('Product Detail Page', () => {
  test('should navigate to product detail page from listing', async ({ page }) => {
    await page.goto('/products');

    await page.waitForSelector('[data-testid="product-card"]');

    // Click on first product
    await page.locator('[data-testid="product-card"]').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/products\/[\w-]+/);
  });

  test('should display product information', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Should show all product details
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-sku"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('should display product images gallery', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Should show image gallery
    await expect(page.locator('[data-testid="product-image-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-image"]')).toBeVisible();

    // Should have thumbnails if multiple images
    const thumbnails = page.locator('[data-testid="image-thumbnail"]');
    if (await thumbnails.count() > 1) {
      // Click second thumbnail
      await thumbnails.nth(1).click();

      // Main image should change
      const newMainSrc = await page.locator('[data-testid="main-image"]').getAttribute('src');
      expect(newMainSrc).toBeTruthy();
    }
  });

  test('should zoom product image', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Click zoom button or image
    await page.click('[data-testid="main-image"]');

    // Should show zoomed image or modal
    await expect(page.locator('[data-testid="image-zoom-modal"]')).toBeVisible();
  });

  test('should add product to cart from detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]');

    // Cart count should increase
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');
  });

  test('should select product variant (size/color)', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    // Find a product with variants
    await page.locator('[data-testid="product-card"]').first().click();

    // Check if variants exist
    const sizeVariants = page.locator('[data-testid="variant-size"]');
    if (await sizeVariants.count() > 0) {
      // Select a size
      await sizeVariants.first().click();
      await expect(sizeVariants.first()).toHaveClass(/selected|active/);
    }

    const colorVariants = page.locator('[data-testid="variant-color"]');
    if (await colorVariants.count() > 0) {
      // Select a color
      await colorVariants.first().click();
      await expect(colorVariants.first()).toHaveClass(/selected|active/);
    }
  });

  test('should display product reviews', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Scroll to reviews
    await page.locator('[data-testid="reviews-section"]').scrollIntoViewIfNeeded();

    // Should show reviews
    await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();

    const reviews = page.locator('[data-testid="review-item"]');
    if (await reviews.count() > 0) {
      // Should show review details
      await expect(reviews.first().locator('[data-testid="reviewer-name"]')).toBeVisible();
      await expect(reviews.first().locator('[data-testid="review-rating"]')).toBeVisible();
      await expect(reviews.first().locator('[data-testid="review-text"]')).toBeVisible();
    }
  });

  test('should display related products', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Scroll to related products
    await page.locator('[data-testid="related-products"]').scrollIntoViewIfNeeded();

    // Should show related products
    await expect(page.locator('[data-testid="related-products"]')).toBeVisible();
    const relatedCards = page.locator('[data-testid="related-product-card"]');
    expect(await relatedCards.count()).toBeGreaterThan(0);
  });

  test('should share product', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();

    // Click share button
    await page.click('[data-testid="share-button"]');

    // Should show share options
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
  });
});
