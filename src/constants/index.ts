// Application constants following industry best practices

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000'),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Authentication Constants
export const AUTH_CONFIG = {
  TOKEN_KEY: 'admin_token',
  STORAGE_KEY: 'auth-storage',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  LOADING_DELAY: 200,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 10,
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  ORDERS: '/orders',
  IMAGES: '/images',
  STORES: '/stores',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/admin-login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/api/admin/profile',
  },
  USERS: {
    LIST: '/api/admin/users',
    DETAILS: (id: string) => `/api/admin/users/${id}`,
    UPDATE_STATUS: (id: string) => `/api/admin/users/${id}/status`,
    CREATE_ADMIN: '/api/admin/create-admin',
  },
  ORDERS: {
    LIST: '/api/orders',
    DETAILS: (id: string) => `/api/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/api/orders/${id}/status`,
    UPDATE_PRICE: (id: string) => `/api/orders/${id}/price`,
    SEND_MESSAGE: (id: string) => `/api/orders/${id}/message`,
  },
  IMAGES: {
    LIST: '/api/admin/store-images',
    UPLOAD: '/api/admin/store-images',
    UPDATE: (id: string) => `/api/admin/store-images/${id}`,
    DELETE: (id: string) => `/api/admin/store-images/${id}`,
    PUBLIC: '/api/store-images',
  },
  STORES: {
    LIST: '/api/stores',
    MY_STORES: '/api/stores/my-stores',
    DETAILS: (id: string) => `/api/stores/${id}`,
  },
  DASHBOARD: {
    STATS: '/api/admin/dashboard/stats',
  },
  HEALTH: '/health',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Welcome to BM Admin.',
  LOGOUT_SUCCESS: 'Logged out successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  ORDER_UPDATED: 'Order updated successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully',
  IMAGE_DELETED: 'Image deleted successfully',
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Order Status Labels (for display)
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparing',
  [ORDER_STATUS.READY]: 'Ready',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
} as const;

// Form Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^\+?[\d\s-()]+$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  FIELD_NAMES: ['image', 'file', 'photo', 'upload'], // Possible field names expected by backend
  PRIMARY_FIELD_NAME: 'image', // Primary field name to try first
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: AUTH_CONFIG.TOKEN_KEY,
  AUTH_STATE: AUTH_CONFIG.STORAGE_KEY,
  USER_PREFERENCES: 'user-preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Environment
export const ENV = {
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  NODE_ENV: import.meta.env.MODE,
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

// Default Values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: UI_CONFIG.PAGINATION_LIMIT,
  },
  USER_FILTERS: {
    page: 1,
    limit: UI_CONFIG.PAGINATION_LIMIT,
  },
  ORDER_FILTERS: {
    page: 1,
    limit: UI_CONFIG.PAGINATION_LIMIT,
  },
} as const;
