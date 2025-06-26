import { AngorIndexerService } from './angorIndexer';
import type { NetworkType } from '@/contexts/NetworkContext';

export interface ProjectStatsAdvanced {
  // Basic stats
  investorCount: number;
  amountInvested: number;
  completionPercentage: number;
  targetAmount: number;
  daysRemaining?: number;
  status: 'active' | 'completed' | 'expired' | 'upcoming';
  lastUpdated: number;
  
  // Advanced stats from Angular service
  amountSpentSoFarByFounder: number;
  amountInPenalties: number;
  countInPenalties: number;
  
  // Additional computed stats
  avgInvestmentAmount: number;
  fundingVelocity: number; // Amount per day
  timeToCompletion?: number; // Estimated days to completion
  riskScore: number; // 0-100 risk assessment
}

export interface ProjectInvestmentDetailed {
  investorKey: string;
  amount: number;
  trxId: string;
  blockHeight: number;
  timestamp?: number;
  isSeeder?: boolean;
}

export interface FounderActivity {
  totalSpent: number;
  spendingHistory: Array<{
    amount: number;
    timestamp: number;
    description?: string;
  }>;
  penaltyHistory: Array<{
    amount: number;
    timestamp: number;
    reason?: string;
  }>;
}

export interface ProjectAnalytics {
  // Investment trends
  investmentTrend: Array<{
    date: string;
    amount: number;
    investorCount: number;
  }>;
  
  // Geographic distribution (if available)
  investorDistribution: Array<{
    region: string;
    count: number;
    amount: number;
  }>;
  
  // Investment size distribution
  investmentSizeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  
  // Performance metrics
  performance: {
    fundingEfficiency: number; // Target reached / Time elapsed
    investorRetention: number;
    avgTimeToInvest: number;
  };
}

export class ProjectStatsService {
  private indexerService: AngorIndexerService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute

  constructor() {
    this.indexerService = new AngorIndexerService();
  }

  /**
   * Get advanced project statistics
   */
  async getAdvancedProjectStats(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<ProjectStatsAdvanced> {
    const cacheKey = `stats-${projectIdentifier}-${network}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get basic stats from indexer
      const basicStats = await this.indexerService.getProjectStats(projectIdentifier, network);
      
      // Calculate advanced metrics
      const investments = await this.indexerService.getProjectInvestments(projectIdentifier, network);
      const avgInvestmentAmount = investments.length > 0 
        ? investments.reduce((sum, inv) => sum + inv.totalAmount, 0) / investments.length 
        : 0;

      // Calculate funding velocity (amount per day)
      const projectCreationTime = basicStats.lastUpdated - (30 * 24 * 60 * 60 * 1000); // Approximate
      const daysSinceCreation = Math.max(1, (Date.now() - projectCreationTime) / (24 * 60 * 60 * 1000));
      const fundingVelocity = basicStats.amountInvested / daysSinceCreation;

      // Estimate time to completion
      let timeToCompletion: number | undefined;
      if (fundingVelocity > 0 && basicStats.completionPercentage < 100) {
        const remainingAmount = basicStats.targetAmount - basicStats.amountInvested;
        timeToCompletion = remainingAmount / fundingVelocity;
      }

      // Calculate risk score (0-100)
      const riskScore = this.calculateRiskScore(basicStats, investments.length, fundingVelocity);

      const advancedStats: ProjectStatsAdvanced = {
        ...basicStats,
        amountSpentSoFarByFounder: basicStats.amountSpentSoFarByFounder || 0,
        amountInPenalties: basicStats.amountInPenalties || 0,
        countInPenalties: basicStats.countInPenalties || 0,
        avgInvestmentAmount,
        fundingVelocity,
        timeToCompletion,
        riskScore,
      };

      this.setCache(cacheKey, advancedStats);
      return advancedStats;
    } catch (error) {
      console.error('Error fetching advanced project stats:', error);
      throw error;
    }
  }

  /**
   * Get detailed investment information
   */
  async getDetailedInvestments(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<ProjectInvestmentDetailed[]> {
    const cacheKey = `investments-${projectIdentifier}-${network}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const investments = await this.indexerService.getProjectInvestments(projectIdentifier, network);
      const detailed = investments.map(inv => ({
        investorKey: inv.investorPublicKey,
        amount: inv.totalAmount,
        trxId: inv.transactionId,
        blockHeight: 0, // Would be from blockchain data
        timestamp: inv.timeInvested * 1000, // Convert to milliseconds
        isSeeder: inv.totalAmount > 1000000, // Arbitrary threshold for seeders
      }));

      this.setCache(cacheKey, detailed);
      return detailed;
    } catch (error) {
      console.error('Error fetching detailed investments:', error);
      return [];
    }
  }

