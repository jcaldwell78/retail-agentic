/**
 * Application configuration from environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },

  // Application
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Retail Store',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Your online shopping destination',
    env: import.meta.env.VITE_ENV || 'development',
  },

  // Multi-tenant
  tenant: {
    id: import.meta.env.VITE_TENANT_ID || 'demo-store',
    baseDomain: import.meta.env.VITE_BASE_DOMAIN || 'localhost:3000',
  },

  // Feature Flags
  features: {
    reviews: import.meta.env.VITE_ENABLE_REVIEWS === 'true',
    wishlist: import.meta.env.VITE_ENABLE_WISHLIST === 'true',
    socialShare: import.meta.env.VITE_ENABLE_SOCIAL_SHARE === 'true',
  },

  // Analytics
  analytics: {
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    gtmId: import.meta.env.VITE_GTM_ID,
  },

  // Payment
  payment: {
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  },

  // OAuth2
  oauth2: {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
  },

  // Development helpers
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export default config;
