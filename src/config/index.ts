// Application configuration following industry best practices
import { API_CONFIG, AUTH_CONFIG, UI_CONFIG } from '@constants';

// Environment-specific configuration
export const config = {
  app: {
    name: 'BM Admin Panel',
    version: '1.0.0',
    description: 'Admin dashboard for BM E-commerce platform',
  },
  
  api: {
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: API_CONFIG.RETRY_DELAY,
  },
  
  auth: {
    tokenKey: AUTH_CONFIG.TOKEN_KEY,
    storageKey: AUTH_CONFIG.STORAGE_KEY,
    sessionTimeout: AUTH_CONFIG.SESSION_TIMEOUT,
    refreshThreshold: AUTH_CONFIG.REFRESH_THRESHOLD,
  },
  
  ui: {
    toastDuration: UI_CONFIG.TOAST_DURATION,
    loadingDelay: UI_CONFIG.LOADING_DELAY,
    debounceDelay: UI_CONFIG.DEBOUNCE_DELAY,
    paginationLimit: UI_CONFIG.PAGINATION_LIMIT,
  },
  
  features: {
    enableLogging: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    enableDevtools: import.meta.env.VITE_ENABLE_REACT_QUERY_DEVTOOLS === 'true',
    enableErrorBoundary: import.meta.env.VITE_ENABLE_ERROR_BOUNDARY === 'true',
    logApiCalls: import.meta.env.VITE_LOG_API_CALLS === 'true',
  },
  
  environment: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  },
} as const;

export default config;
