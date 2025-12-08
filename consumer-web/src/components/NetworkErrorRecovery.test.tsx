import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NetworkProvider,
  useNetwork,
  useOnlineStatus,
  useRetry,
  OfflineBanner,
  RetryButton,
  ErrorStateWithRetry,
  NetworkErrorBoundary,
  OfflineContent,
  PendingRequests,
  ConnectionStatus,
  NetworkRecoveryContainer,
} from './NetworkErrorRecovery';

// Mock navigator.onLine
let mockOnLine = true;

Object.defineProperty(navigator, 'onLine', {
  get: () => mockOnLine,
  configurable: true,
});

// Helper to dispatch online/offline events
function goOnline() {
  mockOnLine = true;
  window.dispatchEvent(new Event('online'));
}

function goOffline() {
  mockOnLine = false;
  window.dispatchEvent(new Event('offline'));
}

// Test component for useNetwork hook
function TestNetworkConsumer() {
  const { state, isOnline, addFailedRequest, clearFailedRequests } = useNetwork();

  const handleAddRequest = () => {
    addFailedRequest({
      url: '/api/test',
      method: 'GET',
      lastError: 'Network error',
      retry: async () => {},
    });
  };

  return (
    <div>
      <span data-testid="is-online">{isOnline.toString()}</span>
      <span data-testid="status">{state.status}</span>
      <span data-testid="failed-count">{state.failedRequests.length}</span>
      <button data-testid="add-request" onClick={handleAddRequest}>
        Add Request
      </button>
      <button data-testid="clear-requests" onClick={clearFailedRequests}>
        Clear
      </button>
    </div>
  );
}

// Test component for useOnlineStatus hook
function TestOnlineStatusConsumer() {
  const isOnline = useOnlineStatus();
  return <span data-testid="online-status">{isOnline.toString()}</span>;
}

// Test component for useRetry hook
function TestRetryConsumer({
  fn,
  config,
}: {
  fn: () => Promise<string>;
  config?: { maxRetries?: number; baseDelay?: number };
}) {
  const { execute, isRetrying, retryCount, error, data, reset } = useRetry(fn, config);

  return (
    <div>
      <span data-testid="is-retrying">{isRetrying.toString()}</span>
      <span data-testid="retry-count">{retryCount}</span>
      <span data-testid="error">{error?.message || 'none'}</span>
      <span data-testid="data">{data || 'none'}</span>
      <button data-testid="execute" onClick={() => execute().catch(() => {})}>
        Execute
      </button>
      <button data-testid="reset" onClick={reset}>
        Reset
      </button>
    </div>
  );
}

describe('NetworkProvider', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should provide default context values', () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
      </NetworkProvider>
    );

    expect(screen.getByTestId('is-online')).toHaveTextContent('true');
    expect(screen.getByTestId('status')).toHaveTextContent('online');
    expect(screen.getByTestId('failed-count')).toHaveTextContent('0');
  });

  it('should update status when going offline', () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
      </NetworkProvider>
    );

    act(() => {
      goOffline();
    });

    expect(screen.getByTestId('is-online')).toHaveTextContent('false');
    expect(screen.getByTestId('status')).toHaveTextContent('offline');
  });

  it('should update status when coming online', () => {
    mockOnLine = false;
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
      </NetworkProvider>
    );

    expect(screen.getByTestId('is-online')).toHaveTextContent('false');

    act(() => {
      goOnline();
    });

    expect(screen.getByTestId('is-online')).toHaveTextContent('true');
  });

  it('should add failed requests', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));

    expect(screen.getByTestId('failed-count')).toHaveTextContent('1');
  });

  it('should clear failed requests', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));
    expect(screen.getByTestId('failed-count')).toHaveTextContent('1');

    await userEvent.click(screen.getByTestId('clear-requests'));
    expect(screen.getByTestId('failed-count')).toHaveTextContent('0');
  });
});

describe('useNetwork', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestNetworkConsumer />);
    }).toThrow('useNetwork must be used within a NetworkProvider');

    consoleError.mockRestore();
  });
});

