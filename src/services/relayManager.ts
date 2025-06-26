export interface RelayConfig {
  url: string;
  name: string;
  isDefault: boolean;
  isConnected?: boolean;
}

export interface RelayManagerOptions {
  defaultRelays: RelayConfig[];
  storageKey: string;
  connectionTimeout: number;
}

export class RelayManager {
  private relays: RelayConfig[] = [];
  private connections: Map<string, WebSocket> = new Map();
  private options: RelayManagerOptions;
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor(options: RelayManagerOptions) {
    this.options = options;
    this.loadRelaysFromStorage();
  }

  private loadRelaysFromStorage(): void {
    const saved = localStorage.getItem(this.options.storageKey);
    if (saved) {
      try {
        this.relays = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved relays:', error);
        this.relays = [...this.options.defaultRelays];
      }
    } else {
      this.relays = [...this.options.defaultRelays];
    }
  }

  public saveRelaysToStorage(): void {
    localStorage.setItem(this.options.storageKey, JSON.stringify(this.relays));
  }

  public getRelays(): RelayConfig[] {
    return [...this.relays];
  }

  public addRelay(relay: RelayConfig): boolean {
    // Check if relay already exists
    if (this.relays.some(r => r.url === relay.url)) {
      return false;
    }
    
    this.relays.push(relay);
    this.saveRelaysToStorage();
    return true;
  }

  public removeRelay(url: string): boolean {
    const index = this.relays.findIndex(r => r.url === url);
    if (index === -1) return false;

    // Disconnect if connected
    this.disconnectFromRelay(url);
    
    this.relays.splice(index, 1);
    this.saveRelaysToStorage();
    return true;
  }

  public async connectToRelay(url: string): Promise<boolean> {
    if (this.connections.has(url)) {
      return true; // Already connected
    }

    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, this.options.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(timeout);
        this.connections.set(url, ws);
        this.updateRelayStatus(url, true);
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        this.updateRelayStatus(url, false);
        resolve(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleRelayMessage(url, message);
        } catch (error) {
          console.error('Failed to parse relay message:', error);
        }
      };

      ws.onclose = () => {
        this.connections.delete(url);
        this.updateRelayStatus(url, false);
      };
    });
  }

  public disconnectFromRelay(url: string): void {
    const ws = this.connections.get(url);
    if (ws) {
      ws.close();
      this.connections.delete(url);
      this.updateRelayStatus(url, false);
    }
  }

  public async connectToAllRelays(): Promise<void> {
    const connectionPromises = this.relays.map(relay => 
      this.connectToRelay(relay.url)
    );
    await Promise.allSettled(connectionPromises);
  }

  public disconnectFromAllRelays(): void {
    this.connections.forEach((ws) => {
      ws.close();
    });
    this.connections.clear();
    this.relays.forEach(relay => {
      relay.isConnected = false;
    });
  }

  private updateRelayStatus(url: string, isConnected: boolean): void {
    const relay = this.relays.find(r => r.url === url);
    if (relay) {
      relay.isConnected = isConnected;
    }
  }

  private handleRelayMessage(relayUrl: string, message: any): void {
    // Handle different types of Nostr messages
    if (Array.isArray(message)) {
      const [type, ...data] = message;
      
      switch (type) {
        case 'EVENT':
          this.notifyEventListeners('event', { relayUrl, event: data[1] });
          break;
        case 'EOSE':
          this.notifyEventListeners('eose', { relayUrl, subscriptionId: data[0] });
          break;
        case 'NOTICE':
          this.notifyEventListeners('notice', { relayUrl, message: data[0] });
          break;
        case 'OK':
          this.notifyEventListeners('ok', { relayUrl, eventId: data[0], success: data[1], message: data[2] });
          break;
      }
    }
  }

  public subscribe(eventType: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  public unsubscribe(eventType: string, callback: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private notifyEventListeners(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public async queryEvents(filter: any, timeoutMs: number = 5000): Promise<any[]> {
    const events: any[] = [];
    const subscriptionId = Math.random().toString(36).substring(7);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.unsubscribeFromQuery(subscriptionId);
        resolve(events);
      }, timeoutMs);

      let eoseCount = 0;
      const connectedRelays = Array.from(this.connections.keys());

      if (connectedRelays.length === 0) {
        reject(new Error('No connected relays'));
        return;
      }

      const handleEvent = (data: any) => {
        if (data.subscriptionId === subscriptionId) {
          events.push(data.event);
        }
      };

      const handleEose = (data: any) => {
        if (data.subscriptionId === subscriptionId) {
          eoseCount++;
          if (eoseCount >= connectedRelays.length) {
            clearTimeout(timeout);
            this.unsubscribeFromQuery(subscriptionId);
            resolve(events);
          }
        }
      };

      this.subscribe('event', handleEvent);
      this.subscribe('eose', handleEose);

      // Send query to all connected relays
      const queryMessage = JSON.stringify(['REQ', subscriptionId, filter]);
      this.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(queryMessage);
        }
      });
    });
  }

  private unsubscribeFromQuery(subscriptionId: string): void {
    const closeMessage = JSON.stringify(['CLOSE', subscriptionId]);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(closeMessage);
      }
    });
  }

  public async publishEvent(event: any): Promise<boolean> {
    const promises = Array.from(this.connections.values()).map(ws => {
      return new Promise<boolean>((resolve) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(['EVENT', event]));
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    const results = await Promise.allSettled(promises);
    return results.some(result => result.status === 'fulfilled' && result.value);
  }

  public getConnectionStatus(): { connected: number; total: number } {
    const connected = this.relays.filter(r => r.isConnected).length;
    return { connected, total: this.relays.length };
  }

  public resetToDefaults(): void {
    this.disconnectFromAllRelays();
    this.relays = [...this.options.defaultRelays];
    this.saveRelaysToStorage();
  }
}
