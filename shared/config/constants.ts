/**
 * Application-wide constants
 */

// API Configuration
export const API_VERSION = 'v1';
export const API_BASE_PATH = '/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Product
export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_NAME_LENGTH = 200;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 5000;

// Cart
export const CART_EXPIRATION_DAYS = 30;
export const MAX_CART_ITEMS = 100;

// User
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_ADDRESSES_PER_USER = 10;

// Order
export const ORDER_NUMBER_PREFIX = 'ORD';
export const MAX_ORDER_NOTES_LENGTH = 1000;

// Search
export const SEARCH_RESULTS_PER_PAGE = 24;
export const MAX_SEARCH_QUERY_LENGTH = 200;
export const SEARCH_DEBOUNCE_MS = 300;

// File Upload
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// UI
export const TOAST_DURATION_MS = 5000;
export const ANIMATION_DURATION_MS = 300;

// Multi-tenancy
export const TENANT_HEADER_NAME = 'X-Tenant-ID';
export const DEFAULT_TENANT_ID = 'demo-store';

// Currency
export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

// Localization
export const DEFAULT_LOCALE = 'en-US';
export const SUPPORTED_LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES'];
