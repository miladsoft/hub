import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, Target, TrendingUp, Bitcoin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AngorProject } from '@/types/angor';

interface AngorProjectCardProps {
  project: AngorProject;
}

export function AngorProjectCard({ project }: AngorProjectCardProps) {
  const navigate = useNavigate();
  
  const completionPercentage = project.stats?.completionPercentage || 
    (project.targetAmount && project.targetAmount > 0 && project.amountInvested 
      ? Math.round(((project.amountInvested || 0) / project.targetAmount) * 100) 
      : 0);
  
  const fundingProgress = Math.min(completionPercentage, 100);
  
  const status = project.stats?.status || 'active';
  const statusColor = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    expired: 'bg-red-500',
    upcoming: 'bg-yellow-500',
  }[status];

  const statusText = {
    active: 'Active',
    completed: 'Completed', 
    expired: 'Expired',
    upcoming: 'Upcoming',
  }[status];

  const formatBTC = (sats: number | undefined) => {
    if (!sats) return '0.00 BTC';
    return `${(sats / 100000000).toFixed(2)} BTC`;
  };

  const formatAmount = (amount: number | undefined) => {
    if (!amount || amount === 0) return '0';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  const daysRemaining = project.stats?.daysRemaining;
  const timeText = daysRemaining !== undefined 
    ? `${daysRemaining} days remaining`
    : 'No deadline';

  const handleViewProject = () => {
    navigate(`/project/${project.projectIdentifier}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`text-white ${statusColor} border-none`}>
            {statusText}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Bitcoin className="w-4 h-4 mr-1" />
            <span className="capitalize">{project.targetAmount ? formatBTC(project.targetAmount) : 'No target'}</span>
          </div>
        </div>

        {/* Project Title */}
        <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-600 transition-colors">
          {project.metadata?.name || `Project ${project.projectIdentifier.slice(0, 8)}...`}
        </h3>

        {/* Creator Info */}
        <div className="flex items-center space-x-2">
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={project.profile?.picture} 
              alt={project.profile?.name || 'Creator'} 
            />
            <AvatarFallback className="text-xs">
              {(project.profile?.name || project.founderKey)?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {project.profile?.name || `${project.founderKey.slice(0, 8)}...`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.metadata?.about || project.details?.description || 'No description available.'}
        </p>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium">{fundingProgress}%</span>
          </div>
          <Progress value={fundingProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatBTC(project.amountInvested || 0)} raised</span>
            <span>Goal: {formatBTC(project.targetAmount || 0)}</span>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center text-muted-foreground">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium">{formatAmount(project.investorCount || 0)}</div>
            <div className="text-xs text-muted-foreground">Investors</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center text-muted-foreground">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium">{formatAmount(project.targetAmount || 0)}</div>
            <div className="text-xs text-muted-foreground">Target</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium">{fundingProgress}%</div>
            <div className="text-xs text-muted-foreground">Progress</div>
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 mr-1" />
          <span>{timeText}</span>
        </div>

        {/* Category Badge */}
        {project.metadata?.category && (
          <Badge variant="outline" className="text-xs">
            {project.metadata.category}
          </Badge>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleViewProject}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
}
