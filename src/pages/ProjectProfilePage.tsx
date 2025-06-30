import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel } from '@/components/ui/carousel';
import { nip19 } from 'nostr-tools';
import { ArrowLeft, Share2, Bitcoin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAngorProject, useAngorProjectStats, useAngorProjectInvestments } from '@/hooks/useAngorData';
import { useProjectMetadata, useNostrAdditionalData, useProjectUpdates, useNostrProjectByEventId } from '@/services/nostrService';
import { useIndexerProject } from '@/hooks/useIndexerProject';

import { useAuthor } from '@/hooks/useAuthor';
import type { NostrProfile, ProjectMetadata, ProjectMedia } from '@/types/angor';


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

function TeamMemberProfile({ pubkey, index }: { pubkey: string; index: number }) {
  const hexPubkey = (() => {
    try {
      if (pubkey.startsWith('npub')) {
        const decoded = nip19.decode(pubkey);
        if (decoded.type === 'npub') return decoded.data;
      }
      return pubkey;
    } catch {
      return pubkey;
    }
  })();
  const author = useAuthor(hexPubkey);
  const metadata = author.data?.metadata;
  const isLoading = author.isLoading;
  const hasError = author.isError;
  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
        </div>
      </div>
    );
  }
  const displayName = metadata?.display_name || metadata?.name || `Team Member ${index + 1}`;
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback className="text-sm">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{displayName}</div>
        {metadata?.name && metadata?.display_name !== metadata?.name && (
          <div className="text-xs text-muted-foreground">@{metadata.name}</div>
        )}
        {metadata?.about && (
          <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{metadata.about}</div>
        )}
        {hasError && (
          <div className="text-xs text-yellow-600 mt-1">Profile data unavailable</div>
        )}
        <div className="text-xs text-muted-foreground/50 font-mono mt-1">
          {pubkey.startsWith('npub') ? `${pubkey.slice(0, 12)}...` : `${pubkey.slice(0, 16)}...`}
        </div>
      </div>
    </div>
  );
}

function formatBTC(sats: number | undefined) {
  // Use context hooks inside the component, not here
  // Instead, pass network and settings as arguments
  if (!sats) return `0.00000000 BTC`;
  // This is a placeholder, replace with your actual formatting logic if needed
  return `${(sats / 1e8).toFixed(8)} BTC`;
}

