import { useState, useCallback, useEffect } from 'react';
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
  total: number;
  hasMore: boolean;
}

export function useAngorProjects(options: UseAngorProjectsOptions = {}) {
  const { enabled = true, refetchInterval } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  const [totalItems, setTotalItems] = useState(0);
  const queryClient = useQueryClient();
  
  // Create indexer service instance
  const indexerService = new AngorIndexerService();

  // Invalidate cache when network or indexer changes
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['angor-projects']
    });
    setTotalItems(0);
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
    initialPageParam: -1000,
    queryFn: async ({ pageParam = -1000 }) => {
      return await fetchProjectsPage(pageParam as number);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      
      // Calculate next offset based on total and current position
      const totalLoaded = allPages.reduce((sum, page) => sum + page.projects.length, 0);
      const nextOffset = Math.max(0, lastPage.total - totalLoaded - LIMIT);
      
      return nextOffset >= 0 ? nextOffset : undefined;
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  // Fetch a single page of projects
  const fetchProjectsPage = async (pageOffset: number): Promise<ProjectsResponse> => {
    let limit = LIMIT;
    let currentOffset = pageOffset;

    // Handle edge case when offset is negative but not -1000
    if (currentOffset !== -1000 && currentOffset < 0) {
      limit = LIMIT + currentOffset;
      currentOffset = 0;
    }

    if (limit <= 0) {
      return { projects: [], total: 0, hasMore: false };
    }

    // For first request, start from the beginning
    if (currentOffset === -1000) {
      currentOffset = 0;
    }

    try {
      const projects = await indexerService.getProjects(currentOffset, limit, network);
      
      // For now, we'll estimate total. In a real implementation, you'd get this from headers
      const estimatedTotal = projects.length === limit ? (currentOffset + limit + limit) : (currentOffset + projects.length);
      
      if (pageOffset === -1000) {
        setTotalItems(estimatedTotal);
      }

      // Calculate if there are more projects to load
      const hasMore = projects.length === limit;

      return {
        projects,
        total: estimatedTotal,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching projects page:', error);
      return { projects: [], total: 0, hasMore: false };
    }
  };

  // Get flattened list of all projects
  const allProjects = data?.pages.flatMap(page => page.projects) || [];
  const totalProjects = totalItems;

  // Load more projects
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset and refetch projects (useful when network or indexer changes)
  const resetAndRefetch = useCallback(async () => {
    setTotalItems(0);
    // Clear all cache for projects
    await queryClient.resetQueries({
      queryKey: ['angor-projects', network, primaryUrl]
    });
    refetch();
  }, [refetch, queryClient, network, primaryUrl]);

  // Check if all projects have been loaded
  const isComplete = !hasNextPage && !isFetchingNextPage;

  return {
    // Data
    projects: allProjects,
    totalProjects,
    
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
