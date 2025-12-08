import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { X, Settings, Cookie } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean; // Always true, required for site function
  functional: boolean; // Remember preferences, language
  analytics: boolean; // Usage tracking, performance
  marketing: boolean; // Ads, retargeting
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cookie_preferences';
const CONSENT_VERSION = '1.0'; // Bump to re-prompt users after policy changes

export interface CookieConsentProps {
  className?: string;
  privacyPolicyUrl?: string;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onSavePreferences?: (preferences: CookiePreferences) => void;
}

export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check localStorage for existing consent
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (storedConsent) {
      const consentData = JSON.parse(storedConsent);
      // Check if consent version matches (re-prompt if policy updated)
      if (consentData.version === CONSENT_VERSION) {
        setHasConsented(true);
        if (storedPreferences) {
          setPreferences(JSON.parse(storedPreferences));
        }
      } else {
        // Policy updated, need re-consent
        setHasConsented(false);
      }
    } else {
      setHasConsented(false);
    }
  }, []);

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    }));
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsented(true);
  }, []);

  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyNecessary);
  }, [saveConsent]);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setHasConsented(false);
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    hasConsented,
    preferences,
    acceptAll,
    rejectAll,
    saveConsent,
    resetConsent,
  };
}

export function CookieConsent({
  className,
  privacyPolicyUrl = '/privacy-policy',
  onAcceptAll,
  onRejectAll,
  onSavePreferences,
}: CookieConsentProps) {
  const { hasConsented, preferences, acceptAll, rejectAll, saveConsent } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  // Don't render if already consented or still loading
  if (hasConsented === null || hasConsented === true) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAll();
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    rejectAll();
    onRejectAll?.();
  };

  const handleSavePreferences = () => {
    saveConsent(localPreferences);
    onSavePreferences?.(localPreferences);
    setShowPreferences(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg',
        showPreferences && 'inset-0 flex items-center justify-center bg-black/50',
        className
      )}
      data-testid="cookie-consent"
      role="dialog"
      aria-label="Cookie consent"
      aria-modal={showPreferences}
    >
      {showPreferences ? (
        <CookiePreferencesPanel
          preferences={localPreferences}
          onToggle={togglePreference}
          onSave={handleSavePreferences}
          onClose={() => setShowPreferences(false)}
          privacyPolicyUrl={privacyPolicyUrl}
        />
      ) : (
        <CookieBanner
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onManagePreferences={() => setShowPreferences(true)}
          privacyPolicyUrl={privacyPolicyUrl}
        />
      )}
    </div>
  );
}

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManagePreferences: () => void;
  privacyPolicyUrl: string;
}

function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onManagePreferences,
  privacyPolicyUrl,
}: CookieBannerProps) {
  return (
    <div className="max-w-7xl mx-auto" data-testid="cookie-banner">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-lg mb-1">We value your privacy</h2>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
              By clicking "Accept All", you consent to our use of cookies. You can manage your preferences
              or reject non-essential cookies.{' '}
              <a
                href={privacyPolicyUrl}
                className="text-primary hover:underline"
                data-testid="privacy-link"
              >
                Learn more in our Privacy Policy
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onManagePreferences}
            className="flex-1 md:flex-none"
            data-testid="manage-preferences-btn"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Preferences
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            className="flex-1 md:flex-none"
            data-testid="reject-all-btn"
          >
            Reject All
          </Button>
          <Button
            size="sm"
            onClick={onAcceptAll}
            className="flex-1 md:flex-none"
            data-testid="accept-all-btn"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CookiePreferencesPanelProps {
  preferences: CookiePreferences;
  onToggle: (key: keyof CookiePreferences) => void;
  onSave: () => void;
  onClose: () => void;
  privacyPolicyUrl: string;
}

function CookiePreferencesPanel({
  preferences,
  onToggle,
  onSave,
  onClose,
  privacyPolicyUrl,
}: CookiePreferencesPanelProps) {
  const cookieCategories = [
    {
      key: 'necessary' as const,
      name: 'Strictly Necessary',
      description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
      required: true,
    },
    {
      key: 'functional' as const,
      name: 'Functional',
      description: 'These cookies enable personalized features and remember your preferences, such as language and region settings.',
      required: false,
    },
    {
      key: 'analytics' as const,
      name: 'Analytics',
      description: 'These cookies help us understand how visitors interact with our website, allowing us to improve the user experience.',
      required: false,
    },
    {
      key: 'marketing' as const,
      name: 'Marketing',
      description: 'These cookies are used to deliver relevant advertisements and track ad campaign performance across different websites.',
      required: false,
    },
  ];

  return (
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto" data-testid="preferences-panel">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Cookie Preferences</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close preferences"
            data-testid="close-preferences"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          We use different types of cookies to optimize your experience on our website.
          Click on the categories below to learn more and customize your preferences.{' '}
          <a href={privacyPolicyUrl} className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>

        <div className="space-y-4 mb-6">
          {cookieCategories.map((category) => (
            <div
              key={category.key}
              className="border rounded-lg p-4"
              data-testid={`cookie-category-${category.key}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{category.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[category.key]}
                    onChange={() => onToggle(category.key)}
                    disabled={category.required}
                    className="sr-only peer"
                    data-testid={`toggle-${category.key}`}
                  />
                  <div
                    className={cn(
                      'w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors',
                      preferences[category.key] ? 'bg-primary' : 'bg-gray-200',
                      category.required && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        preferences[category.key] ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                  <span className="sr-only">
                    {preferences[category.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              <p className="text-sm text-gray-600">{category.description}</p>
              {category.required && (
                <p className="text-xs text-gray-500 mt-1">Always active</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="cancel-preferences"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="flex-1"
            data-testid="save-preferences"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Settings button for opening preferences after initial consent
export interface CookieSettingsButtonProps {
  className?: string;
}

export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  const { hasConsented, preferences, saveConsent } = useCookieConsent();
  const [showPanel, setShowPanel] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  if (!hasConsented) return null;

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    saveConsent(localPreferences);
    setShowPanel(false);
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className={cn(
          'fixed bottom-4 left-4 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors z-40',
          className
        )}
        aria-label="Cookie settings"
        data-testid="cookie-settings-btn"
      >
        <Cookie className="h-5 w-5" />
      </button>

      {showPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          data-testid="cookie-settings-panel"
        >
          <CookiePreferencesPanel
            preferences={localPreferences}
            onToggle={togglePreference}
            onSave={handleSave}
            onClose={() => setShowPanel(false)}
            privacyPolicyUrl="/privacy-policy"
          />
        </div>
      )}
    </>
  );
}

export default CookieConsent;