export function ProjectProfilePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: project, isLoading: projectLoading } = useAngorProject(projectId);
  const { data: stats, isLoading: statsLoading } = useAngorProjectStats(projectId);
  const { data: investments, isLoading: investmentsLoading } = useAngorProjectInvestments(projectId);
  const { data: indexerProject } = useIndexerProject(projectId);
  const eventId = indexerProject?.nostrEventId || project?.nostrEventId;
  const { data: nostrProjectData } = useNostrProjectByEventId(eventId);
  const nostrPubKey = nostrProjectData?.nostrPubKey || project?.nostrPubKey || indexerProject?.nostrPubKey;
  const { data: projectMetadata } = useProjectMetadata(nostrPubKey);
  const { data: additionalData } = useNostrAdditionalData(nostrPubKey);
  const { data: updates } = useProjectUpdates(projectId);
  const profile = projectMetadata?.profile as NostrProfile | undefined;
  const projectData = projectMetadata?.project as ProjectMetadata | undefined;
  const mediaData = projectMetadata?.media as ProjectMedia | undefined;
  const isLoading = projectLoading || statsLoading || investmentsLoading;
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><div className="h-10 w-32 bg-gray-200 rounded animate-pulse" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" /><div className="h-32 bg-gray-200 rounded animate-pulse" /><div className="h-48 bg-gray-200 rounded animate-pulse" /></div><div className="lg:col-span-1"><div className="h-64 bg-gray-200 rounded animate-pulse" /></div></div></div>;
  }
  if (!project || !stats) {
    return <div className="container mx-auto px-4 py-8"><Card><CardContent className="py-12 text-center"><h2 className="text-2xl font-bold mb-2">Project Not Found</h2><p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p><Button onClick={() => navigate('/explore')}>Back to Discover</Button></CardContent></Card></div>;
  }
  // Funding progress
  const targetAmount = indexerProject?.targetAmount || indexerProject?.details?.targetAmount || stats?.targetAmount || additionalData?.project?.targetAmount || project?.details?.targetAmount || 0;
  const amountInvested = indexerProject?.amountInvested || stats?.amountInvested || 0;
  const investorCount = indexerProject?.investorCount || stats?.investorCount || 0;
  const calculatedPercentage = targetAmount > 0 ? (amountInvested / targetAmount) * 100 : 0;
  const completionPercentage = Math.min(stats?.completionPercentage && stats.completionPercentage > 0 ? stats.completionPercentage : calculatedPercentage, 100);
  const timeRemaining = (project?.details?.expiryDate || additionalData?.project?.expiryDate)
    ? safeFormatDistanceToNow(project?.details?.expiryDate || additionalData?.project?.expiryDate)
    : 'No deadline';
  // Gallery
  const hasGallery = (media: unknown): media is ProjectMedia & { gallery: NonNullable<ProjectMedia['gallery']> } => {
    return media != null && typeof media === 'object' && 'gallery' in media && Array.isArray((media as ProjectMedia).gallery) && (media as ProjectMedia).gallery!.length > 0;
  };
  const getGalleryItems = () => {
    if (hasGallery(mediaData)) return mediaData.gallery;
    if (additionalData?.media && hasGallery(additionalData.media)) return additionalData.media.gallery;
    return [];
  };
  // Team
  const teamPubkeys = additionalData?.members && (additionalData.members as any).pubkeys && Array.isArray((additionalData.members as any).pubkeys)
    ? (additionalData.members as any).pubkeys : [];
  // Investors
  const investorList = investments || [];
  // FAQ
  const faqList = additionalData?.faq && Array.isArray(additionalData.faq) ? additionalData.faq : [];
  // Updates
  const updateList = updates || [];
  // Main render
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative w-full h-72 md:h-96 flex items-end bg-gradient-to-b from-angor-orange-light to-surface">
        {(projectData?.banner || profile?.banner) && (
          <img src={projectData?.banner || profile?.banner} alt="Project banner" className="absolute inset-0 w-full h-full object-cover z-0" />
        )}
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="container mx-auto px-4 pb-8 flex flex-col md:flex-row items-end gap-6 z-10 relative">
          <Avatar className="h-24 w-24 border-4 border-surface shadow-xl">
            <AvatarImage src={projectData?.picture || profile?.picture} />
            <AvatarFallback>{(projectData?.name || profile?.name || 'P').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{projectData?.name || profile?.name || project?.projectIdentifier || 'Unnamed Project'}</h1>
              <Badge variant="secondary" className="bg-angor-orange text-white text-xs px-3 py-1">{stats?.status?.toUpperCase() || 'ACTIVE'}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 items-center text-white/90">
              <span className="text-lg font-semibold">{formatBTC(amountInvested)} raised</span>
              <span className="text-lg">/ {formatBTC(targetAmount)} target</span>
              <span className="text-md">{investorCount} investors</span>
              <span className="text-md">{timeRemaining}</span>
            </div>
            <div className="mt-2 text-white/80 max-w-2xl line-clamp-2">{projectData?.about || profile?.about || 'No description available'}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" onClick={() => navigate('/explore')} className="text-white/80"><ArrowLeft className="h-5 w-5 mr-2" />Back</Button>
            <Button variant="secondary" className="bg-angor-orange text-white flex items-center gap-2"><Share2 className="h-4 w-4" />Share</Button>
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Funding Progress + Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bitcoin className="h-5 w-5 text-angor-orange" /> Funding Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <Progress value={completionPercentage} className="h-4" />
              <div className="flex gap-8 mt-2">
                <div><span className="font-bold text-lg">{formatBTC(amountInvested)}</span><div className="text-xs text-muted-foreground">Raised</div></div>
                <div><span className="font-bold text-lg">{formatBTC(targetAmount)}</span><div className="text-xs text-muted-foreground">Target</div></div>
                <div><span className="font-bold text-lg">{investorCount}</span><div className="text-xs text-muted-foreground">Investors</div></div>
                <div><span className="font-bold text-lg">{completionPercentage.toFixed(1)}%</span><div className="text-xs text-muted-foreground">Complete</div></div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Time remaining: {timeRemaining}</div>
            </div>
            <div className="w-full md:w-1/2">
              {/* Chart placeholder: Replace with real chart if available */}
              <div className="h-40 bg-angor-orange-light rounded-lg flex items-center justify-center text-angor-orange/70 font-bold">[Funding Chart]</div>
            </div>
          </CardContent>
        </Card>
        {/* Tabs for Overview, Updates, FAQ, Investors, Team, Media, Raw Data */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="investors">Investors</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Project Description</CardTitle></CardHeader>
              <CardContent><div className="prose max-w-none">{projectData?.about || profile?.about || 'No description available.'}</div></CardContent>
            </Card>
            {/* Project Stages Accordion */}
            {additionalData?.project?.stages && Array.isArray(additionalData.project.stages) && additionalData.project.stages.length > 0 && (
              <Accordion type="single" collapsible className="mt-6">
                {additionalData.project.stages.map((stage: any, idx: number) => (
                  <AccordionItem value={`stage-${idx}`} key={idx}>
                    <AccordionTrigger>Stage {idx + 1}: {stage.name || 'Unnamed Stage'}</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground">{stage.description || 'No description.'}</div>
                      <div className="mt-2 text-xs">Target: {formatBTC(stage.targetAmount)}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
          <TabsContent value="updates">
            {updateList.length > 0 ? (
              <Accordion type="single" collapsible>
                {updateList.map((update: any, idx: number) => (
                  <AccordionItem value={`update-${idx}`} key={update.id}>
                    <AccordionTrigger>{update.title || `Update #${idx + 1}`}</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs text-muted-foreground mb-2">{safeFormatDistanceToNow(update.created_at)}</div>
                      <div>{update.content}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No updates yet.</div>
            )}
          </TabsContent>
          <TabsContent value="faq">
            {faqList.length > 0 ? (
              <Accordion type="single" collapsible>
                {faqList.map((item: any, idx: number) => (
                  <AccordionItem value={`faq-${idx}`} key={idx}>
                    <AccordionTrigger>{item.question || `FAQ #${idx + 1}`}</AccordionTrigger>
                    <AccordionContent>{item.answer || 'No answer provided.'}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No FAQ available.</div>
            )}
          </TabsContent>
          <TabsContent value="investors">
            {investorList.length > 0 ? (
              <Card>
                <CardHeader><CardTitle>Investors</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead><tr><th className="text-left">Investor</th><th>Amount</th><th>Date</th></tr></thead>
                      <tbody>
                        {investorList.map((inv: any, idx: number) => (
                          <tr key={inv.id || idx} className="border-b last:border-0">
                            <td className="py-2 flex items-center gap-2">
                              <Avatar className="h-7 w-7"><AvatarFallback>{inv.pubkey?.slice(0, 2)}</AvatarFallback></Avatar>
                              <span className="font-mono text-xs">{inv.pubkey?.slice(0, 8)}...</span>
                            </td>
                            <td>{formatBTC(inv.amount)}</td>
                            <td>{safeFormatDistanceToNow(inv.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No investors yet.</div>
            )}
          </TabsContent>
          <TabsContent value="team">
            {teamPubkeys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamPubkeys.map((pubkey: string, idx: number) => (
                  <TeamMemberProfile key={pubkey} pubkey={pubkey} index={idx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No team information available.</div>
            )}
          </TabsContent>
          <TabsContent value="media">
            {getGalleryItems().length > 0 ? (
              <Carousel>
                {getGalleryItems().map((item: any, idx: number) => (
                  <img key={idx} src={item.url} alt={item.caption || `Media ${idx + 1}`} className="rounded-lg w-full max-h-96 object-contain" />
                ))}
              </Carousel>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No media gallery available.</div>
            )}
          </TabsContent>
          <TabsContent value="raw">
            <Card><CardHeader><CardTitle>Raw Project Data</CardTitle></CardHeader><CardContent><pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">{JSON.stringify({ project, stats, indexerProject, projectMetadata, additionalData }, null, 2)}</pre></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
