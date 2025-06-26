import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { X, Filter, Search } from 'lucide-react';
import { useState } from 'react';
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

const categoryOptions = [
  'Technology',
  'Art',
  'Games',
  'Music',
  'Film',
  'Publishing',
  'Food',
  'Fashion',
  'Design',
  'Crafts',
  'Education',
  'Health',
  'Community',
  'Environment',
];

export function ProjectFiltersComponent({ 
  filters, 
  onFiltersChange, 
  totalCount = 0,
  filteredCount = 0,
  className = '' 
}: ProjectFiltersProps) {
  const [amountRange, setAmountRange] = useState([
    filters.minAmount || 0,
    filters.maxAmount || 1000000
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<ProjectFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setAmountRange([0, 1000000]);
  };

  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    filters.minAmount ||
    filters.maxAmount ||
    (filters.categories && filters.categories.length > 0) ||
    (filters.sortBy && filters.sortBy !== 'default')
  );

  const formatBTC = (sats: number) => {
    return `${(sats / 100000000).toFixed(2)} BTC`;
  };

  const addCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    if (!currentCategories.includes(category)) {
      updateFilters({
        categories: [...currentCategories, category]
      });
    }
  };

  const removeCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    updateFilters({
      categories: currentCategories.filter(c => c !== category)
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {filteredCount !== totalCount && (
              <span className="text-sm text-muted-foreground">
                {filteredCount} of {totalCount}
              </span>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Projects</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value: FilterType) => updateFilters({ status: value })}
          >
            <SelectTrigger>
              <SelectValue />
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

        {/* Sort */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>
          <Select
            value={filters.sortBy || 'default'}
            onValueChange={(value: SortType) => updateFilters({ sortBy: value })}
          >
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

        {/* Advanced Filters Toggle */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-start"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </div>

        {showAdvanced && (
          <>
            <Separator />

            {/* Funding Amount Range */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Funding Goal Range</label>
              <div className="px-3">
                <Slider
                  value={amountRange}
                  onValueChange={setAmountRange}
                  onValueCommit={(value) => {
                    updateFilters({
                      minAmount: value[0],
                      maxAmount: value[1]
                    });
                  }}
                  max={1000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatBTC(amountRange[0])}</span>
                <span>{formatBTC(amountRange[1])}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              
              {/* Selected Categories */}
              {filters.categories && filters.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {filters.categories.map(category => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeCategory(category)}
                    >
                      {category}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Available Categories */}
              <Select onValueChange={addCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Add category..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions
                    .filter(cat => !filters.categories?.includes(cat))
                    .map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
