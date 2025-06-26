import { useMemo } from 'react';
import type { AngorProject, ProjectFilters } from '@/types/angor';
import { useDenyList, filterDeniedProjects } from '@/services/denyService';

interface FilteredProjectsResult {
  projects: AngorProject[];
  statistics: {
    totalProjects: number;
    totalFunding: number;
    totalInvestors: number;
    averageFunding: number;
    activeProjects: number;
    completedProjects: number;
  };
  count: number;
}

export function useFilteredAngorProjects(
  allProjects: AngorProject[],
  filters: ProjectFilters
): FilteredProjectsResult {
  const denyService = useDenyList();
  
  return useMemo(() => {
    // First filter out denied projects
    let filteredProjects = filterDeniedProjects(allProjects, denyService);

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(project => {
        const name = project.metadata?.name?.toLowerCase() || '';
        const about = project.metadata?.about?.toLowerCase() || '';
        const category = project.metadata?.category?.toLowerCase() || '';
        
        return name.includes(searchLower) || 
               about.includes(searchLower) || 
               category.includes(searchLower) ||
               project.projectIdentifier.toLowerCase().includes(searchLower);
      });
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filteredProjects = filteredProjects.filter(project => {
        const status = project.stats?.status || 'active';
        return status === filters.status;
      });
    }

    // Apply minimum amount filter
    if (filters.minAmount && filters.minAmount > 0) {
      filteredProjects = filteredProjects.filter(project => {
        return project.targetAmount >= filters.minAmount!;
      });
    }

    // Apply maximum amount filter
    if (filters.maxAmount && filters.maxAmount > 0) {
      filteredProjects = filteredProjects.filter(project => {
        return project.targetAmount <= filters.maxAmount!;
      });
    }

    // Apply categories filter
    if (filters.categories && filters.categories.length > 0) {
      filteredProjects = filteredProjects.filter(project => {
        const category = project.metadata?.category;
        return category && filters.categories!.includes(category);
      });
    }

    // Calculate statistics
    const statistics = {
      totalProjects: allProjects.length,
      totalFunding: allProjects.reduce((sum, project) => sum + (project.amountInvested || 0), 0),
      totalInvestors: allProjects.reduce((sum, project) => sum + (project.investorCount || 0), 0),
      averageFunding: allProjects.length > 0 
        ? allProjects.reduce((sum, project) => sum + (project.amountInvested || 0), 0) / allProjects.length
        : 0,
      activeProjects: allProjects.filter(p => p.stats?.status === 'active' || !p.stats?.status).length,
      completedProjects: allProjects.filter(p => p.stats?.status === 'completed').length,
    };

    return {
      projects: filteredProjects,
      statistics,
      count: filteredProjects.length
    };
  }, [allProjects, filters, denyService]);
}
