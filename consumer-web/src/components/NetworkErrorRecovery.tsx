import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';
import {
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  CloudOff,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
export type NetworkStatus = 'online' | 'offline' | 'slow' | 'error';

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface NetworkState {
  status: NetworkStatus;
  isOnline: boolean;
  lastOnline: Date | null;
  failedRequests: FailedRequest[];
}

export interface FailedRequest {
  id: string;
  url: string;
  method: string;
  retryCount: number;
  lastError: string;
  timestamp: Date;
  retry: () => Promise<void>;
}

// Context
interface NetworkContextType {
  state: NetworkState;
  isOnline: boolean;
  addFailedRequest: (request: Omit<FailedRequest, 'id' | 'retryCount' | 'timestamp'>) => string;
  removeFailedRequest: (id: string) => void;
  retryRequest: (id: string) => Promise<void>;
  retryAllRequests: () => Promise<void>;
  clearFailedRequests: () => void;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkState>({
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnline: null,
    failedRequests: [],
  });

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        status: 'online',
        isOnline: true,
        lastOnline: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        status: 'offline',
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addFailedRequest = useCallback((request: Omit<FailedRequest, 'id' | 'retryCount' | 'timestamp'>) => {
    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRequest: FailedRequest = {
      ...request,
      id,
      retryCount: 0,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      failedRequests: [...prev.failedRequests, newRequest],
    }));

    return id;
  }, []);

  const removeFailedRequest = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      failedRequests: prev.failedRequests.filter((r) => r.id !== id),
    }));
  }, []);

  const retryRequest = useCallback(async (id: string) => {
    const request = state.failedRequests.find((r) => r.id === id);
    if (!request) return;

    try {
      await request.retry();
      removeFailedRequest(id);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        failedRequests: prev.failedRequests.map((r) =>
          r.id === id
            ? { ...r, retryCount: r.retryCount + 1, lastError: String(error) }
            : r
        ),
      }));
      throw error;
    }
  }, [state.failedRequests, removeFailedRequest]);

  const retryAllRequests = useCallback(async () => {
    const requests = [...state.failedRequests];
    for (const request of requests) {
      try {
        await retryRequest(request.id);
      } catch {
        // Continue with next request
      }
    }
  }, [state.failedRequests, retryRequest]);

  const clearFailedRequests = useCallback(() => {
    setState((prev) => ({
      ...prev,
      failedRequests: [],
    }));
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        state,
        isOnline: state.isOnline,
        addFailedRequest,
        removeFailedRequest,
        retryRequest,
        retryAllRequests,
        clearFailedRequests,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for retry with exponential backoff
export function useRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = config;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const calculateDelay = useCallback((attempt: number) => {
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [baseDelay, backoffMultiplier, maxDelay]);

  const execute = useCallback(async () => {
    setIsRetrying(true);
    setError(null);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        setData(result);
        setRetryCount(attempt);
        setIsRetrying(false);
        return result;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        setRetryCount(attempt);

        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    setError(lastError);
    setIsRetrying(false);
    throw lastError;
  }, [fn, maxRetries, calculateDelay]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
    setData(null);
  }, []);

  return { execute, isRetrying, retryCount, error, data, reset };
}

// Offline Banner Component
interface OfflineBannerProps {
  className?: string;
  showWhenOnline?: boolean;
  onlineMessage?: string;
  offlineMessage?: string;
}

export function OfflineBanner({
  className,
  showWhenOnline = false,
  onlineMessage = 'You are back online',
  offlineMessage = 'You are currently offline',
}: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current && showWhenOnline) {
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        wasOfflineRef.current = false;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showWhenOnline]);

  if (isOnline && !showOnlineMessage) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isOnline ? 'bg-green-500' : 'bg-yellow-500',
        className
      )}
      data-testid="offline-banner"
      role="alert"
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-white">
        {isOnline ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span data-testid="online-message">{onlineMessage}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span data-testid="offline-message">{offlineMessage}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Retry Button Component
interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function RetryButton({
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  size = 'md',
  variant = 'default',
  className,
}: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await onRetry();
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
  };

  const loading = isRetrying || isLoading;

  return (
    <button
      onClick={handleRetry}
      disabled={loading || retryCount >= maxRetries}
      className={cn(
        'inline-flex items-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      data-testid="retry-button"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {loading ? 'Retrying...' : 'Retry'}
      {retryCount > 0 && !loading && (
        <span className="text-xs opacity-70" data-testid="retry-count">
          ({retryCount}/{maxRetries})
        </span>
      )}
    </button>
  );
}

// Error State with Retry Component
interface ErrorStateWithRetryProps {
  error: Error | string;
  onRetry: () => Promise<void> | void;
  title?: string;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export function ErrorStateWithRetry({
  error,
  onRetry,
  title = 'Something went wrong',
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className,
}: ErrorStateWithRetryProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
      data-testid="error-state"
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="error-title">
        {title}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md" data-testid="error-message">
        {errorMessage}
      </p>
      <RetryButton
        onRetry={onRetry}
        isRetrying={isRetrying}
        retryCount={retryCount}
        maxRetries={maxRetries}
      />
      {retryCount >= maxRetries && (
        <p className="mt-4 text-sm text-gray-500" data-testid="max-retries-message">
          Maximum retries reached. Please try again later.
        </p>
      )}
    </div>
  );
}

// Network Error Boundary
interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class NetworkErrorBoundary extends React.Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div data-testid="error-boundary">
          <ErrorStateWithRetry
            error={this.state.error || 'An unexpected error occurred'}
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// Offline Content Component
interface OfflineContentProps {
  children: ReactNode;
  fallback?: ReactNode;
  showOfflineIndicator?: boolean;
}

export function OfflineContent({
  children,
  fallback,
  showOfflineIndicator = true,
}: OfflineContentProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center"
        data-testid="offline-content"
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <CloudOff className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          You're offline
        </h3>
        <p className="text-gray-600 max-w-md">
          This content requires an internet connection. Please check your
          connection and try again.
        </p>
      </div>
    );
  }

  return (
    <>
      {showOfflineIndicator && !isOnline && <OfflineBanner />}
      {children}
    </>
  );
}

