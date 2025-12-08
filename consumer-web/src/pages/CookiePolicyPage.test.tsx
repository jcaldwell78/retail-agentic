import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CookiePolicyPage from './CookiePolicyPage';

const renderPage = () => {
  return render(
    <MemoryRouter>
      <CookiePolicyPage />
    </MemoryRouter>
  );
};

describe('CookiePolicyPage', () => {
  it('should render the page', () => {
    renderPage();
    expect(screen.getByTestId('cookie-policy-page')).toBeInTheDocument();
  });

  it('should display the page title', () => {
    renderPage();
    expect(screen.getByTestId('page-title')).toHaveTextContent('Cookie Policy');
  });

  it('should display the effective date', () => {
    renderPage();
    expect(screen.getByText(/Effective Date:/)).toBeInTheDocument();
  });

  it('should display the intro section', () => {
    renderPage();
    expect(screen.getByTestId('section-intro')).toBeInTheDocument();
    expect(screen.getByText('What Are Cookies?')).toBeInTheDocument();
  });

  it('should display the manage cookies section', () => {
    renderPage();
    expect(screen.getByTestId('section-manage-cookies')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-settings-btn')).toBeInTheDocument();
  });

  it('should dispatch event when cookie settings button is clicked', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderPage();

    fireEvent.click(screen.getByTestId('cookie-settings-btn'));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openCookieSettings',
      })
    );
    dispatchSpy.mockRestore();
  });

  it('should display the types section with cookie categories', () => {
    renderPage();
    expect(screen.getByTestId('section-types')).toBeInTheDocument();
    expect(screen.getByText('Strictly Necessary Cookies')).toBeInTheDocument();
    expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('should display the third-party section', () => {
    renderPage();
    expect(screen.getByTestId('section-third-party')).toBeInTheDocument();
    expect(screen.getByText('Third-Party Cookies')).toBeInTheDocument();
    expect(screen.getByText('Google Analytics')).toBeInTheDocument();
  });

  it('should display the control section', () => {
    renderPage();
    expect(screen.getByTestId('section-control')).toBeInTheDocument();
    expect(screen.getByText('How to Control Cookies')).toBeInTheDocument();
  });

  it('should display the impact section', () => {
    renderPage();
    expect(screen.getByTestId('section-impact')).toBeInTheDocument();
    expect(screen.getByText('Impact of Disabling Cookies')).toBeInTheDocument();
  });

  it('should display the updates section', () => {
    renderPage();
    expect(screen.getByTestId('section-updates')).toBeInTheDocument();
    expect(screen.getByText('Updates to This Policy')).toBeInTheDocument();
  });

  it('should display the contact section', () => {
    renderPage();
    expect(screen.getByTestId('section-contact')).toBeInTheDocument();
    expect(screen.getByText('Privacy Team')).toBeInTheDocument();
  });

  it('should display back to home link', () => {
    renderPage();
    const link = screen.getByTestId('back-home-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('should link to privacy policy', () => {
    renderPage();
    const privacyLinks = screen.getAllByRole('link', { name: 'Privacy Policy' });
    const internalPrivacyLink = privacyLinks.find(link => link.getAttribute('href') === '/privacy');
    expect(internalPrivacyLink).toBeDefined();
    expect(internalPrivacyLink).toHaveAttribute('href', '/privacy');
  });
});
