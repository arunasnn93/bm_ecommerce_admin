import { getErrorMessage } from '@/types/error';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';

interface UseApiOptions {
  showLoading?: boolean;
  showError?: boolean;
  showSuccess?: boolean;
  successMessage?: string;
}

export function useApi<T extends unknown[], R>(
  apiFunction: (...args: T) => Promise<R>,
  options: UseApiOptions = {}
) {
  const {
    showLoading = true,
    showError = true,
    showSuccess = false,
    successMessage,
  } = options;

  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setLoading: setGlobalLoading, setError: setGlobalError } = useAppStore();

  const execute = useCallback(
    async (...args: T): Promise<R> => {
      try {
        setLoading(true);
        setError(null);
        
        if (showLoading) {
          setGlobalLoading(true);
        }

        const result = await apiFunction(...args);
        setData(result);

        if (showSuccess) {
          toast.success(successMessage || 'Operation completed successfully');
        }

        return result;
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);

        if (showError) {
          toast.error(errorMessage);
          setGlobalError(errorMessage);
        }

        throw err;
      } finally {
        setLoading(false);
        if (showLoading) {
          setGlobalLoading(false);
        }
      }
    },
    [apiFunction, showLoading, showError, showSuccess, successMessage, setGlobalError, setGlobalLoading]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