// Pending Requests Queue Component
interface PendingRequestsProps {
  className?: string;
}

export function PendingRequests({ className }: PendingRequestsProps) {
  const { state, retryRequest, removeFailedRequest, retryAllRequests, clearFailedRequests } =
    useNetwork();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);

  if (state.failedRequests.length === 0) return null;

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await retryRequest(id);
    } catch {
      // Error handled in context
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      await retryAllRequests();
    } finally {
      setRetryingAll(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border p-4 z-50',
        className
      )}
      data-testid="pending-requests"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          Failed Requests ({state.failedRequests.length})
        </h4>
        <button
          onClick={clearFailedRequests}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Clear all"
          data-testid="clear-all-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {state.failedRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
            data-testid={`pending-request-${request.id}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {request.method} {new URL(request.url, 'http://localhost').pathname}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {request.lastError}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRetry(request.id)}
                disabled={retryingId === request.id}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                aria-label="Retry request"
                data-testid={`retry-request-${request.id}`}
              >
                {retryingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => removeFailedRequest(request.id)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                aria-label="Remove request"
                data-testid={`remove-request-${request.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleRetryAll}
        disabled={retryingAll}
        className="w-full mt-3"
        data-testid="retry-all-btn"
      >
        {retryingAll ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry All
          </>
        )}
      </Button>
    </div>
  );
}

// Connection Status Indicator
interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({ className, showText = true }: ConnectionStatusProps) {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="connection-status"
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500'
        )}
        data-testid="status-indicator"
      />
      {showText && (
        <span className={cn('text-sm', isOnline ? 'text-green-600' : 'text-red-600')}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}

// Network Aware Fetch Hook
export function useNetworkAwareFetch<T>(
  url: string,
  options?: RequestInit & { retryConfig?: RetryConfig }
) {
  const isOnline = useOnlineStatus();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { retryConfig, ...fetchOptions } = options || {};

  const fetchFn = useCallback(async () => {
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }, [url, fetchOptions, isOnline]);

  const { execute, isRetrying, retryCount, reset } = useRetry(fetchFn, retryConfig);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await execute();
      setData(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [execute]);

  const refetch = useCallback(() => {
    reset();
    return fetch();
  }, [reset, fetch]);

  return { data, error, isLoading, isRetrying, retryCount, fetch, refetch, isOnline };
}

// Container component
interface NetworkRecoveryContainerProps {
  children: ReactNode;
  showOfflineBanner?: boolean;
  showPendingRequests?: boolean;
}

export function NetworkRecoveryContainer({
  children,
  showOfflineBanner = true,
  showPendingRequests = true,
}: NetworkRecoveryContainerProps) {
  return (
    <NetworkProvider>
      {showOfflineBanner && <OfflineBanner showWhenOnline />}
      {children}
      {showPendingRequests && <PendingRequests />}
    </NetworkProvider>
  );
}

export default NetworkRecoveryContainer;
