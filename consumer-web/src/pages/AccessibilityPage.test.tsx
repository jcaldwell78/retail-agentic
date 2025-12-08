import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccessibilityPage from './AccessibilityPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <AccessibilityPage />
    </MemoryRouter>
  );
};

describe('AccessibilityPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('accessibility-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Accessibility Statement');
  });

  it('should display the last updated date', () => {
    renderPage();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('should display the commitment section', () => {
    renderPage();
    expect(screen.getByTestId('section-commitment')).toBeInTheDocument();
    expect(screen.getByText('Our Commitment')).toBeInTheDocument();
  });

  it('should display the standards section', () => {
    renderPage();
    expect(screen.getByTestId('section-standards')).toBeInTheDocument();
    expect(screen.getByText('Conformance Standards')).toBeInTheDocument();
    const standardsSection = screen.getByTestId('section-standards');
    expect(standardsSection.textContent).toContain('WCAG');
  });

  it('should display the features section', () => {
    renderPage();
    expect(screen.getByTestId('section-features')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Features')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Visual Design')).toBeInTheDocument();
  });

  it('should display the assistive technology section', () => {
    renderPage();
    expect(screen.getByTestId('section-assistive')).toBeInTheDocument();
    expect(screen.getByText('Assistive Technology Compatibility')).toBeInTheDocument();
  });

  it('should display the known issues section', () => {
    renderPage();
    expect(screen.getByTestId('section-known-issues')).toBeInTheDocument();
    expect(screen.getByText('Known Limitations')).toBeInTheDocument();
  });

  it('should display the testing section', () => {
    renderPage();
    expect(screen.getByTestId('section-testing')).toBeInTheDocument();
    expect(screen.getByText('Testing & Evaluation')).toBeInTheDocument();
  });

  it('should display the browser support section', () => {
    renderPage();
    expect(screen.getByTestId('section-browser-support')).toBeInTheDocument();
    expect(screen.getByText('Browser Support')).toBeInTheDocument();
  });

  it('should display the feedback section', () => {
    renderPage();
    expect(screen.getByTestId('section-feedback')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Team')).toBeInTheDocument();
    expect(screen.getByText(/accessibility@example\.com/)).toBeInTheDocument();
  });

  it('should display the alternatives section', () => {
    renderPage();
    expect(screen.getByTestId('section-alternatives')).toBeInTheDocument();
    expect(screen.getByText('Alternative Access')).toBeInTheDocument();
  });

  it('should display the resources section with links', () => {
    renderPage();
    expect(screen.getByTestId('section-resources')).toBeInTheDocument();
    expect(screen.getByText('Additional Resources')).toBeInTheDocument();
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
