import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCurrentIndexer } from './useCurrentIndexer';
import { useNetwork } from '@/contexts/NetworkContext';

/**
 * Hook that invalidates queries when the indexer changes
 */
export function useIndexerCacheInvalidation() {
  const queryClient = useQueryClient();
  const { primaryUrl } = useCurrentIndexer();
  const { network } = useNetwork();

  useEffect(() => {
    console.log('Network or indexer changed, invalidating cache...', { network, primaryUrl });
    // Invalidate all queries that depend on the indexer when it changes
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && (
          queryKey.includes('angor-projects') ||
          queryKey.includes('angor-project') ||
          queryKey.includes('angor-project-stats') ||
          queryKey.includes('angor-project-investments') ||
          queryKey.includes('angor-project-search')
        );
      }
    });
  }, [primaryUrl, network, queryClient]);

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey.some(key => 
            typeof key === 'string' && key.startsWith('angor-')
          );
        }
      });
    }
  };
}
