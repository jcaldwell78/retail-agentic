import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DataProcessingAgreementPage from './DataProcessingAgreementPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <DataProcessingAgreementPage />
    </MemoryRouter>
  );
};

describe('DataProcessingAgreementPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('dpa-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Data Processing Agreement');
  });

  it('should display the effective date', () => {
    renderPage();
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
  });

  it('should display the intro section', () => {
    renderPage();
    expect(screen.getByTestId('section-intro')).toBeInTheDocument();
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText(/GDPR/)).toBeInTheDocument();
  });

  it('should display the definitions section', () => {
    renderPage();
    expect(screen.getByTestId('section-definitions')).toBeInTheDocument();
    expect(screen.getByText('Definitions')).toBeInTheDocument();
    expect(screen.getByText(/"Personal Data"/)).toBeInTheDocument();
    expect(screen.getByText(/"Data Controller"/)).toBeInTheDocument();
    expect(screen.getByText(/"Data Processor"/)).toBeInTheDocument();
  });

  it('should display the scope section', () => {
    renderPage();
    expect(screen.getByTestId('section-scope')).toBeInTheDocument();
    expect(screen.getByText('Scope of Processing')).toBeInTheDocument();
    expect(screen.getByText(/Order processing and fulfillment/)).toBeInTheDocument();
  });

  it('should display the data categories section with table', () => {
    renderPage();
    expect(screen.getByTestId('section-data-categories')).toBeInTheDocument();
    expect(screen.getByText('Categories of Data')).toBeInTheDocument();
    expect(screen.getByText('Identity Data')).toBeInTheDocument();
    expect(screen.getByText('Contact Data')).toBeInTheDocument();
    expect(screen.getByText('Financial Data')).toBeInTheDocument();
  });

  it('should display the obligations section', () => {
    renderPage();
    expect(screen.getByTestId('section-obligations')).toBeInTheDocument();
    expect(screen.getByText('Our Obligations')).toBeInTheDocument();
  });

  it('should display the security section', () => {
    renderPage();
    expect(screen.getByTestId('section-security')).toBeInTheDocument();
    expect(screen.getByText('Security Measures')).toBeInTheDocument();
    expect(screen.getByText(/Encryption of data in transit/)).toBeInTheDocument();
  });

  it('should display the subprocessors section with table', () => {
    renderPage();
    expect(screen.getByTestId('section-subprocessors')).toBeInTheDocument();
    expect(screen.getByText('Sub-processors')).toBeInTheDocument();
    expect(screen.getByText('Cloud Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Payment Processors')).toBeInTheDocument();
  });

  it('should display the transfers section', () => {
    renderPage();
    expect(screen.getByTestId('section-transfers')).toBeInTheDocument();
    expect(screen.getByText('International Data Transfers')).toBeInTheDocument();
    expect(screen.getByText(/Standard Contractual Clauses/)).toBeInTheDocument();
  });

  it('should display the rights section', () => {
    renderPage();
    expect(screen.getByTestId('section-rights')).toBeInTheDocument();
    expect(screen.getByText('Data Subject Rights')).toBeInTheDocument();
    expect(screen.getByText(/Right of access/)).toBeInTheDocument();
    expect(screen.getByText(/Right to erasure/)).toBeInTheDocument();
  });

  it('should display the breach notification section', () => {
    renderPage();
    expect(screen.getByTestId('section-breach')).toBeInTheDocument();
    expect(screen.getByText('Data Breach Notification')).toBeInTheDocument();
    expect(screen.getByText(/72 hours/)).toBeInTheDocument();
  });

  it('should display the retention section', () => {
    renderPage();
    expect(screen.getByTestId('section-retention')).toBeInTheDocument();
    expect(screen.getByText('Data Retention')).toBeInTheDocument();
  });

  it('should display the audit section', () => {
    renderPage();
    expect(screen.getByTestId('section-audit')).toBeInTheDocument();
    expect(screen.getByText('Audit Rights')).toBeInTheDocument();
    expect(screen.getByText(/SOC 2/)).toBeInTheDocument();
  });

  it('should display the termination section', () => {
    renderPage();
    expect(screen.getByTestId('section-termination')).toBeInTheDocument();
    expect(screen.getByText('Termination')).toBeInTheDocument();
  });

  it('should display the amendments section', () => {
    renderPage();
    expect(screen.getByTestId('section-amendments')).toBeInTheDocument();
    expect(screen.getByText('Amendments')).toBeInTheDocument();
  });

  it('should display the contact section', () => {
    renderPage();
    expect(screen.getByTestId('section-contact')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Data Protection Officer')).toBeInTheDocument();
    expect(screen.getByText(/dpo@example\.com/)).toBeInTheDocument();
  });

  it('should link to privacy policy', () => {
    renderPage();
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('should link to terms of service', () => {
    renderPage();
    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
