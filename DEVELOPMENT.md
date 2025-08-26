# BM Admin App - Development Guide

## 🏗️ Project Structure (Industry Best Practices)

This project has been restructured to follow industry-standard best practices for React TypeScript applications.

### 📁 Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (ErrorBoundary, HOCs)
│   ├── forms/           # Form-specific components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── ui/              # Basic UI components
├── pages/               # Page components (route components)
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── orders/         # Order management pages
│   ├── users/          # User management pages
│   └── images/         # Image management pages
├── hooks/               # Custom React hooks
├── services/           # API services and external integrations
├── store/              # State management (Zustand stores)
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
├── constants/          # Application constants and configuration
└── config/             # Environment and app configuration
```

## 🔧 Key Improvements Implemented

### 1. **Path Aliases & Absolute Imports**
```typescript
// Instead of: import { useApi } from '../../../hooks/useApi'
import { useApi } from '@hooks/useApi';
import { log } from '@utils/logger';
import { API_CONFIG } from '@constants';
```

**Configured aliases:**
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@pages/*` → `./src/pages/*`
- `@hooks/*` → `./src/hooks/*`
- `@services/*` → `./src/services/*`
- `@store/*` → `./src/store/*`
- `@utils/*` → `./src/utils/*`
- `@types/*` → `./src/types/*`
- `@constants` → `./src/constants/index`

### 2. **Comprehensive Logging System**

#### **Logger Features:**
- **Environment-aware**: Only logs in development by default
- **Structured logging**: Categorized by type (API, Auth, UI, etc.)
- **Performance monitoring**: Built-in timing utilities
- **Type-safe**: Full TypeScript support
- **Extensible**: Easy to add remote logging services

#### **Usage Examples:**
```typescript
import { log } from '@utils/logger';

// Basic logging
log.info('User action performed', { userId: '123' });
log.error('API call failed', error);

// Specialized logging
log.api.request('POST', '/auth/login', credentials);
log.auth.loginSuccess('username', 'admin');
log.form.submit('LoginForm', formData);
log.performance.start('data-processing');
log.ui.userAction('button-click', { buttonId: 'submit' });
```

### 3. **Error Handling & Boundaries**

#### **Error Boundary Component:**
- Catches React component errors
- Provides user-friendly error UI
- Shows detailed error info in development
- Logs errors automatically

#### **Type-Safe Error Handling:**
```typescript
import { getErrorMessage, isApiError } from '@/types/error';

try {
  await apiCall();
} catch (error: unknown) {
  const message = getErrorMessage(error); // Type-safe error extraction
  log.error('Operation failed', error);
}
```

### 4. **Constants & Configuration Management**

#### **Centralized Constants:**
```typescript
import { API_ENDPOINTS, UI_CONFIG, VALIDATION_RULES } from '@constants';

// API endpoints
const response = await fetch(API_ENDPOINTS.USERS.LIST);

// UI configuration
setTimeout(callback, UI_CONFIG.DEBOUNCE_DELAY);

// Validation rules
const isValidUsername = username.length >= VALIDATION_RULES.USERNAME.MIN_LENGTH;
```

#### **Environment Configuration:**
```typescript
import config from '@/config';

if (config.features.enableLogging) {
  log.debug('Debug mode enabled');
}
```

### 5. **Performance Monitoring**

#### **HOC for Component Performance:**
```typescript
import withPerformanceMonitoring from '@components/common/withPerformanceMonitoring';

const MonitoredComponent = withPerformanceMonitoring(MyComponent, 'MyComponent');
```

#### **Performance Utilities:**
```typescript
log.performance.start('expensive-operation');
// ... expensive operation
log.performance.end('expensive-operation');
```

### 6. **Enhanced API Service**

#### **Features:**
- Comprehensive logging of all requests/responses
- Type-safe error handling
- Automatic token management
- Request/response interceptors
- Retry logic configuration

#### **Usage:**
```typescript
import { apiService } from '@services/api';

// All API calls are automatically logged
const users = await apiService.getUsers({ page: 1, limit: 10 });
```

