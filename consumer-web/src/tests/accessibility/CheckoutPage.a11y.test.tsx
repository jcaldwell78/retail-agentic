import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from '@/pages/CheckoutPage';

expect.extend(toHaveNoViolations);

/**
 * Accessibility tests for CheckoutPage using axe-core.
 * Tests WCAG 2.1 Level AA compliance.
 * Checkout forms must be fully accessible for all users.
 */
describe('CheckoutPage - Accessibility', () => {
  it('should not have any automatically detectable accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        // WCAG 2.1 Level AA rules
        'color-contrast': { enabled: true },
        'valid-lang': { enabled: true },
        'html-has-lang': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'region': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible form controls', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'label': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'autocomplete-valid': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper error identification', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'aria-invalid-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible region landmarks', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'landmark-unique': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should meet WCAG 2.1 Level AA standards', async () => {
    const { container } = render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    expect(results).toHaveNoViolations();
  });
});
