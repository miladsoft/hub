import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Users, Target, Bitcoin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNostrProjectByEventId, useProjectMetadata } from '@/services/nostrService';
import type { AngorProject } from '@/types/angor';

interface AngorProjectCardProps {
  project: AngorProject;
}

export function AngorProjectCard({ project }: AngorProjectCardProps) {
  const navigate = useNavigate();
  
  // Fetch detailed project info from Nostr
  const { data: nostrProjectData } = useNostrProjectByEventId(project.nostrEventId);
  const { data: projectMetadata } = useProjectMetadata(nostrProjectData?.nostrPubKey);
  
  // Use Nostr data if available, fallback to indexer data
  const projectName = (projectMetadata?.profile as any)?.name || 
                     (projectMetadata?.project as any)?.name || 
                     project.metadata?.name || 
                     `Project ${project.projectIdentifier.slice(0, 8)}...`;
                     
  const projectDescription = (projectMetadata?.profile as any)?.about || 
                           (projectMetadata?.project as any)?.about || 
                           project.metadata?.about || 
                           project.details?.description || 
                           'No description available.';
                           
  const projectPicture = (projectMetadata?.profile as any)?.picture || 
                        (projectMetadata?.media as any)?.picture ||
                        project.metadata?.picture;
                        
  const projectBanner = (projectMetadata?.profile as any)?.banner || 
                       (projectMetadata?.media as any)?.banner ||
                       project.metadata?.banner;
  
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

  const handleViewProject = () => {
    navigate(`/project/${project.projectIdentifier}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group overflow-hidden p-0 h-full flex flex-col">
      {/* Banner - Full width cover from top */}
      <div className="relative h-40 w-full">
        {projectBanner ? (
          <img 
            src={projectBanner} 
            alt={`${projectName} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-orange-600" />
        )}
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Status Badge - Top left */}
        <div className="absolute top-3 left-3">
          <Badge className={`text-white ${statusColor} border-none text-xs shadow-md`}>
            {statusText}
          </Badge>
        </div>
        
        {/* Target Amount - Top right */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-black/60 text-white border-none text-xs shadow-md backdrop-blur-sm">
            <Bitcoin className="w-3 h-3 mr-1" />
            {project.targetAmount ? formatBTC(project.targetAmount) : 'No target'}
          </Badge>
        </div>
      </div>

      {/* Project Avatar - Overlapping banner (higher position) */}
      <div className="relative px-5">
        <div className="absolute -top-14 left-5">
          <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
            <AvatarImage 
              src={projectPicture} 
              alt={projectName}
              className="object-cover"
            />
            <AvatarFallback className="text-lg font-semibold bg-orange-100 text-orange-700">
              {projectName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content Section - Flexible grow */}
      <div className="px-5 pt-5 pb-5 flex flex-col flex-grow">
        {/* Project Title and Creator */}
        <div className="mb-4">
          <h3 className="font-bold text-lg leading-tight group-hover:text-orange-600 transition-colors mb-1">
            {projectName}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.6rem]">
            {projectDescription}
          </p>
        </div>

        {/* Funding Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Funding Progress</span>
            <span className="text-sm font-semibold text-orange-600">{fundingProgress}%</span>
          </div>
          <Progress value={fundingProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatBTC(project.amountInvested || 0)} raised</span>
            <span>Goal: {formatBTC(project.targetAmount || 0)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between text-center mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold">{formatAmount(project.investorCount || 0)}</div>
            <div className="text-xs text-muted-foreground">Investors</div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold">{formatAmount(project.targetAmount || 0)}</div>
            <div className="text-xs text-muted-foreground">Target</div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-center text-muted-foreground mb-1">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold">{daysRemaining || '∞'}</div>
            <div className="text-xs text-muted-foreground">Days left</div>
          </div>
        </div>

        {/* Category Tag */}
        {project.metadata?.category && (
          <div className="flex justify-start mb-4">
            <Badge variant="outline" className="text-xs">
              {project.metadata.category}
            </Badge>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-grow"></div>

        {/* Action Button - Always at bottom */}
        <Button 
          onClick={handleViewProject}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-auto"
        >
          View Project
        </Button>
      </div>
    </Card>
  );
}
