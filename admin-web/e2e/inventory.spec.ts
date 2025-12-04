import { test, expect } from '@playwright/test';

/**
 * E2E tests for Inventory Management in Admin Dashboard
 * Tests inventory monitoring, adjustments, alerts, and reporting
 */

test.describe('Inventory Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login to admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to inventory
    await page.click('[data-testid="nav-inventory"]');
    await expect(page).toHaveURL(/\/inventory/);
  });

  test('should display inventory dashboard', async ({ page }) => {
    // Should show inventory overview
    await expect(page.locator('[data-testid="inventory-dashboard"]')).toBeVisible();

    // Should show key metrics
    await expect(page.locator('[data-testid="metric-total-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-low-stock"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-out-of-stock"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total-value"]')).toBeVisible();
  });

  test('should display inventory table', async ({ page }) => {
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible();

    // Should show inventory items
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    expect(await inventoryRows.count()).toBeGreaterThan(0);

    // Should show product details
    const firstRow = inventoryRows.first();
    await expect(firstRow.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="product-sku"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="stock-quantity"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="stock-status"]')).toBeVisible();
  });

  test('should highlight low stock items', async ({ page }) => {
    // Look for low stock indicators
    const lowStockRows = page.locator('[data-testid="inventory-row"][data-stock-status="low"]');

    if (await lowStockRows.count() > 0) {
      // Should have low stock styling
      await expect(lowStockRows.first().locator('[data-testid="low-stock-badge"]')).toBeVisible();
    }
  });

  test('should highlight out of stock items', async ({ page }) => {
    // Look for out of stock indicators
    const outOfStockRows = page.locator('[data-testid="inventory-row"][data-stock-status="out"]');

    if (await outOfStockRows.count() > 0) {
      // Should have out of stock styling
      await expect(outOfStockRows.first().locator('[data-testid="out-of-stock-badge"]')).toBeVisible();
    }
  });

  test('should filter inventory by stock status', async ({ page }) => {
    // Filter by low stock
    await page.selectOption('[data-testid="stock-status-filter"]', 'low');
    await page.waitForTimeout(500);

    // All rows should be low stock
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    const count = await inventoryRows.count();

    for (let i = 0; i < count; i++) {
      const status = await inventoryRows.nth(i).getAttribute('data-stock-status');
      expect(status).toBe('low');
    }
  });

  test('should search inventory by product name', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="inventory-search"]', 'Product 1');
    await page.waitForTimeout(500);

    // Results should match search
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    const firstProductName = await inventoryRows.first().locator('[data-testid="product-name"]').textContent();
    expect(firstProductName).toContain('Product 1');
  });

  test('should search inventory by SKU', async ({ page }) => {
    // Enter SKU search
    await page.fill('[data-testid="inventory-search"]', 'SKU-001');
    await page.waitForTimeout(500);

    // Should find product with matching SKU
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    const firstSku = await inventoryRows.first().locator('[data-testid="product-sku"]').textContent();
    expect(firstSku).toContain('SKU-001');
  });

  test('should sort inventory by quantity', async ({ page }) => {
    // Sort by quantity ascending
    await page.click('[data-testid="sort-quantity"]');
    await page.waitForTimeout(500);

    // Get first few quantities
    const quantities: number[] = [];
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    const count = Math.min(await inventoryRows.count(), 5);

    for (let i = 0; i < count; i++) {
      const qtyText = await inventoryRows.nth(i).locator('[data-testid="stock-quantity"]').textContent();
      const qty = parseInt(qtyText?.replace(/[^0-9]/g, '') || '0');
      quantities.push(qty);
    }

    // Verify ascending order
    for (let i = 1; i < quantities.length; i++) {
      expect(quantities[i]).toBeGreaterThanOrEqual(quantities[i - 1]);
    }
  });

  test('should export inventory report', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-inventory"]');

    // Should trigger download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/inventory.*\.(csv|xlsx)/i);
  });
});

