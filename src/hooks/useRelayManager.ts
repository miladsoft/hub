import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RelayManager, type RelayConfig } from '@/services/relayManager';

export interface RelayStatus {
  url: string;
  name: string;
  isConnected: boolean;
  responseTime?: number;
  lastChecked: number;
  errorCount: number;
}

export interface RelayStats {
  totalRelays: number;
  connectedRelays: number;
  connectionRate: number;
  avgResponseTime: number;
  lastUpdate: number;
}

const DEFAULT_RELAYS: RelayConfig[] = [
  { url: 'wss://relay.damus.io', name: 'Damus', isDefault: true },
  { url: 'wss://relay.primal.net', name: 'Primal', isDefault: true },
  { url: 'wss://nos.lol', name: 'Nos', isDefault: true },
  { url: 'wss://relay.angor.io', name: 'Angor', isDefault: true },
  { url: 'wss://relay2.angor.io', name: 'Angor 2', isDefault: true },
];

let relayManagerInstance: RelayManager | null = null;

function getRelayManager(): RelayManager {
  if (!relayManagerInstance) {
    relayManagerInstance = new RelayManager({
      defaultRelays: DEFAULT_RELAYS,
      storageKey: 'angor:relay-config',
      connectionTimeout: 10000
    });
  }
  return relayManagerInstance;
}

/**
 * Main hook for relay management
 */
