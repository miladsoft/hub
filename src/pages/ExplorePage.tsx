import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AngorProjectCard } from '@/components/AngorProjectCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  TrendingUp, 
  Target, 
  Users, 
  Zap, 
  RotateCcw,
  X,
  Filter,
  SearchX
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAngorProjects } from '@/hooks/useAngorProjects';
import { useNetwork } from '@/contexts/NetworkContext';
import { useIndexerCacheInvalidation } from '@/hooks/useIndexerCacheInvalidation';
import type { FilterType, SortType, NostrProfile } from '@/types/angor';

export function ExplorePage() {
  const { network } = useNetwork();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollTriggerRef = useRef<HTMLDivElement>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  );
  const [activeSort, setActiveSort] = useState<SortType>(
    (searchParams.get('sort') as SortType) || 'default'
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Project data
  const { 
    projects: allProjects, 
    isLoading, 
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isComplete
  } = useAngorProjects({ 
    enabled: true,
    refetchInterval: 30000
  });

  // Automatically invalidate cache when indexer changes
  useIndexerCacheInvalidation();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (activeFilter !== 'all') params.set('filter', activeFilter);
    if (activeSort !== 'default') params.set('sort', activeSort);
    setSearchParams(params, { replace: true });
  }, [searchTerm, activeFilter, activeSort, setSearchParams]);

  // Filter and sort projects
  const filteredProjects = useCallback(() => {
    let filtered = [...allProjects];
    const search = searchTerm.toLowerCase().trim();

    // Apply search filter
    if (search) {
      filtered = filtered.filter(project => {
        const metadata = project.metadata || project.profile;
        const profile = metadata as NostrProfile;
        const name = profile?.name || profile?.display_name || '';
        const about = profile?.about || '';
        const identifier = project.projectIdentifier || '';
        
        return (
          name.toLowerCase().includes(search) ||
          about.toLowerCase().includes(search) ||
          identifier.toLowerCase().includes(search)
        );
      });
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(project => {
        const now = Date.now() / 1000;
        const startDate = project.details?.startDate;
        const expiryDate = project.details?.expiryDate;
        const stats = project.stats;
        
        switch (activeFilter) {
          case 'active':
            return (!startDate || startDate <= now) && 
                   (!expiryDate || expiryDate > now) && 
                   (!stats || stats.completionPercentage < 100);
          case 'upcoming':
            return startDate && startDate > now;
          case 'completed':
            return stats && stats.completionPercentage >= 100;
          case 'expired':
            return expiryDate && expiryDate <= now && 
                   (!stats || stats.completionPercentage < 100);
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (activeSort === 'funding') {
      filtered.sort((a, b) => {
        const aAmount = a.stats?.amountInvested || a.amountInvested || 0;
        const bAmount = b.stats?.amountInvested || b.amountInvested || 0;
        return bAmount - aAmount;
      });
    } else if (activeSort === 'endDate') {
      filtered.sort((a, b) => {
        const aDate = a.details?.expiryDate || 0;
        const bDate = b.details?.expiryDate || 0;
        return aDate - bDate;
      });
    } else if (activeSort === 'investors') {
      filtered.sort((a, b) => {
        const aCount = a.stats?.investorCount || a.investorCount || 0;
        const bCount = b.stats?.investorCount || b.investorCount || 0;
        return bCount - aCount;
      });
    } else if (activeSort === 'newest') {
      filtered.sort((a, b) => {
        const aCreated = a.createdOnBlock || 0;
        const bCreated = b.createdOnBlock || 0;
        return bCreated - aCreated;
      });
    } else if (activeSort === 'amount') {
      filtered.sort((a, b) => {
        const aTarget = a.targetAmount || a.details?.targetAmount || a.stats?.targetAmount || 0;
        const bTarget = b.targetAmount || b.details?.targetAmount || b.stats?.targetAmount || 0;
        return bTarget - aTarget;
      });
    }

    return filtered;
  }, [allProjects, searchTerm, activeFilter, activeSort]);

  const projects = filteredProjects();

  // Calculate statistics from all available data sources (matching Angular sample logic)
  const statistics = useMemo(() => ({
    totalProjects: allProjects.length,
    activeProjects: allProjects.filter(p => {
      const now = Date.now() / 1000;
      const startDate = p.details?.startDate;
      const expiryDate = p.details?.expiryDate;
      const stats = p.stats;
      return (!startDate || startDate <= now) && 
             (!expiryDate || expiryDate > now) && 
             (!stats || stats.completionPercentage < 100);
    }).length,
    totalFunding: allProjects.reduce((sum, p) => {
      // Use the same logic as Angular sample: stats.amountInvested or fallback
      const amountInvested = p.stats?.amountInvested ?? p.amountInvested ?? 0;
      return sum + amountInvested;
    }, 0),
    totalInvestors: allProjects.reduce((sum, p) => {
      // Use the same logic as Angular sample: stats.investorCount or fallback
      const investorCount = p.stats?.investorCount ?? p.investorCount ?? 0;
      return sum + investorCount;
    }, 0),
    totalTargetAmount: allProjects.reduce((sum, p) => {
      // Use the same logic as Angular sample: details.targetAmount (from Nostr) or fallback
      const targetAmount = p.details?.targetAmount ?? p.targetAmount ?? 0;
      return sum + targetAmount;
    }, 0)
  }), [allProjects]);



  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = scrollTriggerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loadMore]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    setActiveSort('default');
  };

  const hasActiveFilters = searchTerm || activeFilter !== 'all' || activeSort !== 'default';

  const filterOptions: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: 'All Projects', icon: 'grid_view' },
    { value: 'active', label: 'Active', icon: 'play_circle' },
    { value: 'upcoming', label: 'Upcoming', icon: 'schedule' },
    { value: 'completed', label: 'Completed', icon: 'check_circle' },
    { value: 'expired', label: 'Expired', icon: 'cancel' }
  ];

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'funding', label: 'Most Funded' },
    { value: 'endDate', label: 'Ending Soon' },
    { value: 'investors', label: 'Most Investors' },
    { value: 'newest', label: 'Newest' },
    { value: 'amount', label: 'Highest Target' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-16 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
            Explore Projects
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Discover innovative projects and become part of the decentralized finance revolution.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="sticky top-4 z-30 px-4 mb-12">
        <div className="max-w-6xl mx-auto bg-card/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-border">
          <div className="flex items-center gap-4 p-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-10 h-11"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              variant={showMobileFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-3">
              <Select value={activeFilter} onValueChange={(value: FilterType) => setActiveFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeSort} onValueChange={(value: SortType) => setActiveSort(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-11 px-5 flex items-center rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                {projects.length} of {allProjects.length}
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="md:hidden border-t border-border p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={activeFilter} onValueChange={(value: FilterType) => setActiveFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={activeSort} onValueChange={(value: SortType) => setActiveSort(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-20">
        {isLoading && !allProjects.length ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 max-w-lg mx-auto">
            <SearchX className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold mb-4">No Projects Match Your Criteria</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {searchTerm 
                ? `No projects found for "${searchTerm}". Try adjusting your search terms or filters.`
                : 'Try adjusting your filters to see more projects.'
              }
            </p>
            <Button onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            {!isLoading && allProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                    <div className="text-2xl font-bold">{formatBTC(statistics.totalFunding)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(statistics.totalFunding)} sats
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
                      backing projects
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{network}</div>
                    <p className="text-xs text-muted-foreground">
                      Bitcoin {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Projects Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {projects.map((project) => (
                <AngorProjectCard
                  key={project.projectIdentifier}
                  project={project}
                />
              ))}
            </section>

            {/* Load More */}
            {!isComplete && (
              <>
                {isFetchingNextPage ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading more projects...</span>
                  </div>
                ) : hasNextPage ? (
                  <div className="text-center py-8">
                    <Button onClick={() => loadMore()} variant="outline">
                      Load More Projects
                    </Button>
                  </div>
                ) : null}
                <div ref={scrollTriggerRef} className="h-1" />
              </>
            )}

            {isComplete && projects.length > 0 && (
              <div className="text-center py-20">
                <div className="text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You've seen all {allProjects.length} projects!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
