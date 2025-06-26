import { useState } from 'react';
import { ProjectGrid } from '@/components/ProjectGrid';
import { ProjectFiltersComponent } from '@/components/ProjectFilters';
import { LoadingProgress } from '@/components/LoadingProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Target, Users, Zap, Bitcoin } from 'lucide-react';
import { useAngorProjects, useFilteredProjects } from '@/hooks/useAngorData';
import { useNetwork } from '@/contexts/NetworkContext';
import type { ProjectFilters } from '@/types/angor';

export function ExplorePage() {
  const { network } = useNetwork();
  const [filters, setFilters] = useState<ProjectFilters>({});
  
  const { 
    projects: allProjects, 
    isLoading, 
    error, 
    progress 
  } = useAngorProjects({ 
    limit: 50,
    enableAutoRefresh: true 
  });

  const {
    projects: filteredProjects,
    statistics,
    count: filteredCount
  } = useFilteredProjects(allProjects, filters);

  const formatBTC = (sats: number) => {
    return `${(sats / 100000000).toFixed(2)} BTC`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <Badge 
            variant={network === 'mainnet' ? 'default' : 'secondary'}
            className={`text-sm px-3 py-1 ${
              network === 'mainnet' 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Bitcoin className="h-4 w-4 mr-1" />
            {network === 'mainnet' ? 'Bitcoin Mainnet' : 'Bitcoin Testnet'}
          </Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Explore Projects
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover innovative Bitcoin-funded projects from creators around the world. 
          Support the future of decentralized crowdfunding on {network === 'mainnet' ? 'Bitcoin Mainnet' : 'Bitcoin Testnet'}.
        </p>
      </div>

      {/* Statistics Overview */}
      {!isLoading && allProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeProjects} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBTC(statistics.totalFunding)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatAmount(statistics.totalFunding)} sats raised
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalInvestors}</div>
              <p className="text-xs text-muted-foreground">
                Supporting projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Funding</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBTC(statistics.averageFunding)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per project
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Filter Badges */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!filters.status || filters.status === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: 'all' })}
          >
            All Projects
          </Button>
          <Button
            variant={filters.status === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: 'active' })}
          >
            Active
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              {statistics.activeProjects}
            </Badge>
          </Button>
          <Button
            variant={filters.status === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: 'completed' })}
          >
            Completed
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              {statistics.completedProjects}
            </Badge>
          </Button>
          <Button
            variant={filters.sortBy === 'funding' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, sortBy: 'funding' })}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Most Funded
          </Button>
          <Button
            variant={filters.sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, sortBy: 'newest' })}
          >
            <Zap className="h-4 w-4 mr-1" />
            Newest
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ProjectFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={allProjects.length}
            filteredCount={filteredCount}
            className="sticky top-8"
          />
        </div>

        {/* Projects Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Header */}
          {!isLoading && allProjects.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {filteredCount === allProjects.length 
                    ? `${filteredCount} Projects` 
                    : `${filteredCount} of ${allProjects.length} Projects`
                  }
                </span>
                <Badge variant="outline" className="text-xs">
                  {network}
                </Badge>
              </div>
              {filters.search && (
                <div className="text-sm text-muted-foreground">
                  Results for "{filters.search}"
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <LoadingProgress progress={progress} />
          )}

          {/* Projects Grid */}
          <ProjectGrid
            projects={filteredProjects}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
