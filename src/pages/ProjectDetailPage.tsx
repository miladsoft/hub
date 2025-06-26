import { useState } from 'react';
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
import { useNostrProfile, useNostrAdditionalData, useProjectUpdates } from '@/services/nostrService';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [investmentAmount, setInvestmentAmount] = useState('');

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useAngorProject(projectId);
  const { data: stats, isLoading: statsLoading } = useAngorProjectStats(projectId);
  const { data: investments, isLoading: investmentsLoading } = useAngorProjectInvestments(projectId);
  
  // Fetch Nostr data
  const { data: profile } = useNostrProfile(project?.nostrPubKey);
  const { data: additionalData } = useNostrAdditionalData(project?.nostrPubKey);
  const { data: updates } = useProjectUpdates(projectId);

  const isLoading = projectLoading || statsLoading || investmentsLoading;

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project || !stats) {
    return <ProjectNotFound />;
  }

  const formatBTC = (sats: number | undefined) => {
    if (!sats) return '0.00000000 BTC';
    return `${(sats / 100000000).toFixed(8)} BTC`;
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

  const safeFormatDistanceToNow = (timestamp: number | undefined) => {
    if (!timestamp || timestamp <= 0) return 'Unknown time';
    try {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return 'Invalid date';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const completionPercentage = Math.min(stats.completionPercentage, 100);
  
  const timeRemaining = project.details?.expiryDate
    ? safeFormatDistanceToNow(project.details.expiryDate)
    : 'No deadline';

  const statusColor = {
    active: 'bg-green-500',
    completed: 'bg-blue-500',
    expired: 'bg-red-500',
    upcoming: 'bg-yellow-500',
  }[stats.status];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/explore')}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Explore</span>
      </Button>

      {/* Project Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Badge variant="secondary" className={`${statusColor} text-white`}>
                {stats.status.toUpperCase()}
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
              {profile?.name || project.projectIdentifier}
            </h1>

            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.picture} />
                <AvatarFallback>
                  {profile?.name?.charAt(0) || 'A'}
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
              {profile?.about || 'No description available'}
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
                    {formatBTC(stats.amountInvested)}
                  </div>
                  <div className="text-sm text-muted-foreground">Raised</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(stats.amountInvested)} sats
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatBTC(stats.targetAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Goal</div>
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(stats.targetAmount)} sats
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.investorCount}
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
              {stats.status === 'active' ? (
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  {profile?.about || 'Detailed project description will be available here once the creator provides more information.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {(additionalData && additionalData.media && 'gallery' in additionalData.media && Array.isArray(additionalData.media.gallery) && additionalData.media.gallery.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {additionalData.media.gallery.map((item, index: number) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">
                        {item && typeof item === 'object' && 'caption' in item 
                          ? (item as { caption?: string }).caption || `Media ${index + 1}`
                          : `Media ${index + 1}`
                        }
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
      </Tabs>
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
            Back to Explore
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
