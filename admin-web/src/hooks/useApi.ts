import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api';

/**
 * Generic API hook state
 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Generic API hook
 * Provides state management for API calls with loading and error states
 */
export function useApi<T, Args extends unknown[] = []>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });

      try {
        const data = await apiFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = (err as AxiosError<ApiError>).response?.data || {
          error: 'Unknown Error',
          message: 'An unexpected error occurred',
          statusCode: 500,
        };
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for automatic API call on mount
 */
export function useApiOnMount<T>(
  apiFunction: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiFunction();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const error = (err as AxiosError<ApiError>).response?.data || {
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      };
      setState({ data: null, loading: false, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Call on mount and when dependencies change
  useState(() => {
    fetch();
  });

  return {
    ...state,
    refetch: fetch,
  };
}
