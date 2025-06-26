import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type NetworkType = 'mainnet' | 'testnet';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType, updateUrl?: boolean) => void;
  switchToMainnet: () => void;
  switchToTestnet: () => void;
  isMainnet: boolean;
  isTestnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [network, setNetworkState] = useState<NetworkType>(() => {
    // Check URL parameters first for network setting
    const urlParams = new URLSearchParams(window.location.search);
    const networkParam = urlParams.get('network');
    
    if (networkParam === 'mainnet' || networkParam === 'testnet') {
      localStorage.setItem('angor:network', networkParam);
      // Remove network param from URL after initial load
      removeNetworkParamFromUrl();
      return networkParam;
    }
    
    // Fall back to localStorage or default to mainnet
    const saved = localStorage.getItem('angor:network');
    return (saved as NetworkType) || 'mainnet';
  });

  const removeNetworkParamFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('network');
    window.history.replaceState({}, '', url);
  };

  const setNetwork = (newNetwork: NetworkType, updateUrl: boolean = false) => {
    if (network !== newNetwork) {
      setNetworkState(newNetwork);
      localStorage.setItem('angor:network', newNetwork);
      
      if (updateUrl) {
        // Remove network param from URL instead of updating it
        removeNetworkParamFromUrl();
      }
      
      // Reload page to reinitialize with new network
      window.location.reload();
    }
  };

  const switchToMainnet = () => setNetwork('mainnet');
  const switchToTestnet = () => setNetwork('testnet');

  useEffect(() => {
    // Save to localStorage whenever network changes
    localStorage.setItem('angor:network', network);
  }, [network]);

  const value = {
    network,
    setNetwork,
    switchToMainnet,
    switchToTestnet,
    isMainnet: network === 'mainnet',
    isTestnet: network === 'testnet',
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