export function useRelayManager() {
  const [relayManager] = useState(() => getRelayManager());
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);
  const queryClient = useQueryClient();

  // Get relay configuration
  const { data: relays = [], refetch: refetchRelays } = useQuery({
    queryKey: ['relay-config'],
    queryFn: () => relayManager.getRelays(),
    staleTime: 60000,
  });

  // Update relay statuses
  useEffect(() => {
    const updateStatuses = () => {
      const statuses = relays.map(relay => ({
        url: relay.url,
        name: relay.name,
        isConnected: relay.isConnected || false,
        responseTime: 0, // Would be measured from actual connections
        lastChecked: Date.now(),
        errorCount: 0, // Would track connection errors
      }));
      setRelayStatuses(statuses);
    };

    updateStatuses();
    const interval = setInterval(updateStatuses, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [relays]);

  // Add relay mutation
  const addRelayMutation = useMutation({
    mutationFn: async ({ url, name }: { url: string; name: string }) => {
      const success = relayManager.addRelay({ url, name, isDefault: false });
      if (!success) {
        throw new Error('Relay already exists or invalid URL');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay-config'] });
    },
  });

  // Remove relay mutation
  const removeRelayMutation = useMutation({
    mutationFn: async (url: string) => {
      const success = relayManager.removeRelay(url);
      if (!success) {
        throw new Error('Failed to remove relay');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay-config'] });
    },
  });

  // Connect to all relays
  const connectAllMutation = useMutation({
    mutationFn: async () => {
      await relayManager.connectToAllRelays();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay-config'] });
    },
  });

  // Disconnect from all relays
  const disconnectAllMutation = useMutation({
    mutationFn: async () => {
      relayManager.disconnectFromAllRelays();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relay-config'] });
    },
  });

  // Test relay connection
  const testRelayConnection = useCallback(async (url: string): Promise<boolean> => {
    try {
      return await relayManager.connectToRelay(url);
    } catch {
      return false;
    }
  }, [relayManager]);

  // Get relay statistics
  const getRelayStats = useCallback((): RelayStats => {
    const totalRelays = relayStatuses.length;
    const connectedRelays = relayStatuses.filter(r => r.isConnected).length;
    const connectionRate = totalRelays > 0 ? (connectedRelays / totalRelays) * 100 : 0;
    const avgResponseTime = relayStatuses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / Math.max(1, totalRelays);

    return {
      totalRelays,
      connectedRelays,
      connectionRate,
      avgResponseTime,
      lastUpdate: Date.now(),
    };
  }, [relayStatuses]);

  // Reset to default relays
  const resetToDefaults = useCallback(() => {
    relayManager.resetToDefaults();
    queryClient.invalidateQueries({ queryKey: ['relay-config'] });
  }, [relayManager, queryClient]);

  // Query events from relays
  const queryEvents = useCallback(async (filter: any, timeoutMs: number = 5000) => {
    return await relayManager.queryEvents(filter, timeoutMs);
  }, [relayManager]);

  // Publish event to relays
  const publishEvent = useCallback(async (event: any) => {
    return await relayManager.publishEvent(event);
  }, [relayManager]);

  return {
    // Data
    relays,
    relayStatuses,
    relayStats: getRelayStats(),
    
    // Actions
    addRelay: addRelayMutation.mutateAsync,
    removeRelay: removeRelayMutation.mutateAsync,
    connectAll: connectAllMutation.mutateAsync,
    disconnectAll: disconnectAllMutation.mutateAsync,
    testConnection: testRelayConnection,
    resetToDefaults,
    queryEvents,
    publishEvent,
    
    // Status
    isConnecting: connectAllMutation.isPending,
    isDisconnecting: disconnectAllMutation.isPending,
    isAddingRelay: addRelayMutation.isPending,
    isRemovingRelay: removeRelayMutation.isPending,
    
    // Refresh
    refetch: refetchRelays,
  };
}

/**
 * Hook for relay connectivity status
 */
export function useRelayConnectivity() {
  const { relayStatuses, relayStats } = useRelayManager();

  return {
    statuses: relayStatuses,
    stats: relayStats,
    isHealthy: relayStats.connectionRate >= 50, // At least 50% connected
    hasConnections: relayStats.connectedRelays > 0,
  };
}

/**
 * Hook for querying Nostr events across relays
 */
export function useNostrQuery(filter: any, options: { enabled?: boolean; timeout?: number } = {}) {
  const { enabled = true, timeout = 5000 } = options;
  const { queryEvents } = useRelayManager();

  return useQuery({
    queryKey: ['nostr-query', JSON.stringify(filter)],
    queryFn: () => queryEvents(filter, timeout),
    enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for publishing Nostr events
 */
export function useNostrPublish() {
  const { publishEvent } = useRelayManager();

  return useMutation({
    mutationFn: async (event: any) => {
      const success = await publishEvent(event);
      if (!success) {
        throw new Error('Failed to publish event to any relay');
      }
      return success;
    },
  });
}

/**
 * Hook for advanced relay metrics
 */
export function useRelayMetrics(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;
  const { relayStatuses } = useRelayManager();

  return useQuery({
    queryKey: ['relay-metrics'],
    queryFn: async () => {
      // Calculate advanced metrics
      const now = Date.now();
      const recentChecks = relayStatuses.filter(r => now - r.lastChecked < 60000); // Last minute
      
      return {
        uptime: recentChecks.length > 0 
          ? recentChecks.filter(r => r.isConnected).length / recentChecks.length * 100 
          : 0,
        avgResponseTime: recentChecks.reduce((sum, r) => sum + (r.responseTime || 0), 0) / Math.max(1, recentChecks.length),
        errorRate: recentChecks.length > 0 
          ? recentChecks.reduce((sum, r) => sum + r.errorCount, 0) / recentChecks.length * 100 
          : 0,
        totalErrors: relayStatuses.reduce((sum, r) => sum + r.errorCount, 0),
        lastUpdate: now,
      };
    },
    enabled,
    refetchInterval,
    staleTime: 15000,
  });
}

/**
 * Utility function to validate relay URL
 */
export function validateRelayUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      return { isValid: false, error: 'Relay URL must use ws:// or wss:// protocol' };
    }
    
    if (!parsed.hostname) {
      return { isValid: false, error: 'Invalid hostname' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Utility function to generate relay name from URL
 */
export function generateRelayName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^(www\.|relay\.)/, '').split('.')[0];
  } catch {
    return 'Unknown Relay';
  }
}
