// Error type definitions for better type safety

export interface ApiError {
  error?: {
    message: string;
    statusCode: number;
  };
  message?: string;
  response?: {
    data: unknown;
    status: number;
    headers?: Record<string, string>;
  };
}

export interface ErrorWithMessage {
  message: string;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('error' in error || 'message' in error || 'response' in error)
  );
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithMessage).message === 'string'
  );
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Handle specific HTTP status codes
    const status = error.response?.status;
    
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const resetTime = error.response?.headers?.['ratelimit-reset'];
      
      if (retryAfter || resetTime) {
        const waitTime = parseInt(retryAfter || resetTime || '0');
        const minutes = Math.ceil(waitTime / 60);
        return `Rate limit exceeded. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
      }
      
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    
    if (status === 401) {
      return 'Invalid username or password. Please try again.';
    }
    
    if (status === 403) {
      return 'Access denied. You do not have permission to access this resource.';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later or contact support.';
    }
    
    if (status === 503) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    return error.error?.message || error.message || 'An API error occurred';
  }
  
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}
