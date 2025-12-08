import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { CookieConsent, useCookieConsent, CookieSettingsButton, CookiePreferences } from './CookieConsent';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return hasConsented as false when no consent stored', () => {
    const { result } = renderHook(() => useCookieConsent());

    // Wait for useEffect to run
    expect(result.current.hasConsented).toBe(false);
  });

  it('should return hasConsented as true when consent is stored', () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.hasConsented).toBe(true);
  });

  it('should load stored preferences', () => {
    const storedPrefs: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: false,
    };

    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));
    localStorageMock.setItem('cookie_preferences', JSON.stringify(storedPrefs));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.preferences).toEqual(storedPrefs);
  });

  it('should accept all cookies', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.hasConsented).toBe(true);
    expect(result.current.preferences).toEqual({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  });

  it('should reject all optional cookies', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.rejectAll();
    });

    expect(result.current.hasConsented).toBe(true);
    expect(result.current.preferences).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  });

  it('should save custom preferences', () => {
    const { result } = renderHook(() => useCookieConsent());

    const customPrefs: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: false,
      marketing: false,
    };

    act(() => {
      result.current.saveConsent(customPrefs);
    });

    expect(result.current.hasConsented).toBe(true);
    expect(result.current.preferences).toEqual(customPrefs);
  });

  it('should reset consent', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.hasConsented).toBe(true);

    act(() => {
      result.current.resetConsent();
    });

    expect(result.current.hasConsented).toBe(false);
  });

  it('should re-prompt when consent version changes', () => {
    // Store old version consent
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '0.9', // Old version
      timestamp: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useCookieConsent());

    // Should show consent again because version doesn't match
    expect(result.current.hasConsented).toBe(false);
  });
});

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should render cookie banner when no consent', () => {
    render(<CookieConsent />);

    expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
    expect(screen.getByText('We value your privacy')).toBeInTheDocument();
  });

  it('should not render when consent exists', () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));

    const { container } = render(<CookieConsent />);

    expect(container.firstChild).toBeNull();
  });

  it('should show accept all, reject all, and manage preferences buttons', () => {
    render(<CookieConsent />);

    expect(screen.getByTestId('accept-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('reject-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('manage-preferences-btn')).toBeInTheDocument();
  });

  it('should show privacy policy link', () => {
    render(<CookieConsent privacyPolicyUrl="/custom-privacy" />);

    const link = screen.getByTestId('privacy-link');
    expect(link).toHaveAttribute('href', '/custom-privacy');
  });

  it('should call onAcceptAll callback when accepting all', async () => {
    const onAcceptAll = vi.fn();
    render(<CookieConsent onAcceptAll={onAcceptAll} />);

    await userEvent.click(screen.getByTestId('accept-all-btn'));

    expect(onAcceptAll).toHaveBeenCalled();
  });

  it('should call onRejectAll callback when rejecting all', async () => {
    const onRejectAll = vi.fn();
    render(<CookieConsent onRejectAll={onRejectAll} />);

    await userEvent.click(screen.getByTestId('reject-all-btn'));

    expect(onRejectAll).toHaveBeenCalled();
  });

  it('should hide banner after accepting all', async () => {
    render(<CookieConsent />);

    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('accept-all-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('cookie-banner')).not.toBeInTheDocument();
    });
  });

  it('should hide banner after rejecting all', async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByTestId('reject-all-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('cookie-banner')).not.toBeInTheDocument();
    });
  });

  it('should show preferences panel when manage preferences clicked', async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByTestId('manage-preferences-btn'));

    expect(screen.getByTestId('preferences-panel')).toBeInTheDocument();
  });

  it('should have accessible role attributes', () => {
    render(<CookieConsent />);

    const consent = screen.getByTestId('cookie-consent');
    expect(consent).toHaveAttribute('role', 'dialog');
    expect(consent).toHaveAttribute('aria-label', 'Cookie consent');
  });
});

