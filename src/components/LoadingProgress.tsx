import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress: {
    current: number;
    total: number;
    stage: string;
  };
  className?: string;
}

export function LoadingProgress({ progress, className = '' }: LoadingProgressProps) {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="py-12 px-8">
        <div className="max-w-md mx-auto space-y-6 text-center">
          {/* Loading Icon */}
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Loading Projects</h3>
            <p className="text-sm text-muted-foreground">
              {progress.stage || 'Preparing to load project data...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(percentage)}% complete</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-muted-foreground">
            Aggregating data from Angor Indexer API and Nostr Network...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
