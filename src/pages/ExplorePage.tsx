import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AngorProjectCard } from '@/components/AngorProjectCard';
import { ProjectsStatistics } from '@/components/ProjectsStatistics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  RotateCcw,
  X,
  Filter,
  SearchX,
  Target
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAngorProjects } from '@/hooks/useAngorProjects';
import { useIndexerCacheInvalidation } from '@/hooks/useIndexerCacheInvalidation';
import type { FilterType, SortType, NostrProfile } from '@/types/angor';

export function ExplorePage() {
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
            {/* Enhanced Statistics Overview using new component */}
            <ProjectsStatistics 
              projects={allProjects} 
              filteredProjects={projects}
              isLoading={isLoading}
            />

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
