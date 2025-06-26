import { useState, useEffect } from 'react';

interface AppSettings {
  // Display Settings
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showAdvancedStats: boolean;
  
  // Notification Settings
  browserNotifications: boolean;
  emailNotifications: boolean;
  projectUpdates: boolean;
  fundingAlerts: boolean;
  newProjects: boolean;
  
  // Privacy Settings
  publicProfile: boolean;
  showFundingActivity: boolean;
  allowDirectMessages: boolean;
  
  // Platform Settings
  defaultCurrency: 'sats' | 'btc';
  language: string;
  autoConnect: boolean;
}

const defaultSettings: AppSettings = {
  // Display Settings
  theme: 'system',
  compactMode: false,
  showAdvancedStats: false,
  
  // Notification Settings
  browserNotifications: true,
  emailNotifications: false,
  projectUpdates: true,
  fundingAlerts: true,
  newProjects: false,
  
  // Privacy Settings
  publicProfile: true,
  showFundingActivity: true,
  allowDirectMessages: true,
  
  // Platform Settings
  defaultCurrency: 'btc', // Default to BTC instead of sats
  language: 'en',
  autoConnect: true
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('angor:settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('angor:settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSetting,
    resetSettings
  };
}
