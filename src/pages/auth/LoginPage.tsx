import type { LoginCredentials } from '@/types';

import { SUCCESS_MESSAGES, VALIDATION_RULES } from '@constants';
import { yupResolver } from '@hookform/resolvers/yup';
import { useApi } from '@hooks/useApi';
import { useAuthStore } from '@store/authStore';
import { log } from '@utils/logger';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router-dom';
import * as yup from 'yup';

const schema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(VALIDATION_RULES.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.USERNAME.MAX_LENGTH, `Username must be less than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`),
  password: yup
    .string()
    .required('Password is required')
    .min(VALIDATION_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`),
});

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const { isAuthenticated, login } = useAuthStore();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    log.ui.componentMount('LoginPage', { from });
    log.navigation.routeChange(location.pathname, '/login');
  }, [from, location.pathname]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  const { execute: executeLogin, loading } = useApi(login, {
    showLoading: false,
    showError: true,
    showSuccess: true,
    successMessage: SUCCESS_MESSAGES.LOGIN_SUCCESS,
  });

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCooldown(rateLimitCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCooldown]);

  const onSubmit = async (data: LoginCredentials) => {
    if (rateLimitCooldown > 0) {
      return; // Don't submit if in cooldown
    }

    try {
      log.form.submit('LoginForm', { username: data.username });
      log.ui.userAction('login-attempt', { username: data.username });
      await executeLogin(data);
    } catch (error: any) {
      // Error is handled by useApi hook and logged in authStore
      // Check if it's a rate limit error (429)
      if (error?.response?.status === 429) {
        log.auth.rateLimitHit(data.username);
        
        // Get actual reset time from backend headers
        const retryAfter = error?.response?.headers?.['retry-after'];
        const resetTime = error?.response?.headers?.['ratelimit-reset'];
        const backendCooldown = retryAfter || resetTime;
        
        if (backendCooldown && backendCooldown > 60) {
          // Backend rate limit - use actual reset time
          setRateLimitCooldown(parseInt(backendCooldown));
          log.auth.rateLimitHit(`${data.username} - backend limit, reset in ${backendCooldown}s`);
        } else {
          // Frontend/nginx rate limit - shorter cooldown
          setRateLimitCooldown(60);
        }
      }
    }
  };

  // Log form validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      log.form.validation('LoginForm', errors);
    }
  }, [errors]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">BM</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to Admin Panel
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your BM E-commerce admin dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className="input-field"
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || rateLimitCooldown > 0}
                className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : rateLimitCooldown > 0 ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Wait {rateLimitCooldown}s
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
              {rateLimitCooldown > 0 && (
                <p className="mt-2 text-sm text-orange-600 text-center">
                  Too many login attempts. Please wait before trying again.
                </p>
              )}
            </div>
          </form>

        </div>
      </div>
      

    </div>
  );
};

export default LoginPage;
