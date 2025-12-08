import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useAuthContext } from './AuthProvider';

// Mock the AuthProvider
vi.mock('./AuthProvider', () => ({
  useAuthContext: vi.fn(),
}));

// Mock the config module
vi.mock('@/lib/config', () => ({
  default: {
    oauth2: {
      googleClientId: 'test-google-client-id-123',
    },
  },
}));

describe('GoogleLoginButton', () => {
  const mockOAuth2Login = vi.fn();
  let mockRequestAccessToken: Mock;
  let capturedCallback: ((response: { access_token: string }) => void) | null = null;
  let capturedErrorCallback: ((error: { type: string; message: string }) => void) | null = null;

  const setupGoogleMock = () => {
    mockRequestAccessToken = vi.fn();
    capturedCallback = null;
    capturedErrorCallback = null;

    const googleMock = {
      accounts: {
        id: {
          initialize: vi.fn(),
          prompt: vi.fn(),
          renderButton: vi.fn(),
          disableAutoSelect: vi.fn(),
          revoke: vi.fn(),
        },
        oauth2: {
          initTokenClient: vi.fn().mockImplementation((config: {
            callback: (response: { access_token: string }) => void;
            error_callback?: (error: { type: string; message: string }) => void;
          }) => {
            capturedCallback = config.callback;
            capturedErrorCallback = config.error_callback || null;
            return {
              requestAccessToken: mockRequestAccessToken,
            };
          }),
        },
      },
    };

    Object.defineProperty(window, 'google', {
      value: googleMock,
      writable: true,
      configurable: true,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthContext as Mock).mockReturnValue({
      oauth2Login: mockOAuth2Login,
      loading: false,
    });

    setupGoogleMock();
  });

  afterEach(() => {
    Object.defineProperty(window, 'google', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should render the button with default text', () => {
      render(<GoogleLoginButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(<GoogleLoginButton text="Sign in with Google" />);

      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should render Google icon', () => {
      render(<GoogleLoginButton />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<GoogleLoginButton className="custom-class" />);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should have proper aria-label', () => {
      render(<GoogleLoginButton text="Sign in with Google" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sign in with Google');
    });
  });

  describe('Disabled states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<GoogleLoginButton disabled={true} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when auth is loading', () => {
      (useAuthContext as Mock).mockReturnValue({
        oauth2Login: mockOAuth2Login,
        loading: true,
      });

      render(<GoogleLoginButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be enabled when properly configured', async () => {
      render(<GoogleLoginButton />);

      // Wait for script to be considered loaded (Google mock is set up)
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });
    });
  });

  describe('Click handling', () => {
    it('should request access token when clicked', async () => {
      render(<GoogleLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' });
    });

    it('should show loading state when clicked', async () => {
      render(<GoogleLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });

  describe('Success flow', () => {
    it('should call oauth2Login with correct parameters on success', async () => {
      mockOAuth2Login.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
      });

      const onSuccess = vi.fn();
      render(<GoogleLoginButton onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      // Simulate Google callback
      await act(async () => {
        capturedCallback?.({ access_token: 'test-access-token-xyz' });
      });

      await waitFor(() => {
        expect(mockOAuth2Login).toHaveBeenCalledWith({
          provider: 'GOOGLE',
          accessToken: 'test-access-token-xyz',
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should reset loading state after successful login', async () => {
      mockOAuth2Login.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
      });

      render(<GoogleLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedCallback?.({ access_token: 'test-token' });
      });

      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should call onError when oauth2Login fails', async () => {
      mockOAuth2Login.mockRejectedValueOnce(new Error('Authentication failed'));

      const onError = vi.fn();
      render(<GoogleLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedCallback?.({ access_token: 'test-token' });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should call onError when Google API returns error', async () => {
      const onError = vi.fn();
      render(<GoogleLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      // Simulate Google error callback
      await act(async () => {
        capturedErrorCallback?.({ type: 'popup_closed', message: 'User cancelled' });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should reset loading state after error', async () => {
      mockOAuth2Login.mockRejectedValueOnce(new Error('Failed'));

      const onError = vi.fn();
      render(<GoogleLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedCallback?.({ access_token: 'test-token' });
      });

      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have type="button" to prevent form submission', () => {
      render(<GoogleLoginButton />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should hide icon from screen readers', () => {
      render(<GoogleLoginButton />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should show loading spinner with proper styling', async () => {
      render(<GoogleLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Token client initialization', () => {
    it('should initialize token client with correct parameters', async () => {
      render(<GoogleLoginButton />);

      await waitFor(() => {
        const google = window.google;
        expect(google?.accounts.oauth2.initTokenClient).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 'test-google-client-id-123',
            scope: 'openid email profile',
          })
        );
      });
    });
  });
});
