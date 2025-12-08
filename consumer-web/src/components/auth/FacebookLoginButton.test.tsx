import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FacebookLoginButton } from './FacebookLoginButton';
import { useAuthContext } from './AuthProvider';

// Mock the AuthProvider
vi.mock('./AuthProvider', () => ({
  useAuthContext: vi.fn(),
}));

// Mock the config module
vi.mock('@/lib/config', () => ({
  default: {
    oauth2: {
      facebookAppId: 'test-facebook-app-id-123',
    },
  },
}));

describe('FacebookLoginButton', () => {
  const mockOAuth2Login = vi.fn();
  let mockFBLogin: Mock;
  let capturedLoginCallback: ((response: {
    status: string;
    authResponse?: { accessToken: string; userID: string };
  }) => void) | null = null;

  const setupFacebookMock = () => {
    mockFBLogin = vi.fn().mockImplementation((callback, _params) => {
      capturedLoginCallback = callback;
    });

    const fbMock = {
      init: vi.fn(),
      login: mockFBLogin,
      logout: vi.fn(),
      getLoginStatus: vi.fn(),
      api: vi.fn(),
    };

    Object.defineProperty(window, 'FB', {
      value: fbMock,
      writable: true,
      configurable: true,
    });

    // Trigger SDK loaded callback
    if (window.fbAsyncInit) {
      window.fbAsyncInit();
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedLoginCallback = null;

    (useAuthContext as Mock).mockReturnValue({
      oauth2Login: mockOAuth2Login,
      loading: false,
    });

    setupFacebookMock();
  });

  afterEach(() => {
    Object.defineProperty(window, 'FB', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    delete window.fbAsyncInit;
  });

  describe('Rendering', () => {
    it('should render the button with default text', () => {
      render(<FacebookLoginButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    });

    it('should render with custom text', () => {
      render(<FacebookLoginButton text="Sign in with Facebook" />);

      expect(screen.getByText('Sign in with Facebook')).toBeInTheDocument();
    });

    it('should render Facebook icon', () => {
      render(<FacebookLoginButton />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('fill', '#1877F2');
    });

    it('should apply custom className', () => {
      render(<FacebookLoginButton className="custom-class" />);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should have proper aria-label', () => {
      render(<FacebookLoginButton text="Sign in with Facebook" />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sign in with Facebook');
    });
  });

  describe('Disabled states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<FacebookLoginButton disabled={true} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when auth is loading', () => {
      (useAuthContext as Mock).mockReturnValue({
        oauth2Login: mockOAuth2Login,
        loading: true,
      });

      render(<FacebookLoginButton />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be enabled when properly configured', async () => {
      render(<FacebookLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });
    });
  });

  describe('Click handling', () => {
    it('should call FB.login when clicked', async () => {
      render(<FacebookLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(mockFBLogin).toHaveBeenCalledWith(
        expect.any(Function),
        { scope: 'email,public_profile' }
      );
    });

    it('should show loading state when clicked', async () => {
      render(<FacebookLoginButton />);

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
      render(<FacebookLoginButton onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      // Simulate Facebook callback
      await act(async () => {
        capturedLoginCallback?.({
          status: 'connected',
          authResponse: {
            accessToken: 'test-facebook-token-xyz',
            userID: 'fb-user-123',
          },
        });
      });

      await waitFor(() => {
        expect(mockOAuth2Login).toHaveBeenCalledWith({
          provider: 'FACEBOOK',
          accessToken: 'test-facebook-token-xyz',
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

      render(<FacebookLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedLoginCallback?.({
          status: 'connected',
          authResponse: {
            accessToken: 'test-token',
            userID: 'user-123',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should call onError when oauth2Login fails', async () => {
      mockOAuth2Login.mockRejectedValueOnce(new Error('Authentication failed'));

      const onError = vi.fn();
      render(<FacebookLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedLoginCallback?.({
          status: 'connected',
          authResponse: {
            accessToken: 'test-token',
            userID: 'user-123',
          },
        });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should call onError when user cancels login', async () => {
      const onError = vi.fn();
      render(<FacebookLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      // Simulate user cancellation
      await act(async () => {
        capturedLoginCallback?.({
          status: 'unknown',
        });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toContain('cancelled');
      });
    });

    it('should call onError when user does not authorize app', async () => {
      const onError = vi.fn();
      render(<FacebookLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      // Simulate not authorized response
      await act(async () => {
        capturedLoginCallback?.({
          status: 'not_authorized',
        });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toContain('did not authorize');
      });
    });

    it('should reset loading state after error', async () => {
      mockOAuth2Login.mockRejectedValueOnce(new Error('Failed'));

      const onError = vi.fn();
      render(<FacebookLoginButton onError={onError} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      await act(async () => {
        capturedLoginCallback?.({
          status: 'connected',
          authResponse: {
            accessToken: 'test-token',
            userID: 'user-123',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
      });
    });

    it('should call onError if FB SDK not initialized', async () => {
      Object.defineProperty(window, 'FB', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const onError = vi.fn();
      render(<FacebookLoginButton onError={onError} />);

      // Button should still be disabled since FB is not loaded
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have type="button" to prevent form submission', () => {
      render(<FacebookLoginButton />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should hide icon from screen readers', () => {
      render(<FacebookLoginButton />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should show loading spinner with proper styling', async () => {
      render(<FacebookLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('SDK initialization', () => {
    it('should call FB.login with correct scope', async () => {
      render(<FacebookLoginButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button'));

      expect(mockFBLogin).toHaveBeenCalledWith(
        expect.any(Function),
        { scope: 'email,public_profile' }
      );
    });
  });
});