  /**
   * Get founder activity and spending history
   */
  async getFounderActivity(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<FounderActivity> {
    try {
      const stats = await this.getAdvancedProjectStats(projectIdentifier, network);
      
      // This would typically come from blockchain analysis
      // For now, we'll return basic information
      return {
        totalSpent: stats.amountSpentSoFarByFounder,
        spendingHistory: [
          {
            amount: stats.amountSpentSoFarByFounder,
            timestamp: Date.now() - 86400000, // 1 day ago
            description: 'Project development expenses'
          }
        ],
        penaltyHistory: stats.amountInPenalties > 0 ? [
          {
            amount: stats.amountInPenalties,
            timestamp: Date.now() - 172800000, // 2 days ago
            reason: 'Missed milestone deadline'
          }
        ] : []
      };
    } catch (error) {
      console.error('Error fetching founder activity:', error);
      return {
        totalSpent: 0,
        spendingHistory: [],
        penaltyHistory: []
      };
    }
  }

  /**
   * Get project analytics and trends
   */
  async getProjectAnalytics(projectIdentifier: string, network: NetworkType = 'mainnet'): Promise<ProjectAnalytics> {
    try {
      const investments = await this.getDetailedInvestments(projectIdentifier, network);
      const stats = await this.getAdvancedProjectStats(projectIdentifier, network);

      // Generate investment trend (mock data for now)
      const investmentTrend = this.generateInvestmentTrend(investments);
      
      // Calculate investment size distribution
      const investmentSizeDistribution = this.calculateInvestmentSizeDistribution(investments);
      
      return {
        investmentTrend,
        investorDistribution: [
          { region: 'Unknown', count: investments.length, amount: stats.amountInvested }
        ],
        investmentSizeDistribution,
        performance: {
          fundingEfficiency: stats.completionPercentage / Math.max(1, stats.daysRemaining || 1),
          investorRetention: 0.85, // Mock data
          avgTimeToInvest: 2.5 // Mock data - days
        }
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score based on various factors
   */
  private calculateRiskScore(stats: any, investorCount: number, fundingVelocity: number): number {
    let riskScore = 50; // Base risk score

    // Factor 1: Funding progress
    if (stats.completionPercentage > 80) riskScore -= 20;
    else if (stats.completionPercentage < 20) riskScore += 20;

    // Factor 2: Number of investors (diversification)
    if (investorCount > 50) riskScore -= 15;
    else if (investorCount < 5) riskScore += 25;

    // Factor 3: Funding velocity
    if (fundingVelocity > 10000) riskScore -= 10; // High daily funding
    else if (fundingVelocity < 1000) riskScore += 15; // Low daily funding

    // Factor 4: Penalties
    if (stats.amountInPenalties > 0) riskScore += 30;

    // Factor 5: Time remaining
    if (stats.daysRemaining && stats.daysRemaining < 7) riskScore += 20;

    return Math.max(0, Math.min(100, riskScore));
  }

  /**
   * Generate investment trend data
   */
  private generateInvestmentTrend(investments: ProjectInvestmentDetailed[]) {
    // Group investments by date and sum amounts
    const trendMap = new Map<string, { amount: number; count: number }>();
    
    investments.forEach(inv => {
      const date = new Date(inv.timestamp || Date.now()).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { amount: 0, count: 0 };
      trendMap.set(date, {
        amount: existing.amount + inv.amount,
        count: existing.count + 1
      });
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      investorCount: data.count
    }));
  }

  /**
   * Calculate investment size distribution
   */
  private calculateInvestmentSizeDistribution(investments: ProjectInvestmentDetailed[]) {
    const ranges = [
      { min: 0, max: 100000, label: '< 0.001 BTC' },
      { min: 100000, max: 1000000, label: '0.001 - 0.01 BTC' },
      { min: 1000000, max: 10000000, label: '0.01 - 0.1 BTC' },
      { min: 10000000, max: 100000000, label: '0.1 - 1 BTC' },
      { min: 100000000, max: Infinity, label: '> 1 BTC' }
    ];

    const total = investments.length;
    return ranges.map(range => {
      const count = investments.filter(inv => 
        inv.amount >= range.min && inv.amount < range.max
      ).length;
      
      return {
        range: range.label,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get supply information (Bitcoin network stats)
   */
  async getNetworkSupply(network: NetworkType = 'mainnet'): Promise<any> {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://explorer.angor.io/' 
        : 'https://tbtc.indexer.angor.io/';
      
      const response = await fetch(`${baseUrl}api/insight/supply`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching network supply:', error);
      return null;
    }
  }

  /**
   * Test indexer connection
   */
  async testIndexerConnection(url: string): Promise<boolean> {
    const endpoints = ['api/stats/heartbeat', 'api/mempool'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${url}${endpoint}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error(`Failed to connect to ${url}${endpoint}:`, error);
      }
    }

    return false;
  }
}
