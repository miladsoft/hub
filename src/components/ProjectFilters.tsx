import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import type { ProjectFilters, FilterType, SortType } from '@/types/angor';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

const statusOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'newest', label: 'Newest First' },
  { value: 'funding', label: 'Most Funded' },
  { value: 'amount', label: 'Highest Goal' },
  { value: 'investors', label: 'Most Investors' },
  { value: 'endDate', label: 'Ending Soon' },
];

export function ProjectFiltersComponent({ 
  filters, 
  onFiltersChange, 
  totalCount = 0,
  filteredCount = 0,
  className = '' 
}: ProjectFiltersProps) {
  const updateFilters = (updates: Partial<ProjectFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    (filters.sortBy && filters.sortBy !== 'default')
  );

  return (
    <div className={`w-full ${className}`}>
      <Card className="w-full">
        <CardContent className="pt-4 pb-4">
          {/* Responsive Filters Layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            {/* Search - Takes more space */}
            <div className="flex-1 min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value: FilterType) => updateFilters({ status: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Filter */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <Select
                value={filters.sortBy || 'default'}
                onValueChange={(value: SortType) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
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

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="w-full sm:w-auto flex-shrink-0">
                <Button
                  variant="outline"
                  size="default"
                  onClick={clearFilters}
                  className="w-full sm:w-auto h-10 px-4"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Results Summary - Mobile only */}
          {filteredCount !== totalCount && (
            <div className="mt-3 flex justify-center sm:hidden">
              <Badge variant="secondary" className="text-xs">
                {filteredCount} of {totalCount} results
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
