import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ANGOR_RELAY_POOL } from '@/types/angor';

export interface RelayEntry {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  read: boolean;
  write: boolean;
  isDefault?: boolean;
}

export interface RelayConfig {
  mainnet: RelayEntry[];
  testnet: RelayEntry[];
}

interface RelayContextType {
  relays: RelayConfig;
  setRelays: (config: RelayConfig) => void;
  addRelay: (url: string, network: 'mainnet' | 'testnet') => boolean;
  removeRelay: (url: string, network: 'mainnet' | 'testnet') => void;
  toggleRelayPermission: (url: string, network: 'mainnet' | 'testnet', type: 'read' | 'write') => void;
  updateRelayStatus: (url: string, network: 'mainnet' | 'testnet', status: RelayEntry['status']) => void;
  resetToDefaults: () => Promise<void>;
  testRelayConnection: (url: string) => Promise<boolean>;
  connectToRelay: (url: string, network: 'mainnet' | 'testnet') => Promise<boolean>;
  disconnectFromRelay: (url: string, network: 'mainnet' | 'testnet') => void;
}

const RelayContext = createContext<RelayContextType | undefined>(undefined);

export { RelayContext };

interface RelayProviderProps {
  children: ReactNode;
}

// Default relay configuration
const getDefaultRelayConfig = (): RelayConfig => ({
  mainnet: ANGOR_RELAY_POOL.mainnet.map((url) => ({
    url,
    status: 'disconnected' as const,
    read: true,
    write: true, // All relays have read and write permission by default
    isDefault: true
  })),
  testnet: ANGOR_RELAY_POOL.testnet.map((url) => ({
    url,
    status: 'disconnected' as const,
    read: true,
    write: true, // All relays have read and write permission by default
    isDefault: true
  }))
});

export function RelayProvider({ children }: RelayProviderProps) {
  const [relays, setRelaysState] = useState<RelayConfig>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('angor:relay-config');
    if (saved) {
      try {
        return JSON.parse(saved) as RelayConfig;
      } catch (error) {
        console.error('Failed to parse saved relay config:', error);
      }
    }
    return getDefaultRelayConfig();
  });

  // Save to localStorage whenever relays change
  useEffect(() => {
    localStorage.setItem('angor:relay-config', JSON.stringify(relays));
  }, [relays]);

  const setRelays = (config: RelayConfig) => {
    setRelaysState(config);
  };

  const addRelay = (url: string, network: 'mainnet' | 'testnet'): boolean => {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('wss://') && !normalizedUrl.startsWith('ws://')) {
      normalizedUrl = `wss://${normalizedUrl}`;
    }

    // Check if already exists
    const exists = relays[network].some(relay => relay.url === normalizedUrl);
    if (exists) {
      return false;
    }

    // Add new relay
    setRelaysState(prev => ({
      ...prev,
      [network]: [
        ...prev[network],
        { 
          url: normalizedUrl, 
          status: 'disconnected',
          read: true,
          write: true, // New relays also get write permission by default
          isDefault: false
        }
      ]
    }));

    return true;
  };

  const removeRelay = (url: string, network: 'mainnet' | 'testnet') => {
    setRelaysState(prev => ({
      ...prev,
      [network]: prev[network].filter(relay => relay.url !== url)
    }));
  };

  const toggleRelayPermission = (url: string, network: 'mainnet' | 'testnet', type: 'read' | 'write') => {
    setRelaysState(prev => ({
      ...prev,
      [network]: prev[network].map(relay => 
        relay.url === url 
          ? { ...relay, [type]: !relay[type] }
          : relay
      )
    }));
  };

  const updateRelayStatus = (url: string, network: 'mainnet' | 'testnet', status: RelayEntry['status']) => {
    setRelaysState(prev => ({
      ...prev,
      [network]: prev[network].map(relay => 
        relay.url === url 
          ? { ...relay, status }
          : relay
      )
    }));
  };

  const resetToDefaults = async () => {
    setRelaysState(getDefaultRelayConfig());
    
    // Re-connect to all default relays after reset
    setTimeout(async () => {
      const defaultConfig = getDefaultRelayConfig();
      
      // Connect to mainnet relays
      for (const relay of defaultConfig.mainnet) {
        try {
          await connectToRelay(relay.url, 'mainnet');
        } catch (error) {
          console.warn(`Failed to connect to mainnet relay ${relay.url} after reset:`, error);
        }
      }

      // Connect to testnet relays
      for (const relay of defaultConfig.testnet) {
        try {
          await connectToRelay(relay.url, 'testnet');
        } catch (error) {
          console.warn(`Failed to connect to testnet relay ${relay.url} after reset:`, error);
        }
      }
    }, 500); // Small delay to ensure state is updated
  };

  const testRelayConnection = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          // If it connected and then closed normally, consider it successful
          resolve(event.wasClean || event.code === 1000);
        };
      } catch (error) {
        console.error('WebSocket test error:', error);
        resolve(false);
      }
    });
  };

  const connectToRelay = async (url: string, network: 'mainnet' | 'testnet'): Promise<boolean> => {
    updateRelayStatus(url, network, 'connecting');
    
    try {
      const success = await testRelayConnection(url);
      updateRelayStatus(url, network, success ? 'connected' : 'error');
      return success;
    } catch (err) {
      updateRelayStatus(url, network, 'error');
      console.error('Failed to connect to relay:', err);
      return false;
    }
  };

  const disconnectFromRelay = (url: string, network: 'mainnet' | 'testnet') => {
    updateRelayStatus(url, network, 'disconnected');
  };

  // Auto-connect to all relays on startup
  useEffect(() => {
    const connectAllRelays = async () => {
      // Connect to mainnet relays
      for (const relay of relays.mainnet) {
        if (relay.status === 'disconnected') {
          try {
            await connectToRelay(relay.url, 'mainnet');
          } catch (error) {
            console.warn(`Failed to connect to mainnet relay ${relay.url}:`, error);
          }
        }
      }

      // Connect to testnet relays
      for (const relay of relays.testnet) {
        if (relay.status === 'disconnected') {
          try {
            await connectToRelay(relay.url, 'testnet');
          } catch (error) {
            console.warn(`Failed to connect to testnet relay ${relay.url}:`, error);
          }
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(connectAllRelays, 1000);
    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  const value = {
    relays,
    setRelays,
    addRelay,
    removeRelay,
    toggleRelayPermission,
    updateRelayStatus,
    resetToDefaults,
    testRelayConnection,
    connectToRelay,
    disconnectFromRelay,
  };

  return (
    <RelayContext.Provider value={value}>
      {children}
    </RelayContext.Provider>
  );
}

export function useRelay() {
  const context = useContext(RelayContext);
  if (context === undefined) {
    throw new Error('useRelay must be used within a RelayProvider');
  }
  return context;
}
