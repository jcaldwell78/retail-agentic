import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from './AuthProvider';
import config from '@/lib/config';

interface FacebookLoginButtonProps {
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
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

interface FacebookSDK {
  init: (params: FacebookInitParams) => void;
  login: (callback: (response: FacebookLoginResponse) => void, params?: FacebookLoginParams) => void;
  logout: (callback?: (response: unknown) => void) => void;
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
  api: (path: string, callback: (response: FacebookUserResponse) => void) => void;
}

interface FacebookInitParams {
  appId: string;
  cookie?: boolean;
  xfbml?: boolean;
  version: string;
}

interface FacebookLoginParams {
  scope?: string;
  return_scopes?: boolean;
}

interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
    data_access_expiration_time: number;
  };
}

interface FacebookUserResponse {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Facebook OAuth2 Login Button
 * Uses Facebook SDK for authentication
 */
export function FacebookLoginButton({
  onSuccess,
  onError,
  text = 'Continue with Facebook',
  disabled = false,
  className = '',
}: FacebookLoginButtonProps) {
  const { oauth2Login, loading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const appId = config.oauth2.facebookAppId;

  // Load Facebook SDK
  useEffect(() => {
    if (!appId) {
      console.warn('Facebook App ID not configured');
      return;
    }

    // Check if SDK is already loaded
    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    // Initialize FB SDK
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      setSdkLoaded(true);
    };

    // Load the SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Facebook SDK');
      onError?.(new Error('Failed to load Facebook authentication'));
    };

    // Only add if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);
    }

    return () => {
      // Cleanup is handled by keeping the script since FB SDK should persist
    };
  }, [appId, onError]);

  const handleFacebookLogin = useCallback(() => {
    if (!window.FB) {
      onError?.(new Error('Facebook authentication not initialized'));
      return;
    }

    setIsLoading(true);

    window.FB.login(
      async (response: FacebookLoginResponse) => {
        if (response.status === 'connected' && response.authResponse) {
          try {
            await oauth2Login({
              provider: 'FACEBOOK',
              accessToken: response.authResponse.accessToken,
            });
            setIsLoading(false);
            onSuccess?.();
          } catch (error) {
            setIsLoading(false);
            const err = error instanceof Error ? error : new Error('Facebook login failed');
            onError?.(err);
          }
        } else {
          setIsLoading(false);
          if (response.status === 'not_authorized') {
            onError?.(new Error('User did not authorize the app'));
          } else {
            onError?.(new Error('Facebook login was cancelled'));
          }
        }
      },
      { scope: 'email,public_profile' }
    );
  }, [oauth2Login, onSuccess, onError]);

  const isDisabled = disabled || loading || isLoading || !sdkLoaded || !appId;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleFacebookLogin}
      disabled={isDisabled}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      aria-label={text}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#1877F2]" />
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="#1877F2"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )}
      <span>{isLoading ? 'Signing in...' : text}</span>
    </Button>
  );
}

export default FacebookLoginButton;
