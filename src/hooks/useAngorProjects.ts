import { useCallback, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer';
import { AngorIndexerService } from '@/services/angorIndexer';
import type { AngorProject, ProjectStats, ProjectInvestment } from '@/types/angor';

const LIMIT = 6; // Number of projects to fetch per request

interface UseAngorProjectsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface ProjectsResponse {
  projects: AngorProject[];
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function useAngorProjects(options: UseAngorProjectsOptions = {}) {
  const { enabled = true, refetchInterval } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  const queryClient = useQueryClient();
  
  // Create indexer service instance
  const indexerService = new AngorIndexerService();

  // Invalidate cache when network or indexer changes
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['angor-projects']
    });
  }, [network, primaryUrl, queryClient]);

  // Main projects query with infinite loading
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isFetching
  } = useInfiniteQuery<ProjectsResponse>({
    queryKey: ['angor-projects', network, primaryUrl],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchProjectsPage(pageParam as number);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer projects than requested, we've reached the end
      if (!lastPage.hasMore || lastPage.projects.length < LIMIT) {
        return undefined;
      }
      
      // Calculate next offset
      const totalLoaded = allPages.reduce((sum, page) => sum + page.projects.length, 0);
      return totalLoaded;
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  // Fetch a single page of projects
  const fetchProjectsPage = async (offset: number): Promise<ProjectsResponse> => {
    try {
      console.log(`🔄 Fetching projects: offset=${offset}, limit=${LIMIT}`);
      
      const projects = await indexerService.getProjects(offset, LIMIT, network);
      
      console.log(`✅ Fetched ${projects.length} projects from offset ${offset}`);
      
      // If we got fewer projects than requested, we've reached the end
      const hasMore = projects.length === LIMIT;

      return {
        projects,
        offset,
        limit: LIMIT,
        hasMore
      };
    } catch (error) {
      console.error('❌ Error fetching projects page:', error);
      return { 
        projects: [], 
        offset, 
        limit: LIMIT, 
        hasMore: false 
      };
    }
  };

  // Get flattened list of all projects
  const allProjects = data?.pages.flatMap(page => page.projects) || [];

  // Load more projects
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset and refetch projects (useful when network or indexer changes)
  const resetAndRefetch = useCallback(async () => {
    // Clear all cache for projects
    await queryClient.resetQueries({
      queryKey: ['angor-projects', network, primaryUrl]
    });
    refetch();
  }, [refetch, queryClient, network, primaryUrl]);

  // Check if all projects have been loaded
  const isComplete = !hasNextPage && !isFetchingNextPage && !isLoading;

  return {
    // Data
    projects: allProjects,
    totalProjects: allProjects.length,
    
    // Loading states
    isLoading: isLoading || isFetching,
    isFetchingNextPage,
    isComplete,
    
    // Error state
    error: error as Error | null,
    
    // Actions
    loadMore,
    resetAndRefetch,
    refetch,
    
    // Pagination info
    hasNextPage,
    primaryUrl,
    network
  };
}

// Hook for fetching a single project by ID
export function useAngorProject(projectId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  
  const indexerService = new AngorIndexerService();

  return useQuery({
    queryKey: ['angor-project', projectId, network, primaryUrl],
    queryFn: async () => {
      if (!projectId) return null;
      return await indexerService.getProject(projectId, network);
    },
    enabled: enabled && !!projectId && !!primaryUrl,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// Hook for fetching project stats
export function useAngorProjectStats(projectId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  
  const indexerService = new AngorIndexerService();

  return useQuery<ProjectStats>({
    queryKey: ['angor-project-stats', projectId, network, primaryUrl],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return await indexerService.getProjectStats(projectId, network);
    },
    enabled: enabled && !!projectId && !!primaryUrl,
    staleTime: 30000, // 30 seconds (stats change more frequently)
    gcTime: 300000, // 5 minutes
  });
}

// Hook for fetching project investments
export function useAngorProjectInvestments(
  projectId: string, 
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  
  const indexerService = new AngorIndexerService();

  return useQuery<ProjectInvestment[]>({
    queryKey: ['angor-project-investments', projectId, network, primaryUrl],
    queryFn: async () => {
      if (!projectId) return [];
      return await indexerService.getProjectInvestments(projectId, network);
    },
    enabled: enabled && !!projectId && !!primaryUrl,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}
