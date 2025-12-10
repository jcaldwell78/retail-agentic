import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

const renderFooter = () => {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
};

describe('Footer', () => {
  it('should render the footer', () => {
    renderFooter();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should display company section', () => {
    renderFooter();
    expect(screen.getByTestId('footer-company')).toBeInTheDocument();
    expect(screen.getByText('RetailStore')).toBeInTheDocument();
  });

  it('should display social media links', () => {
    renderFooter();
    expect(screen.getByTestId('social-facebook')).toBeInTheDocument();
    expect(screen.getByTestId('social-twitter')).toBeInTheDocument();
    expect(screen.getByTestId('social-instagram')).toBeInTheDocument();
    expect(screen.getByTestId('social-youtube')).toBeInTheDocument();
  });

  it('should display quick links section', () => {
    renderFooter();
    expect(screen.getByTestId('footer-quick-links')).toBeInTheDocument();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop All Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Track Your Order' })).toHaveAttribute('href', '/orders');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
  });

  it('should display customer service section', () => {
    renderFooter();
    expect(screen.getByTestId('footer-customer-service')).toBeInTheDocument();
    expect(screen.getByText('Customer Service')).toBeInTheDocument();
  });

  it('should link to shipping policy', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Shipping Policy' })).toHaveAttribute('href', '/shipping-policy');
  });

  it('should link to refund policy', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Returns & Refunds' })).toHaveAttribute('href', '/refund-policy');
  });

  it('should link to privacy policy', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });

  it('should link to terms of service', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
  });

  it('should link to cookie policy', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookie-policy');
  });

  it('should link to accessibility page', () => {
    renderFooter();
    const accessibilityLinks = screen.getAllByRole('link', { name: /Accessibility/i });
    expect(accessibilityLinks.length).toBeGreaterThan(0);
    expect(accessibilityLinks[0]).toHaveAttribute('href', '/accessibility');
  });

  it('should display contact section', () => {
    renderFooter();
    expect(screen.getByTestId('footer-contact')).toBeInTheDocument();
    expect(screen.getByText(/123 Commerce Street/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1-800-123-4567' })).toHaveAttribute('href', 'tel:1-800-123-4567');
    expect(screen.getByRole('link', { name: 'support@example.com' })).toHaveAttribute('href', 'mailto:support@example.com');
  });

  it('should display bottom bar with copyright', () => {
    renderFooter();
    expect(screen.getByTestId('footer-bottom')).toBeInTheDocument();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('should link to DPA in bottom bar', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Data Processing Agreement' })).toHaveAttribute('href', '/dpa');
  });

  it('should have accessible social media links', () => {
    renderFooter();
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
  });

  it('should open social links in new tab', () => {
    renderFooter();
    const facebookLink = screen.getByTestId('social-facebook');
    expect(facebookLink).toHaveAttribute('target', '_blank');
    expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
