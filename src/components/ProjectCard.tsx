import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, Target, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '@/contexts/NetworkContext';
import { useSettings } from '@/hooks/useSettings';
import { formatProjectAmount } from '@/lib/formatCurrency';
import type { IndexedProject } from '@/types/angor';

interface ProjectCardProps {
  project: IndexedProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { network } = useNetwork();
  const { settings } = useSettings();
  
  const {
    project: angorProject,
    stats,
    profile,
    projectData,
  } = project;

  const completionPercentage = stats.completionPercentage;
  const fundingProgress = Math.min(completionPercentage, 100);
  
  const statusColor = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    expired: 'bg-red-500',
    upcoming: 'bg-yellow-500',
  }[stats.status];

  // Format amounts based on network and currency settings
  const raisedAmount = formatProjectAmount(stats.amountInvested, network, settings.defaultCurrency);
  const goalAmount = formatProjectAmount(stats.targetAmount, network, settings.defaultCurrency);

  const timeRemaining = projectData.expiryDate 
    ? formatDistanceToNow(new Date(projectData.expiryDate * 1000), { addSuffix: true })
    : 'No deadline';

  const handleViewDetails = () => {
    navigate(`/project/${angorProject.projectIdentifier}`);
  };

  const handleInvest = () => {
    navigate(`/project/${angorProject.projectIdentifier}?tab=invest`);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 hover:border-l-orange-600">
      <CardHeader className="space-y-4">
        {/* Project Status and Category */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`${statusColor} text-white`}>
            {stats.status.toUpperCase()}
          </Badge>
          <div className="text-sm text-muted-foreground">
            #{angorProject.projectIdentifier}
          </div>
        </div>

        {/* Project Title and Creator */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-orange-600 transition-colors">
            {profile.name || angorProject.projectIdentifier}
          </h3>
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profile.picture} />
              <AvatarFallback className="text-xs">
                {profile.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {profile.display_name || profile.name || 'Anonymous'}
            </span>
          </div>
        </div>

        {/* Project Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {profile.about || 'No description available'}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium">{fundingProgress.toFixed(1)}%</span>
          </div>
          <Progress value={fundingProgress} className="h-2" />
        </div>

        {/* Funding Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Raised</span>
            </div>
            <div className="font-medium">
              {raisedAmount.primary}
            </div>
            {raisedAmount.secondary && (
              <div className="text-xs text-muted-foreground">
                {raisedAmount.secondary}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Goal</span>
            </div>
            <div className="font-medium">
              {goalAmount.primary}
            </div>
            {goalAmount.secondary && (
              <div className="text-xs text-muted-foreground">
                {goalAmount.secondary}
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{stats.investorCount} investors</span>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarDays className="h-3 w-3" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
        {stats.status === 'active' && (
          <Button 
            size="sm" 
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            onClick={handleInvest}
          >
            Invest
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
