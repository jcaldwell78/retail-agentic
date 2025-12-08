import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TermsOfServicePage from './TermsOfServicePage';

// Wrapper for router context
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the page with correct test id', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('terms-of-service-page')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('page-title')).toHaveTextContent('Terms of Service');
    });

    it('should display effective date and last updated', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    });

    it('should render back to home link', () => {
      renderWithRouter(<TermsOfServicePage />);

      const backLink = screen.getByTestId('back-home-link');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should render privacy policy link in footer', () => {
      renderWithRouter(<TermsOfServicePage />);

      const privacyLink = screen.getByTestId('privacy-policy-link');
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });
  });

  describe('Introduction Section', () => {
    it('should render introduction section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-intro')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('should explain terms agreement', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/By accessing or using our website, you agree to be bound by these Terms/)).toBeInTheDocument();
    });
  });

  describe('Definitions Section', () => {
    it('should render definitions section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-definitions')).toBeInTheDocument();
      expect(screen.getByText('Definitions')).toBeInTheDocument();
    });

    it('should define key terms', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/"We", "Us", "Our"/)).toBeInTheDocument();
      expect(screen.getByText(/"You", "User", "Customer"/)).toBeInTheDocument();
      expect(screen.getByText(/"Website"/)).toBeInTheDocument();
      expect(screen.getByText(/"Products"/)).toBeInTheDocument();
    });
  });

  describe('Eligibility Section', () => {
    it('should render eligibility section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-eligibility')).toBeInTheDocument();
      expect(screen.getByText('Eligibility')).toBeInTheDocument();
    });

    it('should list eligibility requirements', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/at least 18 years of age/)).toBeInTheDocument();
      expect(screen.getByText(/legal capacity to enter into a binding agreement/)).toBeInTheDocument();
    });
  });

  describe('Account Registration Section', () => {
    it('should render account section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-account')).toBeInTheDocument();
      expect(screen.getByText('Account Registration')).toBeInTheDocument();
    });

    it('should list account responsibilities', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/Provide accurate and complete registration information/)).toBeInTheDocument();
      expect(screen.getByText(/Maintain the security and confidentiality/)).toBeInTheDocument();
      expect(screen.getByText(/Notify us immediately of any unauthorized use/)).toBeInTheDocument();
    });
  });

  describe('Orders and Purchases Section', () => {
    it('should render orders section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-orders')).toBeInTheDocument();
      expect(screen.getByText('Orders and Purchases')).toBeInTheDocument();
    });

    it('should have order acceptance subsection', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Order Acceptance')).toBeInTheDocument();
      expect(screen.getByText(/All orders are subject to acceptance and availability/)).toBeInTheDocument();
    });

    it('should have pricing subsection', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText(/prices exclude taxes and shipping/i)).toBeInTheDocument();
    });

    it('should have payment subsection', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText(/Payment is due at the time of order/)).toBeInTheDocument();
    });
  });

  describe('Shipping Section', () => {
    it('should render shipping section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-shipping')).toBeInTheDocument();
      expect(screen.getByText('Shipping and Delivery')).toBeInTheDocument();
    });

    it('should mention delivery times', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/Estimated delivery times are not guaranteed/)).toBeInTheDocument();
    });
  });

  describe('Returns Section', () => {
    it('should render returns section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-returns')).toBeInTheDocument();
      expect(screen.getByText('Returns and Refunds')).toBeInTheDocument();
    });

    it('should state return period', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/returns within 30 days of delivery/)).toBeInTheDocument();
    });

    it('should list return eligibility requirements', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/item must be unused and in its original packaging/)).toBeInTheDocument();
      expect(screen.getByText(/must have the receipt or proof of purchase/)).toBeInTheDocument();
    });

    it('should have link to returns policy', () => {
      renderWithRouter(<TermsOfServicePage />);

      const returnsLink = screen.getByRole('link', { name: /Returns Policy/i });
      expect(returnsLink).toHaveAttribute('href', '/returns');
    });
  });

  describe('Intellectual Property Section', () => {
    it('should render intellectual property section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-intellectual-property')).toBeInTheDocument();
      expect(screen.getByText('Intellectual Property')).toBeInTheDocument();
    });

    it('should mention copyright protection', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/protected by copyright, trademark, and other intellectual property laws/)).toBeInTheDocument();
    });
  });

  describe('User Content Section', () => {
    it('should render user content section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-user-content')).toBeInTheDocument();
      expect(screen.getByText('User Content')).toBeInTheDocument();
    });

    it('should mention content license grant', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/non-exclusive, royalty-free, perpetual, and worldwide license/)).toBeInTheDocument();
    });

    it('should list user representations', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/own or have the right to submit the content/)).toBeInTheDocument();
      expect(screen.getByText(/content does not violate any third-party rights/)).toBeInTheDocument();
    });
  });

  describe('Prohibited Conduct Section', () => {
    it('should render prohibited conduct section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-prohibited')).toBeInTheDocument();
      expect(screen.getByText('Prohibited Conduct')).toBeInTheDocument();
    });

    it('should list prohibited activities', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/Use the website for any unlawful purpose/)).toBeInTheDocument();
      expect(screen.getByText(/Use bots, scrapers, or automated tools/)).toBeInTheDocument();
      expect(screen.getByText(/Attempt to gain unauthorized access/)).toBeInTheDocument();
    });
  });

  describe('Disclaimer Section', () => {
    it('should render disclaimer section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-disclaimer')).toBeInTheDocument();
      expect(screen.getByText('Disclaimer of Warranties')).toBeInTheDocument();
    });

    it('should state AS IS provision', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/AS IS.*AS AVAILABLE/)).toBeInTheDocument();
    });
  });

  describe('Limitation of Liability Section', () => {
    it('should render liability section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-liability')).toBeInTheDocument();
      expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();
    });

    it('should limit damages', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL/)).toBeInTheDocument();
    });
  });

  describe('Indemnification Section', () => {
    it('should render indemnification section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-indemnification')).toBeInTheDocument();
      expect(screen.getByText('Indemnification')).toBeInTheDocument();
    });

    it('should mention indemnification obligation', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/agree to indemnify and hold us harmless/)).toBeInTheDocument();
    });
  });

  describe('Dispute Resolution Section', () => {
    it('should render dispute section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-dispute')).toBeInTheDocument();
      expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();
    });

    it('should mention arbitration', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Binding Arbitration:')).toBeInTheDocument();
    });

    it('should mention class action waiver', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Class Action Waiver:')).toBeInTheDocument();
    });
  });

  describe('Governing Law Section', () => {
    it('should render governing law section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-governing-law')).toBeInTheDocument();
      expect(screen.getByText('Governing Law')).toBeInTheDocument();
    });
  });

  describe('Termination Section', () => {
    it('should render termination section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-termination')).toBeInTheDocument();
      expect(screen.getByText('Termination')).toBeInTheDocument();
    });

    it('should list termination consequences', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText(/right to access the website will immediately cease/)).toBeInTheDocument();
      expect(screen.getByText(/pending orders may be cancelled/)).toBeInTheDocument();
    });
  });

  describe('Changes Section', () => {
    it('should render changes section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-changes')).toBeInTheDocument();
      expect(screen.getByText('Changes to Terms')).toBeInTheDocument();
    });
  });

  describe('Severability Section', () => {
    it('should render severability section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-severability')).toBeInTheDocument();
      expect(screen.getByText('Severability')).toBeInTheDocument();
    });
  });

  describe('Entire Agreement Section', () => {
    it('should render entire agreement section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-entire-agreement')).toBeInTheDocument();
      expect(screen.getByText('Entire Agreement')).toBeInTheDocument();
    });

    it('should link to privacy policy', () => {
      renderWithRouter(<TermsOfServicePage />);

      const section = screen.getByTestId('section-entire-agreement');
      const privacyLink = section.querySelector('a[href="/privacy-policy"]');
      expect(privacyLink).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('should render contact section', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByTestId('section-contact')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should display legal contact information', () => {
      renderWithRouter(<TermsOfServicePage />);

      expect(screen.getByText('Legal Department')).toBeInTheDocument();
      expect(screen.getByText(/Email: legal@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/Address: 123 Commerce Street/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<TermsOfServicePage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Terms of Service');

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThanOrEqual(15);
    });

    it('should have accessible links', () => {
      renderWithRouter(<TermsOfServicePage />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });

    it('should use semantic list elements', () => {
      renderWithRouter(<TermsOfServicePage />);

      const lists = document.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(5);
    });
  });
});
