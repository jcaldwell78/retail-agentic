import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import CartPage from '@/pages/CartPage';

expect.extend(toHaveNoViolations);

/**
 * Accessibility tests for CartPage using axe-core.
 * Tests WCAG 2.1 Level AA compliance.
 */
describe('CartPage - Accessibility', () => {
  it('should not have any automatically detectable accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartPage />
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
        <CartPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible form controls for quantity', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'label': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible data tables', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'table': { enabled: true },
        'td-headers-attr': { enabled: true },
        'th-has-data-cells': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should meet WCAG 2.1 Level AA standards', async () => {
    const { container } = render(
      <BrowserRouter>
        <CartPage />
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
