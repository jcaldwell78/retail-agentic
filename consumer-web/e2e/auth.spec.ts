import { test, expect } from '@playwright/test';

/**
 * E2E tests for authentication flows
 * Tests login, registration, password reset, and OAuth flows
 */

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="register-first-name"]', 'John');
    await page.fill('[data-testid="register-last-name"]', 'Doe');
    await page.fill('[data-testid="register-email"]', 'newuser@example.com');
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePass123!');
    await page.check('[data-testid="terms-checkbox"]');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should redirect to home page or dashboard
    await expect(page).toHaveURL(/\//);

    // Should show welcome message
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(/welcome/i);
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[data-testid="register-email"]', 'invalid-email');
    await page.blur('[data-testid="register-email"]');

    // Should show validation error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/valid email/i);
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register');

    // Weak password
    await page.fill('[data-testid="register-password"]', 'weak');
    await page.blur('[data-testid="register-password"]');

    // Should show password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak|too short/i);
  });

  test('should validate password confirmation matches', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'DifferentPass123!');
    await page.blur('[data-testid="register-confirm-password"]');

    // Should show error
    await expect(page.locator('[data-testid="confirm-password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(/match/i);
  });

  test('should require terms and conditions acceptance', async ({ page }) => {
    await page.goto('/register');

    // Fill form without checking terms
    await page.fill('[data-testid="register-first-name"]', 'John');
    await page.fill('[data-testid="register-last-name"]', 'Doe');
    await page.fill('[data-testid="register-email"]', 'test@example.com');
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePass123!');

    // Try to submit
    await page.click('[data-testid="register-button"]');

    // Should show error
    await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="terms-error"]')).toContainText(/terms/i);
  });

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/register');

    // Use existing email
    await page.fill('[data-testid="register-first-name"]', 'John');
    await page.fill('[data-testid="register-last-name"]', 'Doe');
    await page.fill('[data-testid="register-email"]', 'existing@example.com');
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-confirm-password"]', 'SecurePass123!');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');

    // Should show error
    await expect(page.locator('[data-testid="registration-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="registration-error"]')).toContainText(/already exists|taken/i);
  });

  test('should allow navigation to login page', async ({ page }) => {
    await page.goto('/register');

    // Click login link
    await page.click('[data-testid="login-link"]');

    // Should navigate to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('User Login', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should redirect to home page
    await expect(page).toHaveURL(/\//);

    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid|incorrect/i);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without filling fields
    await page.click('[data-testid="login-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should remember me functionality', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.check('[data-testid="remember-me"]');
    await page.click('[data-testid="login-button"]');

    // Should redirect successfully
    await expect(page).toHaveURL(/\//);

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should allow navigation to registration page', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="register-link"]');

    // Should navigate to registration
    await expect(page).toHaveURL(/\/register/);
  });

  test('should allow navigation to forgot password', async ({ page }) => {
    await page.goto('/login');

    await page.click('[data-testid="forgot-password-link"]');

    // Should navigate to forgot password
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Password Reset', () => {
  test('should send password reset email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('[data-testid="reset-email"]', 'customer@example.com');
    await page.click('[data-testid="send-reset-email"]');

    // Should show success message
    await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText(/check your email/i);
  });

  test('should validate email format for password reset', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('[data-testid="reset-email"]', 'invalid-email');
    await page.click('[data-testid="send-reset-email"]');

    // Should show validation error
    await expect(page.locator('[data-testid="reset-email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-email-error"]')).toContainText(/valid email/i);
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('[data-testid="reset-email"]', 'nonexistent@example.com');
    await page.click('[data-testid="send-reset-email"]');

    // Should show error
    await expect(page.locator('[data-testid="reset-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="reset-error"]')).toContainText(/not found|no account/i);
  });

  test('should reset password with valid token', async ({ page }) => {
    // Navigate to reset password page with token (mock token)
    await page.goto('/reset-password?token=valid-reset-token');

    await page.fill('[data-testid="new-password"]', 'NewSecurePass123!');
    await page.fill('[data-testid="confirm-new-password"]', 'NewSecurePass123!');
    await page.click('[data-testid="reset-password-button"]');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Should show success message
    await expect(page.locator('[data-testid="password-reset-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-reset-success"]')).toContainText(/password.*reset/i);
  });

  test('should validate new password strength', async ({ page }) => {
    await page.goto('/reset-password?token=valid-reset-token');

    await page.fill('[data-testid="new-password"]', 'weak');
    await page.blur('[data-testid="new-password"]');

    // Should show strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak|too short/i);
  });

  test('should show error for invalid or expired token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token');

    await page.fill('[data-testid="new-password"]', 'NewSecurePass123!');
    await page.fill('[data-testid="confirm-new-password"]', 'NewSecurePass123!');
    await page.click('[data-testid="reset-password-button"]');

    // Should show error
    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-error"]')).toContainText(/invalid|expired/i);
  });
});

test.describe('OAuth Authentication', () => {
  test('should show OAuth login options', async ({ page }) => {
    await page.goto('/login');

    // Should show OAuth buttons
    await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
    await expect(page.locator('[data-testid="facebook-login"]')).toBeVisible();
  });

  test('should initiate Google OAuth flow', async ({ page }) => {
    await page.goto('/login');

    // Click Google login
    await page.click('[data-testid="google-login"]');

    // Should redirect to Google OAuth (or mock OAuth page)
    await page.waitForURL(/google|oauth/);
  });

  test('should initiate Facebook OAuth flow', async ({ page }) => {
    await page.goto('/login');

    // Click Facebook login
    await page.click('[data-testid="facebook-login"]');

    // Should redirect to Facebook OAuth (or mock OAuth page)
    await page.waitForURL(/facebook|oauth/);
  });

  test('should complete OAuth login successfully', async ({ page }) => {
    await page.goto('/login');

    // Mock OAuth callback with success
    await page.goto('/oauth/callback?provider=google&code=mock-auth-code');

    // Should redirect to home page
    await expect(page).toHaveURL(/\//);

    // Should be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    await page.goto('/login');

    // Mock OAuth callback with error
    await page.goto('/oauth/callback?error=access_denied');

    // Should redirect back to login
    await expect(page).toHaveURL(/\/login/);

    // Should show error message
    await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="oauth-error"]')).toContainText(/cancelled|denied/i);
  });
});

test.describe('User Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\//);
  });

  test('should logout successfully', async ({ page }) => {
    // Open user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('[data-testid="logout-button"]');

    // Should redirect to home or login
    await expect(page).toHaveURL(/\/|\/login/);

    // User menu should not be visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should clear session on logout', async ({ page }) => {
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Try to navigate to protected page
    await page.goto('/account');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should clear cart on logout (optional)', async ({ page }) => {
    // Add item to cart
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="add-to-cart-button"]').first().click();

    // Verify cart has items
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Cart should be empty (if configured to clear on logout)
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    const isVisible = await cartBadge.isVisible();
    if (isVisible) {
      // If cart persists, it should show the same count
      await expect(cartBadge).toHaveText('1');
    }
    // If cart is cleared, badge won't be visible
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
    await page.goto('/account');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to original page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/account/orders');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should redirect back to originally requested page
    await expect(page).toHaveURL(/\/account\/orders/);
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to protected page
    await page.goto('/account');

    // Should not redirect
    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator('h1')).toContainText(/account|profile/i);
  });
});
