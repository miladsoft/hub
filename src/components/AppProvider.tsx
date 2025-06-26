import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppContext, type AppConfig, type AppContextType, type Theme, type GlobalLoadingState } from '@/contexts/AppContext';

interface AppProviderProps {
  children: ReactNode;
  /** Application storage key */
  storageKey: string;
  /** Default app configuration */
  defaultConfig: AppConfig;
  /** Optional list of preset relays to display in the RelaySelector */
  presetRelays?: { name: string; url: string }[];
}

export function AppProvider(props: AppProviderProps) {
  const {
    children,
    storageKey,
    defaultConfig,
    presetRelays,
  } = props;

  // App configuration state with localStorage persistence
  const [config, setConfig] = useLocalStorage<AppConfig>(storageKey, defaultConfig);
  
  // Global loading state
  const [loading, setLoadingState] = useState<GlobalLoadingState>({ isLoading: false });

  // Stable setLoading function
  const setLoading = useCallback((newLoading: GlobalLoadingState) => {
    setLoadingState(newLoading);
  }, []);

  // Generic config updater with callback pattern
  const updateConfig = (updater: (currentConfig: AppConfig) => AppConfig) => {
    setConfig(updater);
  };

  // Merge preset relays with custom relays
  const mergedRelays = React.useMemo(() => {
    const customRelays = config.customRelays || [];
    const presetRelayUrls = new Set((presetRelays || []).map(r => r.url));
    
    // Add custom relays that are not already in preset relays
    const customRelayItems = customRelays
      .filter(url => !presetRelayUrls.has(url))
      .map(url => ({
        url,
        name: `Custom (${url.replace(/^wss?:\/\//, '')})`
      }));
    
    return [...(presetRelays || []), ...customRelayItems];
  }, [presetRelays, config.customRelays]);

  const appContextValue: AppContextType = {
    config,
    updateConfig,
    presetRelays: mergedRelays,
    loading,
    setLoading,
  };

  // Apply theme effects to document
  useApplyTheme(config.theme);

  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to apply theme changes to the document root
 */
function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Handle system theme changes when theme is set to "system"
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
}