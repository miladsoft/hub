import { useEffect, useState, useMemo } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useAngorProjects } from '@/hooks/useAngorData';
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer';
import { angorIndexer } from '@/services/angorIndexer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingProgress } from '@/components/LoadingProgress';
import { useDenyList } from '@/services/denyService';

export function DebugPage() {
  const { network, setNetwork } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [apiTestResult, setApiTestResult] = useState<string>('');
  
  // Get deny service
  const denyService = useDenyList();
  
  const { 
    projects: rawProjects, 
    isLoading, 
    error, 
    progress 
  } = useAngorProjects({ 
    limit: 10,
    enableAutoRefresh: false 
  });

  // Filter out denied projects
  const projects = useMemo(() => {
    const filtered = rawProjects.filter(project => {
      if (!project.project?.projectIdentifier) {
        console.log('⚠️ Project without identifier found, keeping it');
        return true;
      }
      
      const isDenied = denyService.isDenied(project.project.projectIdentifier);
      if (isDenied) {
        console.log(`🚫 Filtering out denied project: ${project.project.projectIdentifier}`);
      }
      return !isDenied;
    });
    
    if (rawProjects.length !== filtered.length) {
      addDebugInfo(`🚫 Filtered ${rawProjects.length - filtered.length} denied projects out of ${rawProjects.length} total`);
    }
    return filtered;
  }, [rawProjects, denyService]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testDirectAPI = async () => {
    try {
      addDebugInfo('Testing direct API call...');
      setApiTestResult('Loading...');
      const projects = await angorIndexer.getProjects(0, 5, network);
      setApiTestResult(`Success! Found ${projects.length} projects`);
      addDebugInfo(`Direct API test successful: ${projects.length} projects`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setApiTestResult(`Error: ${errorMsg}`);
      addDebugInfo(`Direct API test failed: ${errorMsg}`);
    }
  };

  useEffect(() => {
    addDebugInfo(`Network changed to: ${network}`);
  }, [network]);

  useEffect(() => {
    if (isLoading) {
      addDebugInfo(`Loading projects... Progress: ${progress.current}/${progress.total} - ${progress.stage}`);
    }
  }, [isLoading, progress]);

  useEffect(() => {
    if (projects.length > 0) {
      addDebugInfo(`Loaded ${projects.length} projects`);
    }
  }, [projects]);

  useEffect(() => {
    if (error) {
      addDebugInfo(`Error: ${error.message}`);
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Debug Page</h1>
        <p className="text-muted-foreground">Debug information for Angor project loading</p>
      </div>

      {/* Network Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Network Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              variant={network === 'mainnet' ? 'default' : 'outline'}
              onClick={() => setNetwork('mainnet')}
            >
              Switch to Mainnet
            </Button>
            <Button 
              variant={network === 'testnet' ? 'default' : 'outline'}
              onClick={() => setNetwork('testnet')}
            >
              Switch to Testnet
            </Button>
          </div>
          <Badge variant="outline">
            Current Network: {network}
          </Badge>
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle>Direct API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDirectAPI}>
            Test API Directly
          </Button>
          {apiTestResult && (
            <div className="p-3 bg-gray-100 rounded">
              <p className="text-sm">{apiTestResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingProgress progress={progress} />
          </CardContent>
        </Card>
      )}

      {/* Project Data */}
      <Card>
        <CardHeader>
          <CardTitle>Project Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Network:</strong> {network}</p>
            <p><strong>Primary Indexer:</strong> {primaryUrl}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error ? error.message : 'None'}</p>
            <p><strong>Projects Count:</strong> {projects.length}</p>
            
            {projects.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">First Project Sample:</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(projects[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Log */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-muted-foreground">No debug information yet...</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {info}
                </div>
              ))
            )}
          </div>
          <Button 
            className="mt-2" 
            variant="outline" 
            size="sm"
            onClick={() => setDebugInfo([])}
          >
            Clear Log
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
