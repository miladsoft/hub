import { useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';

export function useGlobalLoading() {
  const { loading, setLoading } = useAppContext();

  const showLoading = useCallback((message?: string) => {
    setLoading({ isLoading: true, message });
  }, [setLoading]);

  const hideLoading = useCallback(() => {
    setLoading({ isLoading: false });
  }, [setLoading]);

  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    showLoading(message);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return {
    isLoading: loading.isLoading,
    message: loading.message,
    showLoading,
    hideLoading,
    withLoading,
  };
}
