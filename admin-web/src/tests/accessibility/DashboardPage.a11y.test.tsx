import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';

expect.extend(toHaveNoViolations);

/**
 * Accessibility tests for DashboardPage using axe-core.
 * Tests WCAG 2.1 Level AA compliance.
 */
describe('DashboardPage - Accessibility', () => {
  it('should not have any automatically detectable accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <DashboardPage />
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
        <DashboardPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible links', async () => {
    const { container } = render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'link-name': { enabled: true },
        'link-in-text-block': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible charts and data visualizations', async () => {
    const { container } = render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-hidden-focus': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have proper color contrast', async () => {
    const { container } = render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have accessible navigation landmarks', async () => {
    const { container } = render(
      <BrowserRouter>
        <DashboardPage />
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
        <DashboardPage />
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
