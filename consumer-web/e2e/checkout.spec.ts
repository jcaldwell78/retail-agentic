import { test, expect } from '@playwright/test';

/**
 * E2E tests for checkout flow
 * Tests complete checkout process including guest and authenticated user flows
 */

test.describe('Checkout Flow - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\//);

    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Navigate to cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('should complete full checkout flow successfully', async ({ page }) => {
    // Start checkout
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL(/\/checkout/);

    // Step 1: Shipping Address
    await expect(page.locator('[data-testid="checkout-step-shipping"]')).toBeVisible();
    await page.fill('[data-testid="shipping-first-name"]', 'John');
    await page.fill('[data-testid="shipping-last-name"]', 'Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-phone"]', '555-1234');
    await page.click('[data-testid="continue-to-billing"]');

    // Step 2: Billing Address
    await expect(page.locator('[data-testid="checkout-step-billing"]')).toBeVisible();

    // Use same as shipping
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');

    // Step 3: Shipping Method
    await expect(page.locator('[data-testid="checkout-step-shipping-method"]')).toBeVisible();
    await page.click('[data-testid="shipping-method-standard"]');
    await page.click('[data-testid="continue-to-payment"]');

    // Step 4: Payment
    await expect(page.locator('[data-testid="checkout-step-payment"]')).toBeVisible();
    await page.click('[data-testid="payment-method-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-name"]', 'John Doe');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="continue-to-review"]');

    // Step 5: Review Order
    await expect(page.locator('[data-testid="checkout-step-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-shipping-address"]')).toContainText('123 Main St');
    await expect(page.locator('[data-testid="review-billing-address"]')).toContainText('123 Main St');
    await expect(page.locator('[data-testid="review-shipping-method"]')).toContainText('Standard');
    await expect(page.locator('[data-testid="review-payment-method"]')).toContainText('ending in 1111');
    await expect(page.locator('[data-testid="review-order-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-order-total"]')).toBeVisible();

    // Place order
    await page.click('[data-testid="place-order-button"]');

    // Should navigate to confirmation page
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-confirmation-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-confirmation-message"]')).toContainText('Thank you');
  });

  test('should validate required fields in shipping address', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL(/\/checkout/);

    // Try to continue without filling required fields
    await page.click('[data-testid="continue-to-billing"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="error-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-last-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-city"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-zip"]')).toBeVisible();
  });

  test('should allow navigation between checkout steps', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping
    await page.fill('[data-testid="shipping-first-name"]', 'John');
    await page.fill('[data-testid="shipping-last-name"]', 'Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-phone"]', '555-1234');
    await page.click('[data-testid="continue-to-billing"]');

    // Go to shipping method
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');

    // Go back to billing
    await page.click('[data-testid="back-to-billing"]');
    await expect(page.locator('[data-testid="checkout-step-billing"]')).toBeVisible();

    // Go back to shipping
    await page.click('[data-testid="back-to-shipping"]');
    await expect(page.locator('[data-testid="checkout-step-shipping"]')).toBeVisible();

    // Values should be preserved
    await expect(page.locator('[data-testid="shipping-first-name"]')).toHaveValue('John');
    await expect(page.locator('[data-testid="shipping-last-name"]')).toHaveValue('Doe');
  });

  test('should calculate order total correctly', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');

    // Fill all steps to get to review
    await page.fill('[data-testid="shipping-first-name"]', 'John');
    await page.fill('[data-testid="shipping-last-name"]', 'Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-phone"]', '555-1234');
    await page.click('[data-testid="continue-to-billing"]');
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');
    await page.click('[data-testid="shipping-method-standard"]');
    await page.click('[data-testid="continue-to-payment"]');
    await page.click('[data-testid="payment-method-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-name"]', 'John Doe');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="continue-to-review"]');

    // Verify order total components
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();

    // Get values and verify total
    const subtotalText = await page.locator('[data-testid="subtotal"]').textContent();
    const shippingText = await page.locator('[data-testid="shipping-cost"]').textContent();
    const taxText = await page.locator('[data-testid="tax"]').textContent();
    const totalText = await page.locator('[data-testid="order-total"]').textContent();

    const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');
    const shipping = parseFloat(shippingText?.replace(/[^0-9.]/g, '') || '0');
    const tax = parseFloat(taxText?.replace(/[^0-9.]/g, '') || '0');
    const total = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

    expect(total).toBeCloseTo(subtotal + shipping + tax, 2);
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');

    // Fill all steps
    await page.fill('[data-testid="shipping-first-name"]', 'John');
    await page.fill('[data-testid="shipping-last-name"]', 'Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-phone"]', '555-1234');
    await page.click('[data-testid="continue-to-billing"]');
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');
    await page.click('[data-testid="shipping-method-standard"]');
    await page.click('[data-testid="continue-to-payment"]');

    // Use invalid card number
    await page.click('[data-testid="payment-method-card"]');
    await page.fill('[data-testid="card-number"]', '0000000000000000');
    await page.fill('[data-testid="card-name"]', 'John Doe');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="continue-to-review"]');

    await page.click('[data-testid="place-order-button"]');

    // Should show payment error
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText(/payment.*failed/i);
  });
});

