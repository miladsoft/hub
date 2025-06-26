import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAngorProject, useAngorProjectStats } from '@/hooks/useAngorData';
import { useIndexerProject } from '@/hooks/useIndexerProject';
import { useProjectMetadata, useNostrProjectByEventId } from '@/services/nostrService';
import { useDenyList } from '@/services/denyService';

export function ProjectDebugPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Hooks
  const denyService = useDenyList();
  const { data: project, isLoading: projectLoading, error: projectError } = useAngorProject(projectId);
  const { data: stats, isLoading: statsLoading, error: statsError } = useAngorProjectStats(projectId);
  const { data: indexerProject, isLoading: indexerLoading, error: indexerError } = useIndexerProject(projectId);
  
  // Nostr data
  const eventId = indexerProject?.nostrEventId || project?.nostrEventId;
  const { data: nostrProjectData, isLoading: nostrProjectLoading, error: nostrProjectError } = useNostrProjectByEventId(eventId);
  const nostrPubKey = nostrProjectData?.nostrPubKey || project?.nostrPubKey || indexerProject?.nostrPubKey;
  const { data: projectMetadata, isLoading: metadataLoading, error: metadataError } = useProjectMetadata(nostrPubKey);

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (projectId) {
      addLog(`🔍 Starting debug for project: ${projectId}`);
      addLog(`🚫 Is denied: ${denyService.isDenied(projectId)}`);
      addLog(`🚫 Deny service loading: ${denyService.isLoading}`);
      if (denyService.error) {
        addLog(`🚫 Deny service error: ${denyService.error.message}`);
      }
    }
  }, [projectId, denyService]);

  useEffect(() => {
    if (project) {
      addLog(`✅ Project data loaded: ${JSON.stringify(project, null, 2)}`);
    } else if (projectError) {
      addLog(`❌ Project error: ${projectError}`);
    } else if (projectLoading) {
      addLog(`🔄 Project loading...`);
    }
  }, [project, projectError, projectLoading]);

  useEffect(() => {
    if (stats) {
      addLog(`📊 Stats loaded: ${JSON.stringify(stats, null, 2)}`);
    } else if (statsError) {
      addLog(`❌ Stats error: ${statsError}`);
    } else if (statsLoading) {
      addLog(`🔄 Stats loading...`);
    }
  }, [stats, statsError, statsLoading]);

  useEffect(() => {
    if (indexerProject) {
      addLog(`🗂️ Indexer project loaded: ${JSON.stringify(indexerProject, null, 2)}`);
    } else if (indexerError) {
      addLog(`❌ Indexer error: ${indexerError}`);
    } else if (indexerLoading) {
      addLog(`🔄 Indexer loading...`);
    }
  }, [indexerProject, indexerError, indexerLoading]);

  useEffect(() => {
    if (eventId) {
      addLog(`🎯 Event ID found: ${eventId}`);
    } else {
      addLog(`❌ No event ID found`);
    }
  }, [eventId]);

  useEffect(() => {
    if (nostrProjectData) {
      addLog(`🌐 Nostr project data loaded: ${JSON.stringify(nostrProjectData, null, 2)}`);
    } else if (nostrProjectError) {
      addLog(`❌ Nostr project error: ${nostrProjectError}`);
    } else if (nostrProjectLoading) {
      addLog(`🔄 Nostr project loading...`);
    }
  }, [nostrProjectData, nostrProjectError, nostrProjectLoading]);

  useEffect(() => {
    if (nostrPubKey) {
      addLog(`🔑 Nostr pubkey found: ${nostrPubKey}`);
    } else {
      addLog(`❌ No Nostr pubkey found`);
    }
  }, [nostrPubKey]);

  useEffect(() => {
    if (projectMetadata) {
      addLog(`📝 Project metadata loaded: ${JSON.stringify(projectMetadata, null, 2)}`);
    } else if (metadataError) {
      addLog(`❌ Metadata error: ${metadataError}`);
    } else if (metadataLoading) {
      addLog(`🔄 Metadata loading...`);
    }
  }, [projectMetadata, metadataError, metadataLoading]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Debug: {projectId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Project Loading:</strong> {projectLoading ? 'Yes' : 'No'}</div>
            <div><strong>Stats Loading:</strong> {statsLoading ? 'Yes' : 'No'}</div>
            <div><strong>Indexer Loading:</strong> {indexerLoading ? 'Yes' : 'No'}</div>
            <div><strong>Metadata Loading:</strong> {metadataLoading ? 'Yes' : 'No'}</div>
            <div><strong>Is Denied:</strong> {denyService.isDenied(projectId || '') ? 'Yes' : 'No'}</div>
            <div><strong>Event ID:</strong> {eventId || 'Not found'}</div>
            <div><strong>Nostr PubKey:</strong> {nostrPubKey || 'Not found'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {debugLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
