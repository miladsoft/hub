import { ANGOR_INDEXER_BASE_URL } from '@/types/angor';
import type { AngorProject, ProjectStats, ProjectInvestment } from '@/types/angor';
import type { NetworkType } from '@/contexts/NetworkContext';

export class AngorIndexerService {
  private getBaseUrl(network: NetworkType): string {
    return ANGOR_INDEXER_BASE_URL[network];
  }

  /**
   * Fetch project list with pagination
   */
  async getProjects(offset: number = 0, limit: number = 10, network: NetworkType = 'mainnet'): Promise<AngorProject[]> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(
        `${baseUrl}api/query/Angor/projects?offset=${offset}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const projects = await response.json();
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Fetch project statistics
   */
  async getProjectStats(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<ProjectStats> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(
        `${baseUrl}api/query/Angor/projects/${projectIdentifier}/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stats = await response.json();
      
      // Calculate completion percentage and status
      const completionPercentage = stats.targetAmount > 0 
        ? Math.round((stats.amountInvested / stats.targetAmount) * 100)
        : 0;

      const now = Date.now();
      const daysRemaining = stats.expiryDate 
        ? Math.max(0, Math.ceil((stats.expiryDate * 1000 - now) / (1000 * 60 * 60 * 24)))
        : undefined;

      let status: ProjectStats['status'] = 'active';
      if (completionPercentage >= 100) {
        status = 'completed';
      } else if (daysRemaining !== undefined && daysRemaining <= 0) {
        status = 'expired';
      } else if (stats.startDate && stats.startDate * 1000 > now) {
        status = 'upcoming';
      }

      return {
        ...stats,
        completionPercentage,
        daysRemaining,
        status,
        lastUpdated: now,
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return {
        amountInvested: 0,
        investorCount: 0,
        completionPercentage: 0,
        lastUpdated: Date.now(),
        targetAmount: 0,
        status: 'active',
      };
    }
  }

  /**
   * Fetch project investments
   */
  async getProjectInvestments(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<ProjectInvestment[]> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(
        `${baseUrl}api/query/Angor/projects/${projectIdentifier}/investments`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const investments = await response.json();
      return Array.isArray(investments) ? investments : [];
    } catch (error) {
      console.error('Error fetching project investments:', error);
      return [];
    }
  }

  /**
   * Search projects by query
   */
  async searchProjects(query: string, limit: number = 20, network: NetworkType = 'mainnet'): Promise<AngorProject[]> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(
        `${baseUrl}api/query/Angor/projects/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // If search endpoint doesn't exist, fall back to getting all projects and filtering
        const allProjects = await this.getProjects(0, 100, network);
        return allProjects.filter(project => 
          project.projectIdentifier.toLowerCase().includes(query.toLowerCase())
        );
      }

      const projects = await response.json();
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }

  /**
   * Get project by identifier
   */
  async getProject(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<AngorProject | null> {
    try {
      const baseUrl = this.getBaseUrl(network);
      const response = await fetch(
        `${baseUrl}api/query/Angor/projects/${projectIdentifier}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }
}

// Export singleton instance
export const angorIndexer = new AngorIndexerService();