### 7. **Type Safety Improvements**

#### **Strict TypeScript Configuration:**
- `verbatimModuleSyntax` enabled
- Proper type-only imports
- No `any` types (replaced with `unknown` or proper types)
- Comprehensive type definitions

#### **Custom Type Guards:**
```typescript
if (isApiError(error)) {
  console.log(error.error.message); // Type-safe access
}
```

## 🚀 Development Workflow

### **Available Scripts:**
```bash
npm run dev         # Start development server with HMR
npm run build       # Build for production with source maps
npm run lint        # Run ESLint with TypeScript support
npm run preview     # Preview production build
```

### **Debugging Setup:**

#### **VS Code Configuration:**
- **F5**: Launch Chrome debugger
- **Ctrl+Shift+P** → "Debug: Attach to Chrome"
- Breakpoints work in TypeScript source files

#### **Browser DevTools:**
- React DevTools extension recommended
- Redux DevTools for state debugging
- Network tab for API monitoring

#### **Console Debugging:**
```javascript
// Access stores from console (development only)
window.__REACT_QUERY_CLIENT__ // React Query cache
// Structured logs appear with [BM-ADMIN] prefix
```

### **Logging in Development:**
All logs are automatically enabled in development mode:
```
[BM-ADMIN] [2024-01-15T10:30:45.123Z] [INFO] User logged in | Data: {"username":"admin","role":"super_admin"}
[BM-ADMIN] [2024-01-15T10:30:45.124Z] [DEBUG] API Request: POST /auth/admin-login | Data: {"username":"admin"}
[BM-ADMIN] [2024-01-15T10:30:45.567Z] [DEBUG] API Response: POST /auth/admin-login [200] | Data: {"success":true}
```

## 📋 Code Quality Standards

### **ESLint Rules:**
- TypeScript strict mode
- React hooks rules
- No unused variables
- Prefer `unknown` over `any`
- Import/export consistency

### **File Naming Conventions:**
- **Components**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useApi.ts`)
- **Utils**: camelCase (`logger.ts`)
- **Types**: camelCase (`error.ts`)
- **Constants**: camelCase (`index.ts`)

### **Import Order:**
1. React and external libraries
2. Internal utilities and hooks
3. Constants and configuration
4. Types (using `type` imports)
5. Local components

## 🔒 Security & Best Practices

### **Environment Variables:**
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_DEBUG=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
```

### **Token Management:**
- Automatic token storage in localStorage
- Token refresh on app load
- Automatic logout on 401 responses
- Secure token handling in interceptors

### **Error Boundaries:**
- Application-wide error catching
- Graceful error recovery
- User-friendly error messages
- Detailed error logging (development only)

## 🧪 Testing Strategy

### **Recommended Testing Stack:**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

### **Test Structure:**
```
src/
├── __tests__/          # Global test utilities
├── components/
│   └── __tests__/      # Component tests
├── hooks/
│   └── __tests__/      # Hook tests
└── utils/
    └── __tests__/      # Utility tests
```

## 📈 Performance Optimization

### **Bundle Splitting:**
Configured manual chunks for optimal loading:
- **vendor**: React, React DOM
- **router**: React Router
- **ui**: UI components and icons
- **forms**: Form handling libraries
- **query**: React Query
- **state**: Zustand

### **Development Features:**
- Hot Module Replacement (HMR)
- Source maps for debugging
- React Query DevTools
- Component performance monitoring

### **Production Features:**
- Tree shaking
- Code splitting
- Optimized builds
- Gzip compression

## 🚀 Deployment Considerations

### **Environment Setup:**
1. Set production environment variables
2. Configure error tracking service (Sentry, LogRocket)
3. Set up performance monitoring
4. Configure CDN for static assets

### **Production Logging:**
```typescript
// Only errors are logged in production
// Implement remote logging service in logger.ts
private sendToRemote(): void {
  // Send to Sentry, LogRocket, etc.
}
```

This development setup provides a solid foundation for building scalable, maintainable React applications following industry best practices.
