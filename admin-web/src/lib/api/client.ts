import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '@/lib/config';

/**
 * API client configuration
 */
const API_BASE_URL = config.api.baseUrl;
const API_TIMEOUT = config.api.timeout;

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Initial delay in ms
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Status codes to retry

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * - Add authentication token
 * - Add tenant ID
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID if available
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handle common errors
 * - Extract data from response
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access denied');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found');
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Retry wrapper with exponential backoff
 */
async function retryRequest<T>(
  config: AxiosRequestConfig,
  retryCount = 0
): Promise<AxiosResponse<T>> {
  try {
    return await apiClient.request<T>(config);
  } catch (error) {
    const axiosError = error as AxiosError;

    // Check if we should retry
    const shouldRetry =
      retryCount < MAX_RETRIES &&
      axiosError.response &&
      RETRY_STATUS_CODES.includes(axiosError.response.status);

    if (!shouldRetry) {
      throw error;
    }

    // Calculate exponential backoff delay
    const delay = RETRY_DELAY * Math.pow(2, retryCount);

    console.warn(
      `Request failed (${axiosError.response?.status}), retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
    );

    // Wait before retrying
    await sleep(delay);

    // Retry the request
    return retryRequest<T>(config, retryCount + 1);
  }
}

/**
 * Generic API request function with type safety and retry logic
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await retryRequest<T>(config);
  return response.data;
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

export default apiClient;
