import { useQuery } from '@tanstack/react-query';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCurrentIndexer } from './useCurrentIndexer';

export interface NetworkStats {
  connections: number;
  blockHeight: number;
  mempool: {
    count: number;
    size: number;
    totalFees: number;
  };
  difficulty: number;
  hashRate: number;
  supply: {
    circulating: number;
    total: number;
    max: number;
    rewards: number;
    height: number;
  };
}

export interface BlockInfo {
  hash: string;
  height: number;
  timestamp: number;
  size: number;
  transactions: number;
  difficulty: number;
  nonce: number;
  version: number;
  merkleRoot: string;
  previousBlockHash: string;
}

export interface MempoolInfo {
  count: number;
  size: number;
  usage: number;
  totalFees: number;
  feeHistogram: Array<{
    feeRate: number;
    count: number;
    size: number;
  }>;
}

/**
 * Hook to fetch network statistics
 */
export function useNetworkStats(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 30000 } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery<NetworkStats>({
    queryKey: ['network-stats', network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const response = await fetch(`${primaryUrl}api/stats/network`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch current block information
 */
export function useCurrentBlock(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery<BlockInfo>({
    queryKey: ['current-block', network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const response = await fetch(`${primaryUrl}api/blocks/tip`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch recent blocks
 */
export function useRecentBlocks(
  limit: number = 10, 
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery<BlockInfo[]>({
    queryKey: ['recent-blocks', limit, network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const response = await fetch(`${primaryUrl}api/blocks?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch mempool information
 */
export function useMempoolInfo(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { enabled = true, refetchInterval = 15000 } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery<MempoolInfo>({
    queryKey: ['mempool-info', network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const response = await fetch(`${primaryUrl}api/mempool`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval,
    staleTime: 15000, // 15 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch Bitcoin supply information
 */
export function useBitcoinSupply(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery({
    queryKey: ['bitcoin-supply', network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const response = await fetch(`${primaryUrl}api/insight/supply`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to test indexer heartbeat
 */
export function useIndexerHeartbeat(url?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { primaryUrl } = useCurrentIndexer();
  const targetUrl = url || primaryUrl;

  return useQuery<boolean>({
    queryKey: ['indexer-heartbeat', targetUrl],
    queryFn: async () => {
      if (!targetUrl) return false;

      try {
        const response = await fetch(`${targetUrl}api/stats/heartbeat`, {
          signal: AbortSignal.timeout(5000)
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    enabled: enabled && !!targetUrl,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
    gcTime: 60000,
  });
}

/**
 * Hook to get indexer performance metrics
 */
export function useIndexerMetrics(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { network } = useNetwork();
  const { primaryUrl } = useCurrentIndexer();

  return useQuery({
    queryKey: ['indexer-metrics', network, primaryUrl],
    queryFn: async () => {
      if (!primaryUrl) throw new Error('No indexer URL available');

      const [heartbeat, mempool] = await Promise.allSettled([
        fetch(`${primaryUrl}api/stats/heartbeat`).then(r => r.ok),
        fetch(`${primaryUrl}api/mempool`).then(r => r.ok ? r.json() : null)
      ]);

      return {
        isOnline: heartbeat.status === 'fulfilled' ? heartbeat.value : false,
        hasMempoolData: mempool.status === 'fulfilled' && mempool.value !== null,
        responseTime: 0, // Would measure actual response time
        lastChecked: Date.now()
      };
    },
    enabled: enabled && !!primaryUrl,
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Format Bitcoin amount from satoshis
 */
export function formatBitcoinAmount(satoshis: number, decimals: number = 8): string {
  const btc = satoshis / 100000000;
  return `${btc.toFixed(decimals)} BTC`;
}

/**
 * Format hash rate
 */
export function formatHashRate(hashRate: number): string {
  if (hashRate >= 1e18) {
    return `${(hashRate / 1e18).toFixed(2)} EH/s`;
  } else if (hashRate >= 1e15) {
    return `${(hashRate / 1e15).toFixed(2)} PH/s`;
  } else if (hashRate >= 1e12) {
    return `${(hashRate / 1e12).toFixed(2)} TH/s`;
  } else if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} GH/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} MH/s`;
  } else {
    return `${hashRate.toFixed(2)} H/s`;
  }
}

/**
 * Format bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
}

/**
 * Format difficulty
 */
export function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)} T`;
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)} B`;
  } else if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(2)} M`;
  } else if (difficulty >= 1e3) {
    return `${(difficulty / 1e3).toFixed(2)} K`;
  } else {
    return difficulty.toFixed(2);
  }
}