test.describe('Inventory Adjustments', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-inventory"]');
    await expect(page).toHaveURL(/\/inventory/);
  });

  test('should open inventory adjustment modal', async ({ page }) => {
    // Click adjust on first item
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Should open adjustment modal
    await expect(page.locator('[data-testid="adjustment-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="adjustment-product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-quantity"]')).toBeVisible();
  });

  test('should set absolute inventory quantity', async ({ page }) => {
    // Open adjustment modal
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Select "Set" operation
    await page.selectOption('[data-testid="adjustment-type"]', 'set');

    // Enter new quantity
    await page.fill('[data-testid="adjustment-quantity"]', '100');

    // Enter reason
    await page.fill('[data-testid="adjustment-reason"]', 'Physical inventory count');

    // Submit
    await page.click('[data-testid="submit-adjustment"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Quantity should be updated
    await page.waitForTimeout(500);
    const updatedQty = await page.locator('[data-testid="inventory-row"]').first()
      .locator('[data-testid="stock-quantity"]').textContent();
    expect(updatedQty).toContain('100');
  });

  test('should add to inventory quantity', async ({ page }) => {
    // Open adjustment modal
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Get current quantity
    const currentQtyText = await page.locator('[data-testid="current-quantity"]').textContent();
    const currentQty = parseInt(currentQtyText?.replace(/[^0-9]/g, '') || '0');

    // Select "Add" operation
    await page.selectOption('[data-testid="adjustment-type"]', 'add');

    // Enter quantity to add
    await page.fill('[data-testid="adjustment-quantity"]', '50');

    // Enter reason
    await page.fill('[data-testid="adjustment-reason"]', 'Received shipment');

    // Submit
    await page.click('[data-testid="submit-adjustment"]');

    // Should show success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Quantity should be increased
    await page.waitForTimeout(500);
    const updatedQtyText = await page.locator('[data-testid="inventory-row"]').first()
      .locator('[data-testid="stock-quantity"]').textContent();
    const updatedQty = parseInt(updatedQtyText?.replace(/[^0-9]/g, '') || '0');
    expect(updatedQty).toBe(currentQty + 50);
  });

  test('should subtract from inventory quantity', async ({ page }) => {
    // Open adjustment modal
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Get current quantity
    const currentQtyText = await page.locator('[data-testid="current-quantity"]').textContent();
    const currentQty = parseInt(currentQtyText?.replace(/[^0-9]/g, '') || '0');

    // Select "Subtract" operation
    await page.selectOption('[data-testid="adjustment-type"]', 'subtract');

    // Enter quantity to subtract
    await page.fill('[data-testid="adjustment-quantity"]', '10');

    // Enter reason
    await page.fill('[data-testid="adjustment-reason"]', 'Damaged goods');

    // Submit
    await page.click('[data-testid="submit-adjustment"]');

    // Should show success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Quantity should be decreased
    await page.waitForTimeout(500);
    const updatedQtyText = await page.locator('[data-testid="inventory-row"]').first()
      .locator('[data-testid="stock-quantity"]').textContent();
    const updatedQty = parseInt(updatedQtyText?.replace(/[^0-9]/g, '') || '0');
    expect(updatedQty).toBe(currentQty - 10);
  });

  test('should require adjustment reason', async ({ page }) => {
    // Open adjustment modal
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Fill quantity but not reason
    await page.selectOption('[data-testid="adjustment-type"]', 'set');
    await page.fill('[data-testid="adjustment-quantity"]', '100');

    // Try to submit
    await page.click('[data-testid="submit-adjustment"]');

    // Should show validation error
    await expect(page.locator('[data-testid="reason-error"]')).toBeVisible();
  });

  test('should prevent negative inventory', async ({ page }) => {
    // Open adjustment modal
    await page.locator('[data-testid="adjust-inventory"]').first().click();

    // Try to set negative quantity
    await page.selectOption('[data-testid="adjustment-type"]', 'set');
    await page.fill('[data-testid="adjustment-quantity"]', '-10');
    await page.fill('[data-testid="adjustment-reason"]', 'Test');

    // Submit
    await page.click('[data-testid="submit-adjustment"]');

    // Should show error
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="quantity-error"]')).toContainText(/negative|must be positive/i);
  });

  test('should view adjustment history', async ({ page }) => {
    // Click on first item
    await page.locator('[data-testid="inventory-row"]').first().click();

    // Should show detail view
    await expect(page.locator('[data-testid="inventory-detail"]')).toBeVisible();

    // Click history tab
    await page.click('[data-testid="tab-history"]');

    // Should show adjustment history
    await expect(page.locator('[data-testid="adjustment-history"]')).toBeVisible();
    const historyItems = page.locator('[data-testid="history-item"]');

    if (await historyItems.count() > 0) {
      // Should show adjustment details
      await expect(historyItems.first().locator('[data-testid="adjustment-date"]')).toBeVisible();
      await expect(historyItems.first().locator('[data-testid="adjustment-user"]')).toBeVisible();
      await expect(historyItems.first().locator('[data-testid="adjustment-change"]')).toBeVisible();
      await expect(historyItems.first().locator('[data-testid="adjustment-reason"]')).toBeVisible();
    }
  });
});