describe('useOnlineStatus', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should return initial online status', () => {
    render(<TestOnlineStatusConsumer />);

    expect(screen.getByTestId('online-status')).toHaveTextContent('true');
  });

  it('should update when going offline', () => {
    render(<TestOnlineStatusConsumer />);

    act(() => {
      goOffline();
    });

    expect(screen.getByTestId('online-status')).toHaveTextContent('false');
  });

  it('should update when coming online', () => {
    mockOnLine = false;
    render(<TestOnlineStatusConsumer />);

    act(() => {
      goOnline();
    });

    expect(screen.getByTestId('online-status')).toHaveTextContent('true');
  });
});

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute function successfully', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    render(<TestRetryConsumer fn={fn} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('execute'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('data')).toHaveTextContent('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    render(<TestRetryConsumer fn={fn} config={{ baseDelay: 100 }} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('execute'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('data')).toHaveTextContent('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    render(<TestRetryConsumer fn={fn} config={{ maxRetries: 2, baseDelay: 100 }} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('execute'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('fail');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should reset state', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    render(<TestRetryConsumer fn={fn} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('execute'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('data')).toHaveTextContent('success');

    // Use fireEvent instead of userEvent which has issues with fake timers
    await act(async () => {
      fireEvent.click(screen.getByTestId('reset'));
    });

    expect(screen.getByTestId('data')).toHaveTextContent('none');
  });
});

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should not render when online', () => {
    render(<OfflineBanner />);

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('should render when offline', () => {
    mockOnLine = false;
    render(<OfflineBanner />);

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    expect(screen.getByTestId('offline-message')).toBeInTheDocument();
  });

  it('should show custom offline message', () => {
    mockOnLine = false;
    render(<OfflineBanner offlineMessage="No internet" />);

    expect(screen.getByText('No internet')).toBeInTheDocument();
  });

  it('should have role="alert"', () => {
    mockOnLine = false;
    render(<OfflineBanner />);

    expect(screen.getByTestId('offline-banner')).toHaveAttribute('role', 'alert');
  });

  it('should show online message when coming back online', async () => {
    mockOnLine = false;
    render(<OfflineBanner showWhenOnline />);

    expect(screen.getByTestId('offline-message')).toBeInTheDocument();

    act(() => {
      goOnline();
    });

    await waitFor(() => {
      expect(screen.getByTestId('online-message')).toBeInTheDocument();
    });
  });
});

describe('RetryButton', () => {
  it('should render retry button', () => {
    render(<RetryButton onRetry={vi.fn()} />);

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);

    await userEvent.click(screen.getByTestId('retry-button'));

    expect(onRetry).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<RetryButton onRetry={vi.fn()} isRetrying={true} />);

    expect(screen.getByText('Retrying...')).toBeInTheDocument();
  });

  it('should show retry count', () => {
    render(<RetryButton onRetry={vi.fn()} retryCount={2} maxRetries={3} />);

    expect(screen.getByTestId('retry-count')).toHaveTextContent('(2/3)');
  });

  it('should be disabled at max retries', () => {
    render(<RetryButton onRetry={vi.fn()} retryCount={3} maxRetries={3} />);

    expect(screen.getByTestId('retry-button')).toBeDisabled();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<RetryButton onRetry={vi.fn()} size="sm" />);
    expect(screen.getByTestId('retry-button')).toHaveClass('px-2', 'py-1');

    rerender(<RetryButton onRetry={vi.fn()} size="lg" />);
    expect(screen.getByTestId('retry-button')).toHaveClass('px-6', 'py-3');
  });

  it('should render different variants', () => {
    const { rerender } = render(<RetryButton onRetry={vi.fn()} variant="default" />);
    expect(screen.getByTestId('retry-button')).toHaveClass('bg-blue-600');

    rerender(<RetryButton onRetry={vi.fn()} variant="outline" />);
    expect(screen.getByTestId('retry-button')).toHaveClass('border');
  });
});

describe('ErrorStateWithRetry', () => {
  it('should render error state', () => {
    render(
      <ErrorStateWithRetry error="Something went wrong" onRetry={vi.fn()} />
    );

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByTestId('error-title')).toHaveTextContent('Something went wrong');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Something went wrong');
  });

  it('should render custom title', () => {
    render(
      <ErrorStateWithRetry
        error="Error message"
        title="Custom Title"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('error-title')).toHaveTextContent('Custom Title');
  });

  it('should render Error object message', () => {
    render(
      <ErrorStateWithRetry error={new Error('Error from object')} onRetry={vi.fn()} />
    );

    expect(screen.getByTestId('error-message')).toHaveTextContent('Error from object');
  });

  it('should show max retries message', () => {
    render(
      <ErrorStateWithRetry
        error="Error"
        onRetry={vi.fn()}
        retryCount={3}
        maxRetries={3}
      />
    );

    expect(screen.getByTestId('max-retries-message')).toBeInTheDocument();
    expect(screen.getByText(/Maximum retries reached/)).toBeInTheDocument();
  });

  it('should have role="alert"', () => {
    render(<ErrorStateWithRetry error="Error" onRetry={vi.fn()} />);

    expect(screen.getByTestId('error-state')).toHaveAttribute('role', 'alert');
  });

  it('should include retry button', () => {
    render(<ErrorStateWithRetry error="Error" onRetry={vi.fn()} />);

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });
});

