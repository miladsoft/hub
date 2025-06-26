import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { AngorIndexerService } from '@/services/angorIndexer';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer';
import { useSettings } from '@/hooks/useSettings';
import { formatBitcoinAmount } from '@/lib/formatCurrency';
import type { AngorProject } from '@/types/angor';

interface UseProjectsStatisticsOptions {
  projects: AngorProject[];
  enabled?: boolean;
}

interface ProjectsStatistics {
  totalProjects: number;
  totalRaised: number;
  totalInvestors: number;
  totalInvestments: number;
  totalTarget: number;
  successRate: number;
  activeProjects: number;
  completedProjects: number;
  upcomingProjects: number;
  expiredProjects: number;
  projectsWithInvestors: number;
  endingThisWeek: number;
  endingThisMonth: number;
  averageInvestment: number;
  fundingProgress: number;
  formatted: {
    totalRaised: string;
    totalTarget: string;
    averageInvestment: string;
    totalRaisedShort: string;
    totalTargetShort: string;
    totalInvestorsShort: string;
    totalInvestmentsShort: string;
  };
  isLoading: boolean;
  error: Error | null;
}

export function useProjectsStatistics({ 
  projects, 
  enabled = true 
}: UseProjectsStatisticsOptions): ProjectsStatistics {
  const { network } = useNetwork();
  const { settings } = useSettings();
  const { primaryUrl } = useCurrentIndexer();
  const indexerService = new AngorIndexerService();

  // Fetch stats for each project
  const statsQueries = useQueries({
    queries: projects.map(project => ({
      queryKey: ['project-stats', project.projectIdentifier, network, primaryUrl],
      queryFn: async () => {
        try {
          const stats = await indexerService.getProjectStats(project.projectIdentifier, network);
          return { projectId: project.projectIdentifier, stats, project };
        } catch (error) {
          console.warn(`Failed to fetch stats for ${project.projectIdentifier}:`, error);
          return { 
            projectId: project.projectIdentifier, 
            stats: null, 
            project,
            error: error as Error 
          };
        }
      },
      enabled: enabled && !!project.projectIdentifier && !!primaryUrl,
      staleTime: 60000, // 1 minute
      retry: 1,
    })),
  });

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    // Helper functions
    const safeNumber = (value: number | undefined | null, defaultValue = 0): number => {
      return typeof value === 'number' && !isNaN(value) && isFinite(value) ? value : defaultValue;
    };

    const formatBTC = (sats: number): string => {
      return formatBitcoinAmount(sats, { 
        network, 
        currency: settings.defaultCurrency,
        showSymbol: false,
        precision: 8
      });
    };

    const formatLargeNumber = (num: number): string => {
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    // Initialize counters
    let totalRaised = 0;
    let totalTarget = 0;
    let totalInvestors = 0;
    let totalInvestments = 0;
    let fullyFundedProjects = 0;
    let projectsWithInvestors = 0;
    let activeProjects = 0;
    let completedProjects = 0;
    let upcomingProjects = 0;
    let expiredProjects = 0;
    let endingThisWeek = 0;
    let endingThisMonth = 0;

    // Process each project with its stats
    statsQueries.forEach(query => {
      if (query.data && query.data.stats) {
        const { stats, project } = query.data;
        
        // Extract financial data
        const amountInvested = safeNumber(stats.amountInvested);
        const investorCount = safeNumber(stats.investorCount);
        const targetAmount = safeNumber(stats.targetAmount);
        
        // Accumulate totals
        totalRaised += amountInvested;
        totalInvestors += investorCount;
        totalTarget += targetAmount;
        
        // Get additional project details for totalInvestments
        if (project.totalInvestmentsCount) {
          totalInvestments += safeNumber(project.totalInvestmentsCount);
        } else {
          totalInvestments += investorCount; // Fallback
        }

        // Count success metrics
        const completionPercentage = targetAmount > 0 ? (amountInvested / targetAmount) * 100 : 0;
        if (completionPercentage >= 100) {
          fullyFundedProjects++;
          completedProjects++;
        }
        
        if (investorCount > 0) {
          projectsWithInvestors++;
        }

        // Status categorization (simplified since we don't have dates in basic stats)
        if (stats.status) {
          switch (stats.status) {
            case 'active':
              activeProjects++;
              break;
            case 'completed':
              completedProjects++;
              break;
            case 'upcoming':
              upcomingProjects++;
              break;
            case 'expired':
              expiredProjects++;
              break;
          }
        } else {
          // Fallback categorization
          if (completionPercentage >= 100) {
            completedProjects++;
          } else {
            activeProjects++;
          }
        }

        // Time-based categorization (if dates available)
        if (stats.daysRemaining !== undefined) {
          if (stats.daysRemaining <= 7) {
            endingThisWeek++;
          }
          if (stats.daysRemaining <= 30) {
            endingThisMonth++;
          }
        }
      }
    });

    // Calculate derived metrics
    const successRate = projects.length > 0 ? (fullyFundedProjects / projects.length) * 100 : 0;
    const averageInvestment = totalInvestors > 0 ? totalRaised / totalInvestors : 0;
    const fundingProgress = totalTarget > 0 ? Math.min((totalRaised / totalTarget) * 100, 100) : 0;

    // Check loading state
    const isLoading = statsQueries.some(query => query.isLoading);
    const errors = statsQueries.filter(query => query.error).map(query => query.error);
    const error = errors.length > 0 ? errors[0] as Error : null;

    console.log('📊 Calculated statistics:', {
      totalProjects: projects.length,
      totalRaised,
      totalInvestors,
      totalInvestments,
      totalTarget,
      isLoading,
      queriesLoaded: statsQueries.filter(q => q.data).length,
      totalQueries: statsQueries.length
    });

    return {
      totalProjects: projects.length,
      totalRaised,
      totalInvestors,
      totalInvestments,
      totalTarget,
      successRate,
      activeProjects,
      completedProjects,
      upcomingProjects,
      expiredProjects,
      projectsWithInvestors,
      endingThisWeek,
      endingThisMonth,
      averageInvestment,
      fundingProgress,
      formatted: {
        totalRaised: formatBTC(totalRaised),
        totalTarget: formatBTC(totalTarget),
        averageInvestment: formatBTC(averageInvestment),
        totalRaisedShort: formatLargeNumber(totalRaised),
        totalTargetShort: formatLargeNumber(totalTarget),
        totalInvestorsShort: formatLargeNumber(totalInvestors),
        totalInvestmentsShort: formatLargeNumber(totalInvestments)
      },
      isLoading,
      error
    };
  }, [statsQueries, projects, network, settings.defaultCurrency]);

  return statistics;
}