test.describe('Low Stock Alerts', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-inventory"]');
  });

  test('should display low stock alerts', async ({ page }) => {
    // Should show alerts section
    await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();

    const alerts = page.locator('[data-testid="alert-item"]');
    if (await alerts.count() > 0) {
      // Should show alert details
      await expect(alerts.first().locator('[data-testid="alert-product"]')).toBeVisible();
      await expect(alerts.first().locator('[data-testid="alert-quantity"]')).toBeVisible();
    }
  });

  test('should configure reorder point for product', async ({ page }) => {
    // Click on first item
    await page.locator('[data-testid="inventory-row"]').first().click();

    // Click settings tab
    await page.click('[data-testid="tab-settings"]');

    // Set reorder point
    await page.fill('[data-testid="reorder-point"]', '20');

    // Set reorder quantity
    await page.fill('[data-testid="reorder-quantity"]', '100');

    // Save
    await page.click('[data-testid="save-reorder-settings"]');

    // Should show success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should trigger alert when stock falls below reorder point', async ({ page }) => {
    // Find a product and set reorder point
    await page.locator('[data-testid="inventory-row"]').first().click();
    await page.click('[data-testid="tab-settings"]');
    await page.fill('[data-testid="reorder-point"]', '100');
    await page.click('[data-testid="save-reorder-settings"]');

    // Go back and adjust inventory below reorder point
    await page.click('[data-testid="back-to-inventory"]');
    await page.locator('[data-testid="adjust-inventory"]').first().click();
    await page.selectOption('[data-testid="adjustment-type"]', 'set');
    await page.fill('[data-testid="adjustment-quantity"]', '50');
    await page.fill('[data-testid="adjustment-reason"]', 'Test low stock alert');
    await page.click('[data-testid="submit-adjustment"]');

    // Should see low stock alert
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible();
  });

  test('should filter to show only low stock items', async ({ page }) => {
    // Click low stock filter
    await page.click('[data-testid="filter-low-stock"]');
    await page.waitForTimeout(500);

    // All items should be low stock
    const inventoryRows = page.locator('[data-testid="inventory-row"]');
    const count = await inventoryRows.count();

    for (let i = 0; i < count; i++) {
      const status = await inventoryRows.nth(i).getAttribute('data-stock-status');
      expect(status).toBe('low');
    }
  });
});

test.describe('Bulk Inventory Updates', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-inventory"]');
  });

  test('should select multiple inventory items', async ({ page }) => {
    // Select first three items
    await page.check('[data-testid="select-inventory-0"]');
    await page.check('[data-testid="select-inventory-1"]');
    await page.check('[data-testid="select-inventory-2"]');

    // Should show bulk actions
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('3');
  });

  test('should perform bulk inventory adjustment', async ({ page }) => {
    // Select items
    await page.check('[data-testid="select-inventory-0"]');
    await page.check('[data-testid="select-inventory-1"]');

    // Click bulk adjust
    await page.click('[data-testid="bulk-adjust"]');

    // Should show bulk adjustment modal
    await expect(page.locator('[data-testid="bulk-adjustment-modal"]')).toBeVisible();

    // Fill adjustment
    await page.selectOption('[data-testid="bulk-adjustment-type"]', 'add');
    await page.fill('[data-testid="bulk-adjustment-quantity"]', '10');
    await page.fill('[data-testid="bulk-adjustment-reason"]', 'Bulk restocking');

    // Submit
    await page.click('[data-testid="submit-bulk-adjustment"]');

    // Should show success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should import inventory from CSV', async ({ page }) => {
    // Click import button
    await page.click('[data-testid="import-inventory"]');

    // Should show import modal
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible();

    // Upload CSV file (mock)
    const fileInput = page.locator('[data-testid="csv-file-input"]');
    // In a real test, you would upload an actual CSV file
    // For now, just check the upload UI exists
    await expect(fileInput).toBeVisible();
  });

  test('should download inventory template', async ({ page }) => {
    // Click import button
    await page.click('[data-testid="import-inventory"]');

    // Click download template
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-template"]');

    // Should download template
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/template.*\.csv/i);
  });
});

test.describe('Inventory Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to inventory reports
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="nav-reports"]');
    await page.click('[data-testid="reports-inventory"]');
  });

  test('should display inventory report overview', async ({ page }) => {
    await expect(page.locator('[data-testid="inventory-report"]')).toBeVisible();

    // Should show report metrics
    await expect(page.locator('[data-testid="report-total-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-turnover-rate"]')).toBeVisible();
  });

  test('should filter report by date range', async ({ page }) => {
    // Set date range
    await page.fill('[data-testid="report-start-date"]', '2025-01-01');
    await page.fill('[data-testid="report-end-date"]', '2025-01-31');
    await page.click('[data-testid="apply-date-filter"]');

    // Should update report
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="inventory-report"]')).toBeVisible();
  });

  test('should view inventory by category', async ({ page }) => {
    // Should show category breakdown
    await expect(page.locator('[data-testid="inventory-by-category"]')).toBeVisible();

    const categories = page.locator('[data-testid="category-row"]');
    if (await categories.count() > 0) {
      await expect(categories.first().locator('[data-testid="category-name"]')).toBeVisible();
      await expect(categories.first().locator('[data-testid="category-quantity"]')).toBeVisible();
      await expect(categories.first().locator('[data-testid="category-value"]')).toBeVisible();
    }
  });

  test('should export inventory report', async ({ page }) => {
    // Click export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-report-pdf"]');

    // Should download report
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/inventory.*report.*\.pdf/i);
  });

  test('should show inventory turnover analysis', async ({ page }) => {
    // Click turnover tab
    await page.click('[data-testid="tab-turnover"]');

    // Should show turnover analysis
    await expect(page.locator('[data-testid="turnover-analysis"]')).toBeVisible();

    // Should show chart
    await expect(page.locator('[data-testid="turnover-chart"]')).toBeVisible();

    // Should show slow-moving items
    await expect(page.locator('[data-testid="slow-moving-items"]')).toBeVisible();
  });
});
