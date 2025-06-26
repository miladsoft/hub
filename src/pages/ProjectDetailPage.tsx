import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Share2,
  Heart,
  MessageCircle,
  Bitcoin,
  CheckCircle,
  AlertCircle,
  Info,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAngorProject, useAngorProjectStats, useAngorProjectInvestments } from '@/hooks/useAngorData';
import { useProjectMetadata, useNostrAdditionalData, useProjectUpdates, useNostrProjectByEventId } from '@/services/nostrService';
import { useIndexerProject } from '@/hooks/useIndexerProject';
import { useDenyList } from '@/services/denyService';
import { useNetwork } from '@/contexts/NetworkContext';
import { useSettings } from '@/hooks/useSettings';
import { formatBitcoinAmount } from '@/lib/formatCurrency';
import type { NostrProfile, ProjectMetadata, ProjectMedia } from '@/types/angor';

// Helper function outside of component to avoid React hooks issues
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

const safeFormatDistanceToNow = (timestamp: number | undefined) => {
  if (!timestamp || timestamp <= 0) return 'Unknown time';
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [investmentAmount, setInvestmentAmount] = useState('');

  // Get network and settings for currency formatting
  const { network } = useNetwork();
  const { settings } = useSettings();

  // Network-aware Bitcoin formatting function
  const formatBTC = (sats: number | undefined) => {
    if (!sats) return `0.00000000 ${network === 'testnet' ? 'TBTC' : 'BTC'}`;
    return formatBitcoinAmount(sats, { 
      network, 
      currency: settings.defaultCurrency,
      precision: 8
    });
  };

  // Check if project is denied - Always call hooks first
  const denyService = useDenyList();

  // Fetch project data - All hooks must be called before any conditional logic
  const { data: project, isLoading: projectLoading } = useAngorProject(projectId);
  const { data: stats, isLoading: statsLoading } = useAngorProjectStats(projectId);
  const { data: investments, isLoading: investmentsLoading } = useAngorProjectInvestments(projectId);
  const { data: indexerProject } = useIndexerProject(projectId);
  
  // Fetch Nostr data using event ID if available
  const eventId = indexerProject?.nostrEventId || project?.nostrEventId;
  const { data: nostrProjectData } = useNostrProjectByEventId(eventId);
  
  // Use the nostrPubKey from various sources including the fetched Nostr data
  const nostrPubKey = nostrProjectData?.nostrPubKey || project?.nostrPubKey || indexerProject?.nostrPubKey;
  
  // Fetch additional Nostr data
  const { data: projectMetadata } = useProjectMetadata(nostrPubKey);
  const { data: additionalData } = useNostrAdditionalData(nostrPubKey);
  const { data: updates } = useProjectUpdates(projectId);
  
  // Extract profile data from projectMetadata with type safety - Must be before early returns
  const profile = projectMetadata?.profile as NostrProfile | undefined;
  const projectData = projectMetadata?.project as ProjectMetadata | undefined;
  const mediaData = projectMetadata?.media as ProjectMedia | undefined;
  
  // Debug logging - Enhanced for Nostr project data and indexer data
  useEffect(() => {
    console.log('🔍 ProjectDetailPage - Debug Info for project:', projectId);
    console.log('� Project data:', project);
    console.log('📈 Stats data:', stats);
    console.log('🏛️ Indexer project data:', indexerProject);
    console.log('🆔 Event ID found:', eventId);
    console.log('🌟 Nostr project data from event:', nostrProjectData);
    console.log('🔗 Final Nostr PubKey used:', nostrPubKey);
    
    if (projectMetadata) {
      console.log('🔍 ProjectDetailPage - projectMetadata loaded:', projectMetadata);
      console.log('📋 Profile data:', profile);
      console.log('🎯 Project data:', projectData);
      console.log('🖼️ Media data:', mediaData);
    } else {
      console.log('❌ No projectMetadata loaded');
    }
    
    if (additionalData) {
      console.log('🌐 Additional Nostr data:', additionalData);
      console.log('🏗️ Additional Project data (3030/30078):', additionalData?.project);
    } else {
      console.log('❌ No additionalData loaded');
    }
    
    if (indexerProject) {
      console.log('🏛️ Indexer project data details:');
      console.log('🔗 Indexer founderKey:', indexerProject.founderKey);
      console.log('🧱 Indexer createdOnBlock:', indexerProject.createdOnBlock);
      console.log('📜 Indexer trxId:', indexerProject.trxId);
      console.log('🆔 Indexer nostrEventId:', indexerProject.nostrEventId);
      console.log('🔑 Indexer nostrPubKey:', indexerProject.nostrPubKey);
    }
  }, [projectId, project, stats, indexerProject, eventId, nostrProjectData, nostrPubKey, projectMetadata, profile, projectData, mediaData, additionalData]);
  
  // If project is denied, redirect to home or show error
  useEffect(() => {
    if (projectId && denyService.isDenied(projectId)) {
      console.warn(`🚫 Access denied to project: ${projectId}`);
      navigate('/', { replace: true });
      return;
    }
  }, [projectId, denyService, navigate]);

  // Don't render anything if project is denied
  if (projectId && denyService.isDenied(projectId)) {
    return null;
  }

  // Type-safe helper to check if media has gallery
  const hasGallery = (media: unknown): media is ProjectMedia & { gallery: NonNullable<ProjectMedia['gallery']> } => {
    return media != null && 
           typeof media === 'object' && 
           'gallery' in media && 
           Array.isArray((media as ProjectMedia).gallery) && 
           (media as ProjectMedia).gallery!.length > 0;
  };

  // Get gallery items from either source with type safety
  const getGalleryItems = () => {
    if (hasGallery(mediaData)) {
      return mediaData.gallery;
    }
    if (additionalData?.media && hasGallery(additionalData.media)) {
      return additionalData.media.gallery;
    }
    return [];
  };

  const isLoading = projectLoading || statsLoading || investmentsLoading;

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project || !stats) {
    return <ProjectNotFound />;
  }

  // Safe data extraction with fallbacks from all sources
  const completionPercentage = Math.min(stats?.completionPercentage || 0, 100);
  
  const timeRemaining = (project?.details?.expiryDate || additionalData?.project?.expiryDate)
    ? safeFormatDistanceToNow(project?.details?.expiryDate || additionalData?.project?.expiryDate)
    : 'No deadline';

  const statusColor = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    expired: 'bg-red-500',
    upcoming: 'bg-yellow-500',
  }[stats?.status || 'active'];

  // Get target amount from any available source (prioritize indexer, then stats, then additional data, then Nostr data)
  const targetAmount = indexerProject?.targetAmount || 
                      indexerProject?.details?.targetAmount ||
                      stats?.targetAmount || 
                      additionalData?.project?.targetAmount || 
                      project?.details?.targetAmount || 
                      (additionalData?.project as any)?.targetAmount ||
                      0;
  const amountInvested = indexerProject?.amountInvested || stats?.amountInvested || 0;
  const investorCount = indexerProject?.investorCount || stats?.investorCount || 0;

  return (
    <div className="min-h-screen">
      {/* Project Banner */}
      {(projectData?.banner || profile?.banner) && (
        <div className="relative h-64 w-full">
          <img 
            src={projectData?.banner || profile?.banner}
            alt="Project banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/explore')}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Discover</span>
      </Button>

      {/* Project Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant="secondary" className={`${statusColor} text-white`}>
                {(stats?.status || 'ACTIVE').toUpperCase()}
              </Badge>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h1 className="text-4xl font-bold">
              {projectData?.name || profile?.name || additionalData?.project?.projectIdentifier || project?.projectIdentifier || 'Unnamed Project'}
            </h1>

            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={projectData?.picture || profile?.picture} />
                <AvatarFallback>
                  {(projectData?.name || profile?.name)?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {profile?.display_name || profile?.name || 'Anonymous Creator'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Project Creator
                </div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">
              {projectData?.about || profile?.about || 'No description available'}
            </p>
          </div>

          {/* Funding Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{completionPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatBTC(amountInvested)}
                  </div>
                  <div className="text-sm text-muted-foreground">Raised</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(amountInvested)} sats
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatBTC(targetAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Goal</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(targetAmount)} sats
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {investorCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Investors</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {timeRemaining}
                  </div>
                  <div className="text-sm text-muted-foreground">Time Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Statistics */}
          {indexerProject && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {indexerProject.totalInvestmentsCount || indexerProject.investorCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Investments</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {indexerProject.penaltyDays || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Penalty Days</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {indexerProject.createdOnBlock?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Created Block</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">
                      {stats?.amountSpentSoFarByFounder ? formatBTC(stats.amountSpentSoFarByFounder) : '0 BTC'}
                    </div>
                    <div className="text-sm text-muted-foreground">Founder Spent</div>
                  </div>
                </div>

                {(stats?.amountInPenalties || stats?.countInPenalties) && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 text-red-600">Penalty Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">
                          {formatBTC(stats?.amountInPenalties || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Amount in Penalties</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">
                          {stats?.countInPenalties || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Penalty Count</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Investment Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                <span>Invest in Project</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(stats?.status === 'active' || !stats?.status) ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Investment Amount (BTC)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Minimum: 0.00001 BTC
                    </div>
                  </div>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Invest Now
                  </Button>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Secure Bitcoin escrow</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Milestone-based releases</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Refund protection</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="font-medium mb-2">Investment Closed</div>
                  <div className="text-sm text-muted-foreground">
                    This project is no longer accepting investments
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  {projectData?.about || profile?.about || 'Detailed project description will be available here once the creator provides more information.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Project Technical Details */}
          {(project?.details || additionalData?.project || indexerProject) && (
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Project Identifier</Label>
                    <div className="text-sm text-muted-foreground font-mono">
                      {nostrProjectData?.projectDetails?.projectIdentifier || 
                       additionalData?.project?.projectIdentifier || 
                       indexerProject?.projectIdentifier || 
                       project?.projectIdentifier || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nostr Public Key</Label>
                    <div className="text-sm text-muted-foreground font-mono break-all">
                      {nostrProjectData?.projectDetails?.nostrPubKey || 
                       additionalData?.project?.nostrPubKey || 
                       indexerProject?.nostrPubKey || 
                       project?.nostrPubKey || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Founder Key</Label>
                    <div className="text-sm text-muted-foreground font-mono break-all">
                      {nostrProjectData?.projectDetails?.founderKey || 
                       additionalData?.project?.founderKey || 
                       indexerProject?.founderKey || 'N/A'}
                    </div>
                  </div>

                  {indexerProject?.createdOnBlock && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Created on Block</Label>
                      <div className="text-sm text-muted-foreground">
                        {indexerProject.createdOnBlock.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {indexerProject?.trxId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Transaction ID</Label>
                      <div className="text-sm text-muted-foreground font-mono break-all">
                        {indexerProject.trxId}
                      </div>
                    </div>
                  )}

                  {indexerProject?.nostrEventId && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nostr Event ID</Label>
                      <div className="text-sm text-muted-foreground font-mono break-all">
                        {indexerProject.nostrEventId}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Founder Recovery Key</Label>
                    <div className="text-sm text-muted-foreground font-mono break-all">
                      {nostrProjectData?.projectDetails?.founderRecoveryKey || 
                       additionalData?.project?.founderRecoveryKey || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {(nostrProjectData?.projectDetails?.startDate || additionalData?.project?.startDate) ? 
                        new Date((nostrProjectData?.projectDetails?.startDate || additionalData?.project.startDate) * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        (project?.details?.startDate ? 
                          new Date(project.details.startDate * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'
                        )
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expiry Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {(nostrProjectData?.projectDetails?.expiryDate || additionalData?.project?.expiryDate) ? 
                        new Date((nostrProjectData?.projectDetails?.expiryDate || additionalData?.project.expiryDate) * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        (project?.details?.expiryDate ? 
                          new Date(project.details.expiryDate * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'
                        )
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Amount</Label>
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const targetAmount = nostrProjectData?.projectDetails?.targetAmount || additionalData?.project?.targetAmount;
                        return targetAmount ? 
                          `${formatBTC(targetAmount)} (${targetAmount.toLocaleString()} sats)` : 
                          (stats?.targetAmount ? `${formatBTC(stats.targetAmount)}` : 'N/A');
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Penalty Days</Label>
                    <div className="text-sm text-muted-foreground">
                      {(nostrProjectData?.projectDetails?.penaltyDays || additionalData?.project?.penaltyDays || indexerProject?.penaltyDays) ? 
                        `${nostrProjectData?.projectDetails?.penaltyDays || additionalData?.project?.penaltyDays || indexerProject?.penaltyDays} days` : 'N/A'
                      }
                    </div>
                  </div>

                  {indexerProject?.totalInvestmentsCount && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Total Investments Count</Label>
                      <div className="text-sm text-muted-foreground">
                        {indexerProject.totalInvestmentsCount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Stages */}
          {additionalData?.project?.stages && Array.isArray(additionalData?.project.stages) && additionalData?.project.stages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Stages (Milestones)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {additionalData?.project.stages.map((stage: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">Stage {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          Release Date: {stage.releaseDate ? 
                            new Date(stage.releaseDate * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {stage.amountToRelease}% of funds
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {additionalData?.project.targetAmount ? 
                            formatBTC((additionalData?.project.targetAmount * stage.amountToRelease) / 100) : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Seeders Information */}
          {additionalData?.project?.projectSeeders && (
            <Card>
              <CardHeader>
                <CardTitle>Project Seeders Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Threshold</Label>
                    <div className="text-sm text-muted-foreground">
                      {additionalData?.project.projectSeeders.threshold || 0}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Secret Hashes Count</Label>
                    <div className="text-sm text-muted-foreground">
                      {additionalData?.project.projectSeeders.secretHashes ? 
                        additionalData?.project.projectSeeders.secretHashes.length : 0
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media Gallery */}
          {(hasGallery(mediaData) || hasGallery(additionalData?.media)) && (
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getGalleryItems().map((item, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">
                        {item?.caption || `Media ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          {updates && updates.length > 0 ? (
            updates.map((update, index) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Update #{index + 1}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {safeFormatDistanceToNow(update.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{update.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Updates Yet</h3>
                <p className="text-muted-foreground">
                  The project creator hasn't posted any updates yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          {(additionalData?.faq && 'questions' in additionalData.faq && Array.isArray(additionalData.faq.questions) && additionalData.faq.questions.length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {additionalData.faq.questions.map((item, index: number) => {
                  const questions = additionalData.faq && 'questions' in additionalData.faq ? additionalData.faq.questions : [];
                  return (
                    <div key={index}>
                      <h4 className="font-medium mb-2">
                        {item && typeof item === 'object' && 'question' in item 
                          ? (item as { question: string }).question 
                          : `Question ${index + 1}`
                        }
                      </h4>
                      <p className="text-muted-foreground">
                        {item && typeof item === 'object' && 'answer' in item 
                          ? (item as { answer: string }).answer 
                          : 'No answer provided'
                        }
                      </p>
                      {index < questions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No FAQ Available</h3>
                <p className="text-muted-foreground">
                  The project creator hasn't provided FAQ information yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="investors" className="space-y-6">
          {investments && investments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Project Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments.slice(0, 10).map((investment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {investment.investorPublicKey.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {investment.investorPublicKey.slice(0, 8)}...{investment.investorPublicKey.slice(-8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {safeFormatDistanceToNow(investment.timeInvested)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatBTC(investment.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {investment.isSeeder && <Badge variant="secondary">Seeder</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Investors Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to invest in this project!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {(additionalData?.members && 'team' in additionalData.members && Array.isArray(additionalData.members.team) && additionalData.members.team.length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>Project Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {additionalData.members.team.map((member, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={
                          member && typeof member === 'object' && 'picture' in member 
                            ? (member as { picture?: string }).picture 
                            : undefined
                        } />
                        <AvatarFallback>
                          {member && typeof member === 'object' && 'name' in member 
                            ? ((member as { name?: string }).name?.charAt(0) || 'T')
                            : 'T'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {member && typeof member === 'object' && 'name' in member 
                            ? ((member as { name?: string }).name || 'Team Member')
                            : 'Team Member'
                          }
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {member && typeof member === 'object' && 'role' in member 
                            ? (member as { role?: string }).role 
                            : 'Team Member'
                          }
                        </p>
                        {member && typeof member === 'object' && 'bio' in member && (member as { bio?: string }).bio && (
                          <p className="text-sm">{(member as { bio: string }).bio}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Team Information</h3>
                <p className="text-muted-foreground">
                  Team information will be available once provided by the creator.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="raw-data" className="space-y-6">
          {/* Raw Nostr Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Nostr Data (Kind 3030 - Project Info)</CardTitle>
            </CardHeader>
            <CardContent>
              {additionalData?.project ? (
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(additionalData?.project, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No Kind 3030 project data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Additional Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Additional Data (Kind 30078)</CardTitle>
            </CardHeader>
            <CardContent>
              {additionalData ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">FAQ Data:</h4>
                    <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
                        {JSON.stringify(additionalData.faq, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Media Data:</h4>
                    <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
                        {JSON.stringify(additionalData.media, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Members Data:</h4>
                    <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
                        {JSON.stringify(additionalData.members, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No Kind 30078 additional data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Project Metadata Display */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Project Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              {projectMetadata ? (
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(projectMetadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No project metadata available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Indexer Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Indexer Data</CardTitle>
            </CardHeader>
            <CardContent>
              {indexerProject ? (
                <div className="bg-slate-900 text-blue-400 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(indexerProject, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No indexer data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Stats Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Stats Data</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="bg-slate-900 text-yellow-400 p-4 rounded-lg overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No stats data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="lg:col-span-1">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ProjectNotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/explore')}>
            Back to Discover
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
