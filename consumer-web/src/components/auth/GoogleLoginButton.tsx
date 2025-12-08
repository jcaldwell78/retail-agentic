import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from './AuthProvider';
import config from '@/lib/config';

interface GoogleLoginButtonProps {
  /** Callback function after successful login */
  onSuccess?: () => void;
  /** Callback function on login error */
  onError?: (error: Error) => void;
  /** Text to display on the button */
  text?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: (callback?: (notification: PromptNotification) => void) => void;
          renderButton: (element: HTMLElement, config: ButtonConfig) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback: (response: RevokeResponse) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
        };
      };
    };
  }
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

interface ButtonConfig {
  type: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
}

interface RevokeResponse {
  successful: boolean;
  error: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: ErrorResponse) => void;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ErrorResponse {
  type: string;
  message: string;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

/**
 * Google OAuth2 Login Button
 * Uses Google Identity Services for authentication
 */
export function GoogleLoginButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  disabled = false,
  className = '',
}: GoogleLoginButtonProps) {
  const { oauth2Login, loading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<TokenClient | null>(null);

  const clientId = config.oauth2.googleClientId;

  // Load Google Identity Services script
  useEffect(() => {
    if (!clientId) {
      console.warn('Google OAuth Client ID not configured');
      return;
    }

    // Check if script is already loaded
    if (window.google?.accounts) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      onError?.(new Error('Failed to load Google authentication'));
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [clientId, onError]);

  // Initialize token client when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts || !clientId) return;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (response: TokenResponse) => {
        if (response.access_token) {
          try {
            await oauth2Login({
              provider: 'GOOGLE',
              accessToken: response.access_token,
            });
            setIsLoading(false);
            onSuccess?.();
          } catch (error) {
            setIsLoading(false);
            const err = error instanceof Error ? error : new Error('Google login failed');
            onError?.(err);
          }
        }
      },
      error_callback: (error: ErrorResponse) => {
        setIsLoading(false);
        onError?.(new Error(error.message || 'Google authentication failed'));
      },
    });

    setTokenClient(client);
  }, [scriptLoaded, clientId, oauth2Login, onSuccess, onError]);

  const handleGoogleLogin = useCallback(() => {
    if (!tokenClient) {
      onError?.(new Error('Google authentication not initialized'));
      return;
    }

    setIsLoading(true);
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }, [tokenClient, onError]);

  const isDisabled = disabled || loading || isLoading || !scriptLoaded || !clientId;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleLogin}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      aria-label={text}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{isLoading ? 'Signing in...' : text}</span>
    </Button>
  );
}

export default GoogleLoginButton;
