import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface PWAContextValue extends ServiceWorkerState {
  canInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<boolean>;
  updateServiceWorker: () => Promise<void>;
  subscribeToNotifications: () => Promise<PushSubscription | null>;
  unsubscribeFromNotifications: () => Promise<boolean>;
  isNotificationSubscribed: boolean;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

// Provider
interface PWAProviderProps {
  children: ReactNode;
  serviceWorkerPath?: string;
  onInstall?: () => void;
  onUpdate?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function PWAProvider({
  children,
  serviceWorkerPath = '/sw.js',
  onInstall,
  onUpdate,
  onOffline,
  onOnline,
}: PWAProviderProps) {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalled: false,
    hasUpdate: false,
    isOffline: false,
    registration: null,
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isNotificationSubscribed, setIsNotificationSubscribed] = useState(false);

  // Check if service workers are supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setSwState((prev) => ({ ...prev, isSupported }));
  }, []);

  // Register service worker
  useEffect(() => {
    if (!swState.isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(serviceWorkerPath, {
          scope: '/',
        });

        setSwState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwState((prev) => ({ ...prev, hasUpdate: true }));
                onUpdate?.();
              }
            });
          }
        });

        // Check if already installed (has active worker)
        if (registration.active) {
          setSwState((prev) => ({ ...prev, isInstalled: true }));
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [swState.isSupported, serviceWorkerPath, onUpdate]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setInstallPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSwState((prev) => ({ ...prev, isOffline: false }));
      onOnline?.();
    };

    const handleOffline = () => {
      setSwState((prev) => ({ ...prev, isOffline: true }));
      onOffline?.();
    };

    // Set initial state
    setSwState((prev) => ({ ...prev, isOffline: !navigator.onLine }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOffline, onOnline]);

  // Check push notification subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!swState.registration || !('pushManager' in swState.registration)) return;

      try {
        const subscription = await swState.registration.pushManager.getSubscription();
        setIsNotificationSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSubscription();
  }, [swState.registration]);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setCanInstall(false);
      setInstallPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }, [installPrompt]);

  // Update service worker
  const updateServiceWorker = useCallback(async (): Promise<void> => {
    if (!swState.registration) return;

    try {
      const registration = swState.registration;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating service worker:', error);
    }
  }, [swState.registration]);

  // Subscribe to push notifications
  const subscribeToNotifications = useCallback(async (): Promise<PushSubscription | null> => {
    if (!swState.registration || !('pushManager' in swState.registration)) {
      console.error('Push notifications not supported');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Subscribe to push
      const subscription = await swState.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VITE_PUSH_PUBLIC_KEY || ''
        ),
      });

      setIsNotificationSubscribed(true);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return null;
    }
  }, [swState.registration]);

  // Unsubscribe from push notifications
  const unsubscribeFromNotifications = useCallback(async (): Promise<boolean> => {
    if (!swState.registration || !('pushManager' in swState.registration)) return false;

    try {
      const subscription = await swState.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsNotificationSubscribed(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      return false;
    }
  }, [swState.registration]);

  const value: PWAContextValue = {
    ...swState,
    canInstall,
    installPrompt,
    promptInstall,
    updateServiceWorker,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    isNotificationSubscribed,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

// Utility function for push notification key conversion
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Install Prompt Component
interface InstallPromptProps {
  className?: string;
  onInstalled?: () => void;
  onDismissed?: () => void;
  title?: string;
  description?: string;
}

export function InstallPrompt({
  className,
  onInstalled,
  onDismissed,
  title = 'Install Our App',
  description = 'Add to your home screen for quick access and offline browsing.',
}: InstallPromptProps) {
  const { canInstall, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      onInstalled?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismissed?.();
  };

  if (!canInstall || isDismissed) return null;

  return (
    <Card className={cn('border-primary', className)} data-testid="install-prompt">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleInstall} data-testid="install-button">
                Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                data-testid="dismiss-install"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Update Available Component
interface UpdateAvailableProps {
  className?: string;
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function UpdateAvailable({
  className,
  onUpdate,
  onDismiss,
}: UpdateAvailableProps) {
  const { hasUpdate, updateServiceWorker } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpdate = async () => {
    await updateServiceWorker();
    onUpdate?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!hasUpdate || isDismissed) return null;

  return (
    <Card className={cn('border-blue-500 bg-blue-50', className)} data-testid="update-available">
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
              aria-hidden="true"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Update Available</h3>
            <p className="text-sm text-muted-foreground">
              A new version is available. Refresh to update.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate} data-testid="update-button">
              Update
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              data-testid="dismiss-update"
            >
              Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Offline Indicator Component
interface OfflineIndicatorProps {
  className?: string;
  message?: string;
}

export function OfflineIndicator({
  className,
  message = 'You are currently offline. Some features may be limited.',
}: OfflineIndicatorProps) {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-amber-100 px-4 py-2 text-amber-800',
        className
      )}
      role="alert"
      data-testid="offline-indicator"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// Push Notification Toggle Component
interface NotificationToggleProps {
  className?: string;
  onSubscribe?: (subscription: PushSubscription) => void;
  onUnsubscribe?: () => void;
}

export function NotificationToggle({
  className,
  onSubscribe,
  onUnsubscribe,
}: NotificationToggleProps) {
  const {
    isSupported,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    isNotificationSubscribed,
  } = usePWA();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isNotificationSubscribed) {
        const success = await unsubscribeFromNotifications();
        if (success) {
          onUnsubscribe?.();
        }
      } else {
        const subscription = await subscribeToNotifications();
        if (subscription) {
          onSubscribe?.(subscription);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported || !('Notification' in window)) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-between', className)} data-testid="notification-toggle">
      <div>
        <h4 className="font-medium">Push Notifications</h4>
        <p className="text-sm text-muted-foreground">
          Get notified about deals and order updates
        </p>
      </div>
      <Button
        variant={isNotificationSubscribed ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        data-testid="notification-toggle-button"
        aria-pressed={isNotificationSubscribed}
      >
        {isLoading ? (
          'Loading...'
        ) : isNotificationSubscribed ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Enabled
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
              aria-hidden="true"
            >
              <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
              <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Enable
          </>
        )}
      </Button>
    </div>
  );
}

// Add to Home Screen Banner (iOS specific)
interface AddToHomeScreenBannerProps {
  className?: string;
  onDismiss?: () => void;
}

export function AddToHomeScreenBanner({
  className,
  onDismiss,
}: AddToHomeScreenBannerProps) {
  const { canInstall, } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(isIOSDevice);
    setIsInStandaloneMode(isStandalone);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
    // Store dismissal in localStorage
    localStorage.setItem('pwa-ios-banner-dismissed', 'true');
  };

  // Don't show if:
  // - Already dismissed
  // - Can install natively (Chrome, etc.)
  // - Not iOS
  // - Already in standalone mode
  // - Previously dismissed (localStorage)
  if (
    isDismissed ||
    canInstall ||
    !isIOS ||
    isInStandaloneMode ||
    localStorage.getItem('pwa-ios-banner-dismissed') === 'true'
  ) {
    return null;
  }

  return (
    <Card className={cn('border-blue-200 bg-blue-50', className)} data-testid="ios-install-banner">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Add to Home Screen</h3>
            <p className="text-sm text-blue-700 mt-1">
              Tap{' '}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block"
                aria-label="Share icon"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>{' '}
              then &quot;Add to Home Screen&quot; for the best experience.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600"
            onClick={handleDismiss}
            data-testid="dismiss-ios-banner"
          >
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// PWA Settings Panel
interface PWASettingsPanelProps {
  className?: string;
}

export function PWASettingsPanel({ className }: PWASettingsPanelProps) {
  const {
    isSupported,
    isRegistered,
    canInstall,
    hasUpdate,
    isOffline,
    } = usePWA();

  return (
    <Card className={className} data-testid="pwa-settings-panel">
      <CardHeader>
        <CardTitle className="text-lg">App Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Service Worker</span>
            <span
              className={cn(
                'text-xs px-2 py-1 rounded',
                isSupported && isRegistered
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              )}
              data-testid="sw-status"
            >
              {isSupported ? (isRegistered ? 'Active' : 'Not registered') : 'Not supported'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection</span>
            <span
              className={cn(
                'text-xs px-2 py-1 rounded',
                isOffline ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
              )}
              data-testid="connection-status"
            >
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>

        {/* Install prompt */}
        {canInstall && (
          <InstallPrompt className="mt-4" />
        )}

        {/* Update available */}
        {hasUpdate && (
          <UpdateAvailable className="mt-4" />
        )}

        {/* Notification toggle */}
        <div className="pt-4 border-t">
          <NotificationToggle />
        </div>
      </CardContent>
    </Card>
  );
}

export default PWAProvider;
