import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicyPage from './PrivacyPolicyPage';

// Wrapper for router context
const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the page with correct test id', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('privacy-policy-page')).toBeInTheDocument();
    });

    it('should render the page title', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('page-title')).toHaveTextContent('Privacy Policy');
    });

    it('should display effective date and last updated', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    });

    it('should render back to home link', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const backLink = screen.getByTestId('back-home-link');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Introduction Section', () => {
    it('should render introduction section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-intro')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('should mention GDPR compliance', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/General Data Protection Regulation \(GDPR\)/)).toBeInTheDocument();
    });
  });

  describe('Data Collection Section', () => {
    it('should render data collection section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-data-collection')).toBeInTheDocument();
      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    });

    it('should list personal information collected', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Name and contact information/)).toBeInTheDocument();
      expect(screen.getByText(/Account credentials/)).toBeInTheDocument();
      expect(screen.getByText(/Payment information/)).toBeInTheDocument();
      expect(screen.getByText(/Order history and transaction details/)).toBeInTheDocument();
    });

    it('should list automatically collected information', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Device information/)).toBeInTheDocument();
      expect(screen.getByText(/IP address/)).toBeInTheDocument();
      expect(screen.getByText(/Usage data/)).toBeInTheDocument();
      expect(screen.getByText(/Cookies and similar tracking/)).toBeInTheDocument();
    });
  });

  describe('Data Use Section', () => {
    it('should render data use section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-data-use')).toBeInTheDocument();
      expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
    });

    it('should list purposes for data use', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Processing and fulfilling your orders/)).toBeInTheDocument();
      expect(screen.getByText(/Managing your account/)).toBeInTheDocument();
      expect(screen.getByText(/Personalizing your shopping experience/)).toBeInTheDocument();
      expect(screen.getByText(/Detecting and preventing fraud/)).toBeInTheDocument();
    });
  });

  describe('Legal Basis Section (GDPR)', () => {
    it('should render legal basis section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-legal-basis')).toBeInTheDocument();
      expect(screen.getByText('Legal Basis for Processing (GDPR)')).toBeInTheDocument();
    });

    it('should list all legal bases', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText('Contract Performance:')).toBeInTheDocument();
      expect(screen.getByText('Consent:')).toBeInTheDocument();
      expect(screen.getByText('Legitimate Interests:')).toBeInTheDocument();
      expect(screen.getByText('Legal Obligation:')).toBeInTheDocument();
    });
  });

  describe('Cookies Section', () => {
    it('should render cookies section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-cookies')).toBeInTheDocument();
      expect(screen.getByText('Cookies and Tracking')).toBeInTheDocument();
    });

    it('should have cookie settings link', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const cookieLink = screen.getByTestId('cookie-settings-link');
      expect(cookieLink).toBeInTheDocument();
      expect(cookieLink).toHaveTextContent('Cookie Settings');
    });

    it('should dispatch cookie settings event when clicked', async () => {
      const user = userEvent.setup();
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      renderWithRouter(<PrivacyPolicyPage />);

      await user.click(screen.getByTestId('cookie-settings-link'));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'openCookieSettings' })
      );

      dispatchEventSpy.mockRestore();
    });

    it('should list cookie types', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText('Strictly Necessary:')).toBeInTheDocument();
      expect(screen.getByText('Functional:')).toBeInTheDocument();
      expect(screen.getByText('Analytics:')).toBeInTheDocument();
      expect(screen.getByText('Marketing:')).toBeInTheDocument();
    });
  });

  describe('Data Sharing Section', () => {
    it('should render data sharing section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-data-sharing')).toBeInTheDocument();
      expect(screen.getByText('Data Sharing and Third Parties')).toBeInTheDocument();
    });

    it('should list third parties', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Payment processors/)).toBeInTheDocument();
      expect(screen.getByText(/Shipping carriers/)).toBeInTheDocument();
      expect(screen.getByText(/Analytics providers/)).toBeInTheDocument();
    });

    it('should state data is not sold', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/We do not sell your personal information/)).toBeInTheDocument();
    });
  });

  describe('Data Retention Section', () => {
    it('should render data retention section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-data-retention')).toBeInTheDocument();
      expect(screen.getByText('Data Retention')).toBeInTheDocument();
    });

    it('should list retention periods', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Account data:.*3 years/)).toBeInTheDocument();
      expect(screen.getByText(/Order history:.*7 years/)).toBeInTheDocument();
      expect(screen.getByText(/Analytics data:.*26 months/)).toBeInTheDocument();
    });
  });

  describe('Your Rights Section', () => {
    it('should render your rights section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-your-rights')).toBeInTheDocument();
      expect(screen.getByText('Your Rights')).toBeInTheDocument();
    });

    it('should list all GDPR rights', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText('Right to Access:')).toBeInTheDocument();
      expect(screen.getByText('Right to Rectification:')).toBeInTheDocument();
      expect(screen.getByText('Right to Erasure:')).toBeInTheDocument();
      expect(screen.getByText('Right to Restrict Processing:')).toBeInTheDocument();
      expect(screen.getByText('Right to Data Portability:')).toBeInTheDocument();
      expect(screen.getByText('Right to Object:')).toBeInTheDocument();
      expect(screen.getByText('Right to Withdraw Consent:')).toBeInTheDocument();
    });

    it('should have contact email link', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const emailLink = screen.getByRole('link', { name: /privacy@example.com/ });
      expect(emailLink).toHaveAttribute('href', 'mailto:privacy@example.com');
    });

    it('should have account preferences link', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const prefsLink = screen.getByRole('link', { name: /Account Preferences/ });
      expect(prefsLink).toHaveAttribute('href', '/account/preferences');
    });
  });

  describe('Data Security Section', () => {
    it('should render data security section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-data-security')).toBeInTheDocument();
      expect(screen.getByText('Data Security')).toBeInTheDocument();
    });

    it('should list security measures', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Encryption of data/)).toBeInTheDocument();
      expect(screen.getByText(/Secure password hashing/)).toBeInTheDocument();
      expect(screen.getByText(/Regular security assessments/)).toBeInTheDocument();
      expect(screen.getByText(/Access controls/)).toBeInTheDocument();
    });
  });

  describe('International Transfers Section', () => {
    it('should render international transfers section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-international')).toBeInTheDocument();
      expect(screen.getByText('International Data Transfers')).toBeInTheDocument();
    });

    it('should mention Standard Contractual Clauses', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/Standard Contractual Clauses/)).toBeInTheDocument();
    });
  });

  describe('Children Privacy Section', () => {
    it('should render children privacy section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-children')).toBeInTheDocument();
      expect(screen.getByText("Children's Privacy")).toBeInTheDocument();
    });

    it('should state age restriction', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/children under 16 years of age/)).toBeInTheDocument();
    });
  });

  describe('Changes Section', () => {
    it('should render changes section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-changes')).toBeInTheDocument();
      expect(screen.getByText('Changes to This Policy')).toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('should render contact section', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByTestId('section-contact')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should display DPO contact information', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText('Data Protection Officer')).toBeInTheDocument();
      expect(screen.getByText(/Email: privacy@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/Address: 123 Privacy Street/)).toBeInTheDocument();
    });

    it('should mention right to lodge complaint', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      expect(screen.getByText(/right to lodge a complaint/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Privacy Policy');

      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(5);
    });

    it('should have accessible links', () => {
      renderWithRouter(<PrivacyPolicyPage />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});
