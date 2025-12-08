import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RefundPolicyPage from './RefundPolicyPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <RefundPolicyPage />
    </MemoryRouter>
  );
};

describe('RefundPolicyPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('refund-policy-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Refund & Return Policy');
  });

  it('should display the effective date', () => {
    renderPage();
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
  });

  it('should display the overview section', () => {
    renderPage();
    expect(screen.getByTestId('section-overview')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('should display the eligibility section', () => {
    renderPage();
    expect(screen.getByTestId('section-eligibility')).toBeInTheDocument();
    expect(screen.getByText('Return Eligibility')).toBeInTheDocument();
    expect(screen.getByText(/30 days/)).toBeInTheDocument();
  });

  it('should display the non-returnable items section', () => {
    renderPage();
    expect(screen.getByTestId('section-non-returnable')).toBeInTheDocument();
    expect(screen.getByText('Non-Returnable Items')).toBeInTheDocument();
  });

  it('should display the how to return section', () => {
    renderPage();
    expect(screen.getByTestId('section-how-to-return')).toBeInTheDocument();
    expect(screen.getByText('How to Return an Item')).toBeInTheDocument();
  });

  it('should display the refund process section', () => {
    renderPage();
    expect(screen.getByTestId('section-refund-process')).toBeInTheDocument();
    expect(screen.getByText('Refund Process')).toBeInTheDocument();
  });

  it('should display the refund types section', () => {
    renderPage();
    expect(screen.getByTestId('section-refund-types')).toBeInTheDocument();
    expect(screen.getByText('Types of Refunds')).toBeInTheDocument();
    expect(screen.getByText('Full Refund')).toBeInTheDocument();
    expect(screen.getByText('Partial Refund')).toBeInTheDocument();
    expect(screen.getByText('Store Credit')).toBeInTheDocument();
  });

  it('should display the shipping costs section', () => {
    renderPage();
    expect(screen.getByTestId('section-shipping-costs')).toBeInTheDocument();
    expect(screen.getByText('Return Shipping Costs')).toBeInTheDocument();
  });

  it('should display the exchanges section', () => {
    renderPage();
    expect(screen.getByTestId('section-exchanges')).toBeInTheDocument();
    expect(screen.getByText('Exchanges')).toBeInTheDocument();
  });

  it('should display the damaged/defective items section', () => {
    renderPage();
    expect(screen.getByTestId('section-damaged-defective')).toBeInTheDocument();
    expect(screen.getByText('Damaged or Defective Items')).toBeInTheDocument();
  });

  it('should display the contact section', () => {
    renderPage();
    expect(screen.getByTestId('section-contact')).toBeInTheDocument();
    expect(screen.getByText('Customer Service')).toBeInTheDocument();
    expect(screen.getByText(/returns@example\.com/)).toBeInTheDocument();
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
