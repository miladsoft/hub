import { useQuery } from '@tanstack/react-query';
import { angorIndexer } from '@/services/angorIndexer';
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer';
import type { AngorProject } from '@/types/angor';

/**
 * Hook to fetch project data from the indexer API
 */
export function useIndexerProject(projectIdentifier: string | undefined) {
  const { network } = useCurrentIndexer();

  return useQuery({
    queryKey: ['indexer-project', projectIdentifier, network],
    queryFn: async (): Promise<AngorProject | null> => {
      if (!projectIdentifier) return null;
      
      console.log(`🔍 Fetching indexer project data for: ${projectIdentifier}`);
      const project = await angorIndexer.getProject(projectIdentifier, network);
      
      if (project) {
        console.log(`✅ Successfully fetched indexer project data:`, project);
      } else {
        console.log(`❌ No indexer project data found for: ${projectIdentifier}`);
      }
      
      return project;
    },
    enabled: !!projectIdentifier,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