test.describe('Checkout Flow - Guest User', () => {
  test.beforeEach(async ({ page }) => {
    // Start as guest - go to home page
    await page.goto('/');

    // Add product to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Navigate to cart
    await page.locator('[data-testid="cart-button"]').click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('should complete guest checkout successfully', async ({ page }) => {
    // Start checkout
    await page.click('[data-testid="checkout-button"]');

    // Should show guest checkout option
    await expect(page.locator('[data-testid="guest-checkout-option"]')).toBeVisible();

    // Choose guest checkout
    await page.fill('[data-testid="guest-email"]', 'guest@example.com');
    await page.click('[data-testid="continue-as-guest"]');

    // Should proceed to shipping address
    await expect(page.locator('[data-testid="checkout-step-shipping"]')).toBeVisible();

    // Complete checkout flow
    await page.fill('[data-testid="shipping-first-name"]', 'Jane');
    await page.fill('[data-testid="shipping-last-name"]', 'Smith');
    await page.fill('[data-testid="shipping-address"]', '456 Oak Ave');
    await page.fill('[data-testid="shipping-city"]', 'Los Angeles');
    await page.fill('[data-testid="shipping-state"]', 'CA');
    await page.fill('[data-testid="shipping-zip"]', '90001');
    await page.fill('[data-testid="shipping-phone"]', '555-5678');
    await page.click('[data-testid="continue-to-billing"]');
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');
    await page.click('[data-testid="shipping-method-express"]');
    await page.click('[data-testid="continue-to-payment"]');
    await page.click('[data-testid="payment-method-paypal"]');
    await page.click('[data-testid="continue-to-review"]');
    await page.click('[data-testid="place-order-button"]');

    // Should complete order
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-confirmation-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="guest-order-info"]')).toContainText('guest@example.com');
  });

  test('should validate guest email format', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');

    // Enter invalid email
    await page.fill('[data-testid="guest-email"]', 'invalid-email');
    await page.click('[data-testid="continue-as-guest"]');

    // Should show validation error
    await expect(page.locator('[data-testid="guest-email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="guest-email-error"]')).toContainText(/valid email/i);
  });

  test('should offer account creation after guest checkout', async ({ page }) => {
    await page.click('[data-testid="checkout-button"]');
    await page.fill('[data-testid="guest-email"]', 'newuser@example.com');
    await page.click('[data-testid="continue-as-guest"]');

    // Complete checkout
    await page.fill('[data-testid="shipping-first-name"]', 'New');
    await page.fill('[data-testid="shipping-last-name"]', 'User');
    await page.fill('[data-testid="shipping-address"]', '789 Elm St');
    await page.fill('[data-testid="shipping-city"]', 'Chicago');
    await page.fill('[data-testid="shipping-state"]', 'IL');
    await page.fill('[data-testid="shipping-zip"]', '60601');
    await page.fill('[data-testid="shipping-phone"]', '555-9012');
    await page.click('[data-testid="continue-to-billing"]');
    await page.check('[data-testid="same-as-shipping"]');
    await page.click('[data-testid="continue-to-shipping-method"]');
    await page.click('[data-testid="shipping-method-standard"]');
    await page.click('[data-testid="continue-to-payment"]');
    await page.click('[data-testid="payment-method-card"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-name"]', 'New User');
    await page.fill('[data-testid="card-expiry"]', '12/26');
    await page.fill('[data-testid="card-cvv"]', '456');
    await page.click('[data-testid="continue-to-review"]');
    await page.click('[data-testid="place-order-button"]');

    // On confirmation page, should see account creation prompt
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="create-account-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-account-prompt"]')).toContainText(/create an account/i);
  });
});

test.describe('Checkout - Multi-step Navigation', () => {
  test('should show progress indicator', async ({ page }) => {
    // Login and add to cart
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.locator('[data-testid="cart-button"]').click();
    await page.click('[data-testid="checkout-button"]');

    // Check progress indicator
    await expect(page.locator('[data-testid="checkout-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveClass(/active|current/);
    await expect(page.locator('[data-testid="progress-step-2"]')).not.toHaveClass(/active|current/);

    // Move to next step
    await page.fill('[data-testid="shipping-first-name"]', 'John');
    await page.fill('[data-testid="shipping-last-name"]', 'Doe');
    await page.fill('[data-testid="shipping-address"]', '123 Main St');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-phone"]', '555-1234');
    await page.click('[data-testid="continue-to-billing"]');

    // Check progress updated
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveClass(/completed/);
    await expect(page.locator('[data-testid="progress-step-2"]')).toHaveClass(/active|current/);
  });

  test('should prevent skipping steps', async ({ page }) => {
    // Login and add to cart
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();
    await page.locator('[data-testid="cart-button"]').click();
    await page.click('[data-testid="checkout-button"]');

    // Try to directly navigate to review page
    await page.goto('/checkout/review');

    // Should redirect back to first incomplete step
    await expect(page).toHaveURL(/\/checkout\/shipping/);
  });
});
