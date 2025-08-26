
import { ENV, UI_CONFIG } from '@constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { log } from '@utils/logger';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Components
import ErrorBoundary from '@components/common/ErrorBoundary';
import { Layout } from '@components/layout/Layout';
import { ProtectedRoute } from '@components/layout/ProtectedRoute';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import DashboardPage from '@pages/dashboard/DashboardPage';
import ImagesPage from '@pages/images/ImagesPage';
import OrdersPage from '@pages/orders/OrdersPage';
import StoresPage from '@pages/stores/StoresPage';
import UsersPage from '@pages/users/UsersPage';

// Create a client with conservative settings to prevent rate limiting
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry rate limit errors (429)
        if (error?.response?.status === 429) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      // No aggressive refetch intervals by default
      refetchInterval: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry rate limit errors (429)
        if (error?.response?.status === 429) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function App() {
  log.info('App initialized');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/stores" element={<StoresPage />} />
                      <Route path="/images" element={<ImagesPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: UI_CONFIG.TOAST_DURATION,
            className: 'text-sm',
            success: {
              style: {
                background: '#10B981',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: 'white',
              },
            },
          }}
        />
        </Router>
        
        {/* React Query DevTools - Only in development */}
        {ENV.IS_DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;