import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AngorProjectCard, AngorProjectCardSkeleton } from '@/components/AngorProjectCard';
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
import { useDenyList, filterDeniedProjects } from '@/services/denyService';
import type { FilterType, SortType, AngorProject } from '@/types/angor';

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
    isComplete,
    error
  } = useAngorProjects({ 
    enabled: true
    // Remove automatic refetch - user can manually refresh if needed
  });

  // Deny list service
  const denyService = useDenyList();

  // Filter out denied projects from all projects for statistics
  const allProjectsFiltered = useMemo(() => {
    return filterDeniedProjects(allProjects, denyService);
  }, [allProjects, denyService]);

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

  // Filter and sort projects with improved search logic
  const filteredProjects = useMemo(() => {
    // Start with already filtered projects (denied projects removed)
    let filtered = allProjectsFiltered;
    const search = searchTerm.toLowerCase().trim();

    // Debug logging for initial state
    console.log('🔍 Filter Debug - Starting:', {
      totalProjects: allProjectsFiltered.length,
      searchTerm: search,
      activeFilter,
      activeSort,
      isLoading,
      hasProjects: allProjectsFiltered.length > 0,
      sampleProject: allProjectsFiltered[0] ? {
        id: allProjectsFiltered[0].projectIdentifier,
        name: allProjectsFiltered[0].metadata?.name || allProjectsFiltered[0].profile?.name,
        about: allProjectsFiltered[0].metadata?.about || allProjectsFiltered[0].profile?.about,
        hasMetadata: !!allProjectsFiltered[0].metadata,
        hasProfile: !!allProjectsFiltered[0].profile,
        hasStats: !!allProjectsFiltered[0].stats,
        hasDetails: !!allProjectsFiltered[0].details
      } : 'No projects available'
    });

    // Apply search filter with comprehensive field checking
    if (search) {
      const beforeSearchCount = filtered.length;
      filtered = filtered.filter(project => {
        // Check all possible name sources
        const projectName = project.metadata?.name || 
                           project.profile?.name || 
                           project.profile?.display_name || 
                           '';
        
        // Check all possible description sources
        const projectDescription = project.metadata?.about || 
                                  project.profile?.about || 
                                  '';
        
        // Check identifier
        const identifier = project.projectIdentifier || '';
        
        // Check category
        const category = project.metadata?.category || '';
        
        // Check tags
        const tags = project.metadata?.tags?.join(' ') || '';
        
        // Check website
        const website = project.metadata?.website || '';
        
        // Check founder key (partial match)
        const founderKey = project.founderKey || '';
        
        const matches = (
          projectName.toLowerCase().includes(search) ||
          projectDescription.toLowerCase().includes(search) ||
          identifier.toLowerCase().includes(search) ||
          category.toLowerCase().includes(search) ||
          tags.toLowerCase().includes(search) ||
          website.toLowerCase().includes(search) ||
          founderKey.toLowerCase().includes(search)
        );

        // Debug individual project matching
        if (process.env.NODE_ENV === 'development' && search.length > 2) {
          console.log(`🔍 Search test for "${search}" in project ${identifier}:`, {
            projectName: projectName || 'empty',
            projectDescription: projectDescription || 'empty',
            identifier: identifier || 'empty',
            category: category || 'empty',
            matches,
            nameMatch: projectName.toLowerCase().includes(search),
            descMatch: projectDescription.toLowerCase().includes(search),
            idMatch: identifier.toLowerCase().includes(search)
          });
        }

        return matches;
      });
      
      console.log('🔍 After search filter:', {
        searchTerm: search,
        beforeCount: beforeSearchCount,
        afterCount: filtered.length,
        filteredOut: beforeSearchCount - filtered.length
      });
    }

    // Apply status filter with improved logic
    if (activeFilter !== 'all') {
      const beforeFilterCount = filtered.length;
      filtered = filtered.filter(project => {
        const now = Date.now() / 1000;
        const startDate = project.details?.startDate;
        const expiryDate = project.details?.expiryDate;
        const stats = project.stats;
        const completionPercentage = stats?.completionPercentage || 0;
        
        let shouldInclude = false;
        
        switch (activeFilter) {
          case 'active': {
            // Active: Project has started and not expired and not fully funded
            const hasStarted = !startDate || startDate <= now;
            const notExpired = !expiryDate || expiryDate > now;
            const notCompleted = completionPercentage < 100;
            shouldInclude = hasStarted && notExpired && notCompleted;
            break;
          }
            
          case 'upcoming': {
            // Upcoming: Project hasn't started yet
            shouldInclude = startDate ? startDate > now : false;
            break;
          }
            
          case 'completed': {
            // Completed: Project is fully funded (100% or more)
            shouldInclude = completionPercentage >= 100;
            break;
          }
            
          case 'expired': {
            // Expired: Project has expired and not fully funded
            const hasExpired = expiryDate && expiryDate <= now;
            const stillNotCompleted = completionPercentage < 100;
            shouldInclude = Boolean(hasExpired && stillNotCompleted);
            break;
          }
            
          default: {
            shouldInclude = true;
          }
        }

        // Debug individual project filtering
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Filter "${activeFilter}" for project ${project.projectIdentifier}:`, {
            startDate: startDate ? new Date(startDate * 1000).toISOString() : 'none',
            expiryDate: expiryDate ? new Date(expiryDate * 1000).toISOString() : 'none',
            completionPercentage,
            now: new Date(now * 1000).toISOString(),
            shouldInclude,
            stats: project.stats ? 'has stats' : 'no stats',
            details: project.details ? 'has details' : 'no details'
          });
        }

        return shouldInclude;
      });
      
      console.log('📊 After status filter:', {
        filter: activeFilter,
        beforeCount: beforeFilterCount,
        afterCount: filtered.length,
        filteredOut: beforeFilterCount - filtered.length
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

    // Debug logging (only in development)
    console.log('✅ Final Filter Results:', {
      searchTerm,
      activeFilter,
      activeSort,
      allProjectsCount: allProjectsFiltered.length,
      filteredCount: filtered.length,
      isLoading,
      hasError: !!error,
      sampleFilteredProject: filtered[0] ? {
        name: filtered[0].metadata?.name || filtered[0].profile?.name || 'Unnamed',
        about: filtered[0].metadata?.about?.substring(0, 50) + '...' || 'No description',
        identifier: filtered[0].projectIdentifier,
        amount: filtered[0].stats?.amountInvested || filtered[0].amountInvested || 0
      } : 'No filtered projects'
    });

    return filtered;
  }, [allProjectsFiltered, searchTerm, activeFilter, activeSort, isLoading, error]);

  const projects = filteredProjects;



  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger if we have projects and there are more to load
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && !isComplete) {
          console.log('📜 Infinite scroll triggered - loading more projects');
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = scrollTriggerRef.current;
    if (currentRef && hasNextPage && !isComplete) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, loadMore, isComplete]);

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
                {projects.length} of {allProjectsFiltered.length}
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
        {/* Always show statistics at the top, even during loading or error */}
        <ProjectsStatistics 
          projects={allProjectsFiltered} 
          filteredProjects={projects}
          isLoading={isLoading}
        />

        {error ? (
          <div className="text-center py-20 max-w-lg mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-semibold mb-4">Error Loading Projects</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {error.message || 'There was an error loading the projects. Please try again.'}
            </p>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        ) : isLoading && !allProjectsFiltered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AngorProjectCardSkeleton count={6} />
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
            {/* Projects Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {projects.map((project: AngorProject) => (
                <AngorProjectCard
                  key={project.projectIdentifier}
                  project={project}
                />
              ))}
            </section>

            {/* Load More / End State */}
            {!isComplete && hasNextPage && (
              <>
                {isFetchingNextPage ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground font-medium">Loading more projects...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={() => loadMore()} variant="outline" size="lg">
                      Load More Projects
                    </Button>
                  </div>
                )}
                <div ref={scrollTriggerRef} className="h-1" />
              </>
            )}

            {/* End State - All projects loaded */}
            {isComplete && projects.length > 0 && (
              <div className="text-center py-16">
                <div className="text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-6 opacity-30" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">All Projects Loaded</h3>
                    <p className="text-sm">
                      You've viewed all {allProjectsFiltered.length} projects
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-4">
                      Refresh the page to check for new projects
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No more projects to load but not complete (edge case) */}
            {!hasNextPage && !isComplete && !isFetchingNextPage && projects.length > 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Target className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm">All available projects displayed</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
