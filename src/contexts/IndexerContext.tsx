import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ANGOR_INDEXER_CONFIG, getPrimaryIndexerUrl } from '@/types/angor';
import type { IndexerConfig } from '@/types/angor';

interface IndexerContextType {
  indexers: IndexerConfig;
  setIndexers: (config: IndexerConfig) => void;
  addIndexer: (url: string, network: 'mainnet' | 'testnet') => boolean;
  removeIndexer: (url: string, network: 'mainnet' | 'testnet') => void;
  setPrimaryIndexer: (url: string, network: 'mainnet' | 'testnet') => void;
  getPrimaryUrl: (network: 'mainnet' | 'testnet') => string;
  resetToDefaults: () => void;
  testIndexerConnection: (url: string) => Promise<boolean>;
  saveConfiguration: () => void;
  loadConfiguration: () => void;
}

const IndexerContext = createContext<IndexerContextType | undefined>(undefined);

interface IndexerProviderProps {
  children: ReactNode;
}

export function IndexerProvider({ children }: IndexerProviderProps) {
  const [indexers, setIndexersState] = useState<IndexerConfig>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('angor:indexer-config');
    if (saved) {
      try {
        return JSON.parse(saved) as IndexerConfig;
      } catch (error) {
        console.error('Failed to parse saved indexer config:', error);
      }
    }
    return ANGOR_INDEXER_CONFIG;
  });

  // Save to localStorage whenever indexers change
  useEffect(() => {
    localStorage.setItem('angor:indexer-config', JSON.stringify(indexers));
  }, [indexers]);

  const setIndexers = (config: IndexerConfig) => {
    setIndexersState(config);
  };

  const addIndexer = (url: string, network: 'mainnet' | 'testnet'): boolean => {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.endsWith('/')) {
      normalizedUrl += '/';
    }

    // Check if already exists
    const exists = indexers[network].some(indexer => indexer.url === normalizedUrl);
    if (exists) {
      return false;
    }

    // Add new indexer
    setIndexersState(prev => ({
      ...prev,
      [network]: [
        ...prev[network],
        { url: normalizedUrl, isPrimary: prev[network].length === 0 }
      ]
    }));

    return true;
  };

  const removeIndexer = (url: string, network: 'mainnet' | 'testnet') => {
    setIndexersState(prev => {
      const filtered = prev[network].filter(indexer => indexer.url !== url);
      
      // If we removed the primary indexer, make the first one primary
      if (filtered.length > 0 && !filtered.some(i => i.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      
      return {
        ...prev,
        [network]: filtered
      };
    });
  };

  const setPrimaryIndexer = (url: string, network: 'mainnet' | 'testnet') => {
    setIndexersState(prev => ({
      ...prev,
      [network]: prev[network].map(indexer => ({
        ...indexer,
        isPrimary: indexer.url === url
      }))
    }));
  };

  const getPrimaryUrl = (network: 'mainnet' | 'testnet'): string => {
    const networkIndexers = indexers[network];
    const primary = networkIndexers.find(indexer => indexer.isPrimary);
    return primary ? primary.url : networkIndexers[0]?.url || getPrimaryIndexerUrl(network);
  };

  const resetToDefaults = () => {
    setIndexersState(ANGOR_INDEXER_CONFIG);
  };

  const testIndexerConnection = async (url: string): Promise<boolean> => {
    const endpoints = ['api/stats/heartbeat', 'api/stats'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${url}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.debug(`Connection test failed for ${endpoint}:`, error);
      }
    }

    return false;
  };

  const saveConfiguration = () => {
    localStorage.setItem('angor:indexer-config', JSON.stringify(indexers));
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('angor:indexer-config');
    if (saved) {
      try {
        const config = JSON.parse(saved) as IndexerConfig;
        setIndexersState(config);
      } catch (error) {
        console.error('Failed to load indexer configuration:', error);
      }
    }
  };

  const value = {
    indexers,
    setIndexers,
    addIndexer,
    removeIndexer,
    setPrimaryIndexer,
    getPrimaryUrl,
    resetToDefaults,
    testIndexerConnection,
    saveConfiguration,
    loadConfiguration,
  };

  return (
    <IndexerContext.Provider value={value}>
      {children}
    </IndexerContext.Provider>
  );
}

export function useIndexer() {
  const context = useContext(IndexerContext);
  if (context === undefined) {
    throw new Error('useIndexer must be used within an IndexerProvider');
  }
  return context;
}
