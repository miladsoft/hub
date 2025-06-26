import React, { useEffect, useRef } from 'react';
import { NPool, NRelay1, type NostrEvent } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config, presetRelays } = useAppContext();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    queryClient.resetQueries();
  }, [config.relayUrl, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        // Use all available relays for reading data
        const allRelays = new Set<string>([relayUrl.current]);
        
        // Add all preset relays for data fetching
        for (const { url } of (presetRelays ?? [])) {
          allRelays.add(url);
        }
        
        console.log(`🔄 NostrProvider: Using ${allRelays.size} relays for data fetching:`, Array.from(allRelays));
        
        // Return the same filters for all relays to aggregate data
        const relayMap = new Map();
        for (const relay of allRelays) {
          relayMap.set(relay, filters);
        }
        
        return relayMap;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      eventRouter(_event: NostrEvent) {
        // Publish to the selected relay
        const allRelays = new Set<string>([relayUrl.current]);

        // Also publish to the preset relays, capped to 5
        for (const { url } of (presetRelays ?? [])) {
          allRelays.add(url);

          if (allRelays.size >= 5) {
            break;
          }
        }

        return [...allRelays];
      },
    });
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;