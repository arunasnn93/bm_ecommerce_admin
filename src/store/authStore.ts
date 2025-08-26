import type { AdminUser, AuthStore, LoginCredentials } from '@/types';
import { getErrorMessage } from '@/types/error';
import { AUTH_CONFIG, SUCCESS_MESSAGES } from '@constants';
import { apiService } from '@services/api';
import { log } from '@utils/logger';
import toast from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Validate auth state and fix if broken
      validateAuthState: () => {
        const state = get();
        if (state.isAuthenticated && (!state.user || !state.token)) {
          console.warn('Detected broken auth state - clearing...');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return false;
        }
        return true;
      },

      login: async (credentials: LoginCredentials) => {
        try {
          log.auth.login(credentials.username);
          log.performance.start('user-login');
          
          const response = await apiService.adminLogin(credentials);
          
          // Handle different possible token locations in response
          const token = response.accessToken || response.session?.access_token;
          
          if (response.success && response.user && token) {
            const newState = {
              user: response.user,
              token: token,
              isAuthenticated: true,
            };
            
            set(newState);
            log.state.update('authStore', 'login', newState);
            log.auth.loginSuccess(credentials.username, response.user.role);
            
            toast.success(`Welcome back, ${response.user.name}!`);
          } else {
            throw new Error('Login failed - missing user data or token');
          }
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          log.auth.loginFailed(credentials.username, error);
          toast.error(errorMessage);
          throw error;
        } finally {
          log.performance.end('user-login');
        }
      },

      logout: () => {
        const currentUser = useAuthStore.getState().user;
        log.auth.logout(currentUser?.username);
        
        apiService.logout();
        const newState = {
          user: null,
          token: null,
          isAuthenticated: false,
        };
        
        set(newState);
        log.state.update('authStore', 'logout', newState);
        toast.success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
      },

      setUser: (user: AdminUser) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        apiService.setToken(token);
      },
    }),
    {
      name: AUTH_CONFIG.STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
