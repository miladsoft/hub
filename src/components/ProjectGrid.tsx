import { AngorProjectCard } from './AngorProjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Bitcoin } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Badge } from '@/components/ui/badge';
import type { AngorProject } from '@/types/angor';

interface ProjectGridProps {
  projects: AngorProject[];
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
}

function ProjectSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Title and Creator */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-5 w-18" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Buttons */}
        <div className="flex space-x-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  const { network } = useNetwork();
  
  return (
    <div className="col-span-full">
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="space-y-2">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No Projects Found</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-center">
                <Badge 
                  variant={network === 'mainnet' ? 'default' : 'secondary'}
                  className={`text-sm ${
                    network === 'mainnet' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  <Bitcoin className="h-4 w-4 mr-1" />
                  {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                No projects found on Bitcoin {network === 'mainnet' ? 'Mainnet' : 'Testnet'}. 
                Try adjusting your filters or switch networks to discover more projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="col-span-full">
      <Card className="border-destructive">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium text-destructive">
              Error Loading Projects
            </h3>
            <p className="text-muted-foreground text-sm">
              {error.message || 'An unexpected error occurred while loading projects.'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Try refreshing the page
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectGrid({ 
  projects, 
  isLoading = false, 
  error = null,
  className = '' 
}: ProjectGridProps) {
  if (error) {
    return (
      <div className={`grid gap-6 ${className}`}>
        <ErrorState error={error} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <ProjectSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`grid gap-6 ${className}`}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => (
        <AngorProjectCard
          key={project.projectIdentifier}
          project={project}
        />
      ))}
    </div>
  );
}
