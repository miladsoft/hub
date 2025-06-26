import { angorIndexer } from './angorIndexer';
import type { 
  IndexedProject, 
  ProjectFilters, 
  SortType 
} from '@/types/angor';

export class AngorDataAggregator {
  /**
   * Load and aggregate all project data from multiple sources
   */
  async loadProjectsWithFullData(
    offset: number = 0, 
    limit: number = 10,
    network: 'mainnet' | 'testnet' = 'mainnet',
    onProgress?: (current: number, total: number, stage: string) => void
  ): Promise<IndexedProject[]> {
    try {
      console.log(`🔄 Loading projects for network: ${network}`);
      
      // Stage 1: Fetch project list
      onProgress?.(0, 100, 'Fetching project list...');
      const projects = await angorIndexer.getProjects(offset, limit, network);
      
      console.log(`📋 Found ${projects.length} projects from indexer`);
      
      if (projects.length === 0) {
        console.log('❌ No projects found');
        return [];
      }

      onProgress?.(20, 100, `Found ${projects.length} projects`);

      // Stage 2: Process all projects in parallel
      const projectPromises = projects.map(async (project, index) => {
        try {
          // Fetch core data in parallel
          const [stats, investments] = await Promise.all([
            angorIndexer.getProjectStats(project.projectIdentifier, network),
            angorIndexer.getProjectInvestments(project.projectIdentifier, network)
          ]);

          // For now, we'll create placeholder data for Nostr-based data
          // In a real implementation, these would use the Nostr hooks
          const projectData = {
            targetAmount: project.targetAmount || 0,
            startDate: Date.now() / 1000,
            expiryDate: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
            nostrPubKey: project.nostrPubKey || '',
            projectIdentifier: project.projectIdentifier,
            createdOnBlock: project.createdOnBlock || 0,
          };

          const profile = {
            name: `Project ${project.projectIdentifier}`,
            about: `This is project ${project.projectIdentifier}`,
          };

          const faq = {
            questions: [
              {
                question: "What is this project about?",
                answer: `This project (${project.projectIdentifier}) aims to deliver innovative solutions.`
              }
            ]
          };

          const media = {
            images: [],
            videos: [],
            documents: []
          };

          const members = {
            team: []
          };

          return {
            project,
            projectData,
            profile,
            stats,
            investments,
            faq,
            media,
            members,
            pubKeyToUse: project.nostrPubKey,
            index
          } as IndexedProject;

        } catch (error) {
          console.error(`Error processing project ${project.projectIdentifier}:`, error);
          // Return minimal data for failed projects
          return {
            project,
            projectData: {
              targetAmount: project.targetAmount || 0,
              startDate: 0,
              expiryDate: 0,
              nostrPubKey: '',
              projectIdentifier: project.projectIdentifier,
              createdOnBlock: 0,
            },
            profile: {},
            stats: {
              amountInvested: 0,
              investorCount: 0,
              completionPercentage: 0,
              lastUpdated: Date.now(),
              targetAmount: 0,
              status: 'active' as const,
            },
            investments: [],
            faq: { questions: [] },
            media: {},
            members: { team: [] },
            index
          } as IndexedProject;
        }
      });

      // Stage 3: Wait for all projects to complete
      onProgress?.(50, 100, 'Loading project details...');
      const results = await Promise.all(projectPromises);

      onProgress?.(100, 100, 'Complete!');
      return results;

    } catch (error) {
      console.error('Error in loadProjectsWithFullData:', error);
      return [];
    }
  }

  /**
   * Filter and sort projects
   */
  filterAndSortProjects(
    projects: IndexedProject[], 
    filters: ProjectFilters
  ): IndexedProject[] {
    let filtered = [...projects];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.project.projectIdentifier.toLowerCase().includes(searchLower) ||
        p.profile.name?.toLowerCase().includes(searchLower) ||
        p.profile.about?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.stats.status === filters.status);
    }

    // Apply amount filters
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(p => p.stats.targetAmount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(p => p.stats.targetAmount <= filters.maxAmount!);
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(p => 
        filters.categories!.some(category => 
          p.project.projectIdentifier.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered = this.sortProjects(filtered, filters.sortBy);
    }

    return filtered;
  }

  /**
   * Sort projects by specified criteria
   */
  private sortProjects(projects: IndexedProject[], sortBy: SortType): IndexedProject[] {
    const sorted = [...projects];

    switch (sortBy) {
      case 'funding':
        return sorted.sort((a, b) => b.stats.amountInvested - a.stats.amountInvested);
      
      case 'endDate':
        return sorted.sort((a, b) => {
          const aExpiry = a.projectData.expiryDate || 0;
          const bExpiry = b.projectData.expiryDate || 0;
          return aExpiry - bExpiry;
        });
      
      case 'investors':
        return sorted.sort((a, b) => b.stats.investorCount - a.stats.investorCount);
      
      case 'newest':
        return sorted.sort((a, b) => b.projectData.startDate - a.projectData.startDate);
      
      case 'amount':
        return sorted.sort((a, b) => b.stats.targetAmount - a.stats.targetAmount);
      
      default:
        return sorted;
    }
  }

  /**
   * Get project statistics for dashboard
   */
  getProjectStatistics(projects: IndexedProject[]) {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.stats.status === 'active').length;
    const completedProjects = projects.filter(p => p.stats.status === 'completed').length;
    const totalFunding = projects.reduce((sum, p) => sum + p.stats.amountInvested, 0);
    const totalInvestors = projects.reduce((sum, p) => sum + p.stats.investorCount, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalFunding,
      totalInvestors,
      averageFunding: totalProjects > 0 ? totalFunding / totalProjects : 0,
    };
  }
}

// Export singleton instance
export const angorData = new AngorDataAggregator();
