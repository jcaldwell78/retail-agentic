import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShippingPolicyPage from './ShippingPolicyPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <ShippingPolicyPage />
    </MemoryRouter>
  );
};

describe('ShippingPolicyPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('shipping-policy-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Shipping Policy');
  });

  it('should display the effective date', () => {
    renderPage();
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
  });

  it('should display the overview section', () => {
    renderPage();
    expect(screen.getByTestId('section-overview')).toBeInTheDocument();
  });

  it('should display the processing section', () => {
    renderPage();
    expect(screen.getByTestId('section-processing')).toBeInTheDocument();
    expect(screen.getByText('Order Processing')).toBeInTheDocument();
  });

  it('should display the shipping methods section with table', () => {
    renderPage();
    expect(screen.getByTestId('section-shipping-methods')).toBeInTheDocument();
    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    expect(screen.getByText('Express Shipping')).toBeInTheDocument();
  });

  it('should display the free shipping section', () => {
    renderPage();
    expect(screen.getByTestId('section-free-shipping')).toBeInTheDocument();
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
  });

  it('should display the international shipping section', () => {
    renderPage();
    expect(screen.getByTestId('section-international')).toBeInTheDocument();
    expect(screen.getByText('International Shipping')).toBeInTheDocument();
  });

  it('should display the tracking section', () => {
    renderPage();
    expect(screen.getByTestId('section-tracking')).toBeInTheDocument();
    expect(screen.getByText('Order Tracking')).toBeInTheDocument();
  });

  it('should display the delivery issues section', () => {
    renderPage();
    expect(screen.getByTestId('section-delivery-issues')).toBeInTheDocument();
    expect(screen.getByText('Lost Package')).toBeInTheDocument();
    expect(screen.getByText('Damaged Package')).toBeInTheDocument();
  });

  it('should display the P.O. boxes section', () => {
    renderPage();
    expect(screen.getByTestId('section-po-boxes')).toBeInTheDocument();
  });

  it('should display the signature section', () => {
    renderPage();
    expect(screen.getByTestId('section-signature')).toBeInTheDocument();
    expect(screen.getByText('Signature Requirements')).toBeInTheDocument();
  });

  it('should display the contact section', () => {
    renderPage();
    expect(screen.getByTestId('section-contact')).toBeInTheDocument();
    expect(screen.getByText('Shipping Support')).toBeInTheDocument();
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