describe('CookiePreferencesPanel', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const renderPreferencesPanel = async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByTestId('manage-preferences-btn'));
  };

  it('should render all cookie categories', async () => {
    await renderPreferencesPanel();

    expect(screen.getByTestId('cookie-category-necessary')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-functional')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-analytics')).toBeInTheDocument();
    expect(screen.getByTestId('cookie-category-marketing')).toBeInTheDocument();
  });

  it('should have necessary toggle disabled', async () => {
    await renderPreferencesPanel();

    const necessaryToggle = screen.getByTestId('toggle-necessary');
    expect(necessaryToggle).toBeDisabled();
    expect(necessaryToggle).toBeChecked();
  });

  it('should allow toggling optional cookie types', async () => {
    await renderPreferencesPanel();

    const analyticsToggle = screen.getByTestId('toggle-analytics');
    expect(analyticsToggle).not.toBeChecked();

    await userEvent.click(analyticsToggle);
    expect(analyticsToggle).toBeChecked();
  });

  it('should close panel when close button clicked', async () => {
    await renderPreferencesPanel();

    expect(screen.getByTestId('preferences-panel')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('close-preferences'));

    expect(screen.queryByTestId('preferences-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();
  });

  it('should close panel when cancel clicked', async () => {
    await renderPreferencesPanel();

    await userEvent.click(screen.getByTestId('cancel-preferences'));

    expect(screen.queryByTestId('preferences-panel')).not.toBeInTheDocument();
  });

  it('should save preferences and close when save clicked', async () => {
    await renderPreferencesPanel();

    // Enable analytics
    await userEvent.click(screen.getByTestId('toggle-analytics'));

    await userEvent.click(screen.getByTestId('save-preferences'));

    // Banner should be hidden after saving
    await waitFor(() => {
      expect(screen.queryByTestId('cookie-consent')).not.toBeInTheDocument();
    });

    // Verify preferences were saved
    const stored = JSON.parse(localStorageMock.getItem('cookie_preferences') || '{}');
    expect(stored.analytics).toBe(true);
  });

  it('should call onSavePreferences callback', async () => {
    const onSavePreferences = vi.fn();
    render(<CookieConsent onSavePreferences={onSavePreferences} />);

    await userEvent.click(screen.getByTestId('manage-preferences-btn'));
    await userEvent.click(screen.getByTestId('toggle-functional'));
    await userEvent.click(screen.getByTestId('save-preferences'));

    expect(onSavePreferences).toHaveBeenCalledWith(expect.objectContaining({
      necessary: true,
      functional: true,
    }));
  });

  it('should display category descriptions', async () => {
    await renderPreferencesPanel();

    expect(screen.getByText(/essential for the website to function/)).toBeInTheDocument();
    expect(screen.getByText(/remember your preferences/)).toBeInTheDocument();
    expect(screen.getByText(/understand how visitors interact/)).toBeInTheDocument();
    expect(screen.getByText(/deliver relevant advertisements/)).toBeInTheDocument();
  });

  it('should show "Always active" for necessary cookies', async () => {
    await renderPreferencesPanel();

    expect(screen.getByText('Always active')).toBeInTheDocument();
  });
});

describe('CookieSettingsButton', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should not render when no consent exists', () => {
    render(<CookieSettingsButton />);

    expect(screen.queryByTestId('cookie-settings-btn')).not.toBeInTheDocument();
  });

  it('should render when consent exists', () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));
    localStorageMock.setItem('cookie_preferences', JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }));

    render(<CookieSettingsButton />);

    expect(screen.getByTestId('cookie-settings-btn')).toBeInTheDocument();
  });

  it('should open preferences panel when clicked', async () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));

    render(<CookieSettingsButton />);

    await userEvent.click(screen.getByTestId('cookie-settings-btn'));

    expect(screen.getByTestId('cookie-settings-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preferences-panel')).toBeInTheDocument();
  });

  it('should close panel and save preferences', async () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));
    localStorageMock.setItem('cookie_preferences', JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }));

    render(<CookieSettingsButton />);

    await userEvent.click(screen.getByTestId('cookie-settings-btn'));
    await userEvent.click(screen.getByTestId('toggle-analytics'));
    await userEvent.click(screen.getByTestId('save-preferences'));

    await waitFor(() => {
      expect(screen.queryByTestId('cookie-settings-panel')).not.toBeInTheDocument();
    });

    const stored = JSON.parse(localStorageMock.getItem('cookie_preferences') || '{}');
    expect(stored.analytics).toBe(true);
  });

  it('should have accessible aria-label', () => {
    localStorageMock.setItem('cookie_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
    }));

    render(<CookieSettingsButton />);

    expect(screen.getByTestId('cookie-settings-btn')).toHaveAttribute('aria-label', 'Cookie settings');
  });
});

describe('Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should persist preferences across renders', async () => {
    const { unmount } = render(<CookieConsent />);

    // Accept all
    await userEvent.click(screen.getByTestId('accept-all-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('cookie-consent')).not.toBeInTheDocument();
    });

    unmount();

    // Re-render - should not show banner
    const { container } = render(<CookieConsent />);
    expect(container.firstChild).toBeNull();
  });

  it('should work with settings button after initial consent', async () => {
    // Initial consent
    render(<CookieConsent />);
    await userEvent.click(screen.getByTestId('accept-all-btn'));

    // Render settings button (simulating app with both components)
    render(<CookieSettingsButton />);

    // Settings button should be visible
    expect(screen.getByTestId('cookie-settings-btn')).toBeInTheDocument();
  });

  it('should store consent timestamp', async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByTestId('accept-all-btn'));

    const stored = JSON.parse(localStorageMock.getItem('cookie_consent') || '{}');
    expect(stored.timestamp).toBeDefined();
    expect(new Date(stored.timestamp)).toBeInstanceOf(Date);
  });

  it('should store consent version', async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByTestId('accept-all-btn'));

    const stored = JSON.parse(localStorageMock.getItem('cookie_consent') || '{}');
    expect(stored.version).toBe('1.0');
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should have proper dialog role', () => {
    render(<CookieConsent />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have labeled toggles', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByTestId('manage-preferences-btn'));

    const toggles = screen.getAllByRole('checkbox');
    toggles.forEach(toggle => {
      expect(toggle).toHaveAccessibleName();
    });
  });

  it('should be keyboard navigable', async () => {
    render(<CookieConsent />);

    // Tab to accept button
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    // Should be able to activate with keyboard
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByTestId('cookie-consent')).not.toBeInTheDocument();
    });
  });
});
