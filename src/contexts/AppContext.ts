import { createContext } from "react";

export type Theme = "dark" | "light" | "system";

export interface AppConfig {
  /** Current theme */
  theme: Theme;
  /** Selected relay URL */
  relayUrl: string;
  /** Custom relay URLs added by user */
  customRelays?: string[];
}

export interface GlobalLoadingState {
  /** Whether the app is in a global loading state */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
}

export interface AppContextType {
  /** Current application configuration */
  config: AppConfig;
  /** Update configuration using a callback that receives current config and returns new config */
  updateConfig: (updater: (currentConfig: AppConfig) => AppConfig) => void;
  /** Optional list of preset relays to display in the RelaySelector */
  presetRelays?: { name: string; url: string }[];
  /** Global loading state */
  loading: GlobalLoadingState;
  /** Set global loading state */
  setLoading: (loading: GlobalLoadingState) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