describe('NetworkErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <NetworkErrorBoundary>
        <div data-testid="child">Content</div>
      </NetworkErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render fallback on error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NetworkErrorBoundary fallback={<div data-testid="fallback">Fallback</div>}>
        <ThrowError />
      </NetworkErrorBoundary>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should render default error state when no fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NetworkErrorBoundary>
        <ThrowError />
      </NetworkErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-state')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should call onError when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NetworkErrorBoundary onError={onError}>
        <ThrowError />
      </NetworkErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe('OfflineContent', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should render children when online', () => {
    render(
      <OfflineContent>
        <div data-testid="child">Content</div>
      </OfflineContent>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render offline state when offline', () => {
    mockOnLine = false;
    render(
      <OfflineContent>
        <div data-testid="child">Content</div>
      </OfflineContent>
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('offline-content')).toBeInTheDocument();
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('should render custom fallback when offline', () => {
    mockOnLine = false;
    render(
      <OfflineContent fallback={<div data-testid="custom-fallback">Custom</div>}>
        <div data-testid="child">Content</div>
      </OfflineContent>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('offline-content')).not.toBeInTheDocument();
  });
});

describe('PendingRequests', () => {
  it('should not render when no failed requests', () => {
    render(
      <NetworkProvider>
        <PendingRequests />
      </NetworkProvider>
    );

    expect(screen.queryByTestId('pending-requests')).not.toBeInTheDocument();
  });

  it('should render when there are failed requests', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
        <PendingRequests />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));

    expect(screen.getByTestId('pending-requests')).toBeInTheDocument();
    expect(screen.getByText('Failed Requests (1)')).toBeInTheDocument();
  });

  it('should clear all requests when clear button clicked', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
        <PendingRequests />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));
    expect(screen.getByTestId('pending-requests')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('clear-all-btn'));

    expect(screen.queryByTestId('pending-requests')).not.toBeInTheDocument();
  });

  it('should have retry all button', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
        <PendingRequests />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));

    expect(screen.getByTestId('retry-all-btn')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should show online status', () => {
    render(<ConnectionStatus />);

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toHaveClass('bg-green-500');
  });

  it('should show offline status', () => {
    mockOnLine = false;
    render(<ConnectionStatus />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toHaveClass('bg-red-500');
  });

  it('should hide text when showText is false', () => {
    render(<ConnectionStatus showText={false} />);

    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();
  });
});

describe('NetworkRecoveryContainer', () => {
  beforeEach(() => {
    mockOnLine = true;
  });

  it('should render children', () => {
    render(
      <NetworkRecoveryContainer>
        <div data-testid="child">Content</div>
      </NetworkRecoveryContainer>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render offline banner when offline', () => {
    mockOnLine = false;
    render(
      <NetworkRecoveryContainer>
        <div data-testid="child">Content</div>
      </NetworkRecoveryContainer>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
  });

  it('should not render offline banner when disabled', () => {
    mockOnLine = false;
    render(
      <NetworkRecoveryContainer showOfflineBanner={false}>
        <div data-testid="child">Content</div>
      </NetworkRecoveryContainer>
    );

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('OfflineBanner should have role="alert"', () => {
    mockOnLine = false;
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('ErrorStateWithRetry should have role="alert"', () => {
    render(<ErrorStateWithRetry error="Error" onRetry={vi.fn()} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('PendingRequests should have clear button with aria-label', async () => {
    render(
      <NetworkProvider>
        <TestNetworkConsumer />
        <PendingRequests />
      </NetworkProvider>
    );

    await userEvent.click(screen.getByTestId('add-request'));

    expect(screen.getByLabelText('Clear all')).toBeInTheDocument();
  });
});
