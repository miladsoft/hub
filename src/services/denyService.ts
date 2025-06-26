import type { NetworkType } from '@/contexts/NetworkContext';

export interface DenyListEntry {
  id: string;
  type: 'project' | 'user' | 'event';
  reason: string;
  timestamp: number;
  network: NetworkType;
}

export interface DenyListConfig {
  enabled: boolean;
  sources: Array<{
    url: string;
    enabled: boolean;
    priority: number;
  }>;
  customEntries: DenyListEntry[];
}

export class DenyService {
  private denyList: Set<string> = new Set();
  private config: DenyListConfig;
  private lastUpdate: number = 0;
  private updateInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.config = this.loadConfig();
    this.loadDenyList();
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): DenyListConfig {
    const saved = localStorage.getItem('angor:deny-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse deny list config:', error);
      }
    }
    
    return {
      enabled: true,
      sources: [
        {
          url: 'https://lists.blockcore.net/deny/angor.json',
          enabled: true,
          priority: 1
        }
      ],
      customEntries: []
    };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    localStorage.setItem('angor:deny-config', JSON.stringify(this.config));
  }

  /**
   * Load deny list from all enabled sources
   */
  async loadDenyList(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      // Use cached version
      const cached = localStorage.getItem('angor:deny-list');
      if (cached) {
        try {
          const entries: string[] = JSON.parse(cached);
          this.denyList = new Set(entries);
          return;
        } catch (error) {
          console.error('Failed to parse cached deny list:', error);
        }
      }
    }

    // Fetch from remote sources
    const allEntries = new Set<string>();

    // Add custom entries
    this.config.customEntries.forEach(entry => {
      allEntries.add(entry.id);
    });

    // Fetch from remote sources
    for (const source of this.config.sources.filter(s => s.enabled)) {
      try {
        const response = await fetch(source.url, {
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            data.forEach(id => allEntries.add(id));
          } else if (data.entries && Array.isArray(data.entries)) {
            data.entries.forEach((entry: any) => {
              if (typeof entry === 'string') {
                allEntries.add(entry);
              } else if (entry.id) {
                allEntries.add(entry.id);
              }
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch deny list from ${source.url}:`, error);
      }
    }

    this.denyList = allEntries;
    this.lastUpdate = now;

    // Cache the results
    localStorage.setItem('angor:deny-list', JSON.stringify(Array.from(allEntries)));
    localStorage.setItem('angor:deny-list-timestamp', now.toString());
  }

  /**
   * Check if an event/project/user is denied
   */
  async isEventDenied(id: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    // Ensure deny list is loaded
    if (this.denyList.size === 0) {
      await this.loadDenyList();
    }

    return this.denyList.has(id);
  }

  /**
   * Check if a project is denied
   */
  async isProjectDenied(projectId: string): Promise<boolean> {
    return this.isEventDenied(projectId);
  }

  /**
   * Check if a user is denied
   */
  async isUserDenied(pubkey: string): Promise<boolean> {
    return this.isEventDenied(pubkey);
  }

  /**
   * Add custom deny entry
   */
  addCustomEntry(entry: Omit<DenyListEntry, 'timestamp'>): void {
    const newEntry: DenyListEntry = {
      ...entry,
      timestamp: Date.now()
    };
    
    this.config.customEntries.push(newEntry);
    this.denyList.add(entry.id);
    this.saveConfig();
  }

  /**
   * Remove custom deny entry
   */
  removeCustomEntry(id: string): boolean {
    const index = this.config.customEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.config.customEntries.splice(index, 1);
    this.denyList.delete(id);
    this.saveConfig();
    return true;
  }

  /**
   * Get all custom entries
   */
  getCustomEntries(): DenyListEntry[] {
    return [...this.config.customEntries];
  }

  /**
   * Enable/disable deny service
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Check if deny service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Add a new source
   */
  addSource(url: string, priority: number = 1): boolean {
    if (this.config.sources.some(source => source.url === url)) {
      return false; // Already exists
    }

    this.config.sources.push({
      url,
      enabled: true,
      priority
    });

    this.saveConfig();
    return true;
  }

  /**
   * Remove a source
   */
  removeSource(url: string): boolean {
    const index = this.config.sources.findIndex(source => source.url === url);
    if (index === -1) return false;

    this.config.sources.splice(index, 1);
    this.saveConfig();
    return true;
  }

  /**
   * Enable/disable a source
   */
  setSourceEnabled(url: string, enabled: boolean): boolean {
    const source = this.config.sources.find(s => s.url === url);
    if (!source) return false;

    source.enabled = enabled;
    this.saveConfig();
    return true;
  }

  /**
   * Get current configuration
   */
  getConfig(): DenyListConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DenyListConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * Force refresh deny list from all sources
   */
  async refresh(): Promise<void> {
    this.lastUpdate = 0; // Force refresh
    await this.loadDenyList();
  }

  /**
   * Get deny list statistics
   */
  getStats(): {
    totalEntries: number;
    customEntries: number;
    lastUpdate: number;
    sources: number;
    enabledSources: number;
  } {
    return {
      totalEntries: this.denyList.size,
      customEntries: this.config.customEntries.length,
      lastUpdate: this.lastUpdate,
      sources: this.config.sources.length,
      enabledSources: this.config.sources.filter(s => s.enabled).length
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    localStorage.removeItem('angor:deny-list');
    localStorage.removeItem('angor:deny-list-timestamp');
    this.denyList.clear();
    this.lastUpdate = 0;
  }

  /**
   * Export deny list configuration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import deny list configuration
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson) as DenyListConfig;
      
      // Validate config structure
      if (!config.sources || !Array.isArray(config.sources)) {
        throw new Error('Invalid configuration: missing sources array');
      }
      
      if (!config.customEntries || !Array.isArray(config.customEntries)) {
        throw new Error('Invalid configuration: missing customEntries array');
      }

      this.config = config;
      this.saveConfig();
      this.clearCache(); // Force reload
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}
