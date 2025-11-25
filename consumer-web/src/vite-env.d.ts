/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_VERSION: string;
  readonly VITE_TENANT_ID?: string;
  readonly VITE_TENANT_MODE?: string;
  readonly VITE_DOMAIN?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_ENABLE_FEATURE_FLAGS?: string;
  readonly VITE_ENABLE_PRODUCT_REVIEWS?: string;
  readonly VITE_ENABLE_WISHLIST?: string;
  readonly VITE_MAX_CART_ITEMS?: string;
  readonly VITE_SESSION_TIMEOUT?: string;
  readonly VITE_ENABLE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
