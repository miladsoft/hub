import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Users, Bitcoin } from 'lucide-react';
import type { AngorProject } from '@/types/angor';
import { useProjectsStatistics } from '@/hooks/useProjectsStatistics';
import { useNetwork } from '@/contexts/NetworkContext';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';

interface ProjectsStatisticsProps {
  projects: AngorProject[];
  filteredProjects: AngorProject[];
  isLoading?: boolean;
}

export function ProjectsStatistics({ 
  projects, 
  filteredProjects, 
  isLoading = false
}: ProjectsStatisticsProps) {
  
  // Get current network
  const { network } = useNetwork();
  
  // Get Bitcoin price from mempool.space
  const { data: bitcoinPrice, isLoading: priceLoading, error: priceError } = useBitcoinPrice();
  
  // Use the new hook to get comprehensive statistics
  const statistics = useProjectsStatistics({ 
    projects, 
    enabled: !isLoading 
  });

  if (isLoading || statistics.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Simplified Statistics - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {filteredProjects.length} matching filters
            </p>
          </CardContent>
        </Card>

        {/* Total Funding */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.formatted.totalRaised} {network === 'mainnet' ? 'BTC' : 'TBTC'}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.formatted.totalRaisedShort} satoshis
            </p>
          </CardContent>
        </Card>

        {/* Total Investors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.formatted.totalInvestorsShort}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.formatted.totalInvestmentsShort} investments
            </p>
          </CardContent>
        </Card>

        {/* Bitcoin Price */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {network === 'mainnet' ? 'Bitcoin Price' : 'Bitcoin Testnet'}
            </CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {network === 'testnet' ? (
              <>
                <div className="text-2xl font-bold">TBTC</div>
                <p className="text-xs text-muted-foreground">Testnet mode</p>
              </>
            ) : priceLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : priceError ? (
              <div className="text-2xl font-bold text-red-500">Error</div>
            ) : bitcoinPrice ? (
              <>
                <div className="text-2xl font-bold">
                  ${bitcoinPrice.USD.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Live price</p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">N/A</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
