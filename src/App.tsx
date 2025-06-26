// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { Toaster as Sonner, Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { IndexerProvider } from '@/contexts/IndexerContext';
import { RelayProvider } from '@/contexts/RelayContext';
import AppRouter from './AppRouter';
import type { AppConfig } from "./contexts/AppContext";

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "dark",
  relayUrl: "wss://relay.angor.io",
  customRelays: [],
};

const presetRelays = [
  { url: 'wss://relay.angor.io', name: 'َAngor' },
  { url: 'wss://relay2.angor.io', name: 'َAngor2' },
  { url: 'wss://nos.lol', name: 'nos.lol' },
  { url: 'wss://ditto.pub/relay', name: 'Ditto' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

export function App() {
  return (
    <UnheadProvider head={head}>
      <NetworkProvider>
        <IndexerProvider>
          <RelayProvider>
            <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig} presetRelays={presetRelays}>
              <QueryClientProvider client={queryClient}>
                <NostrLoginProvider storageKey='nostr:login'>
                  <NostrProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <Suspense>
                        <AppRouter />
                      </Suspense>
                    </TooltipProvider>
                  </NostrProvider>
                </NostrLoginProvider>
              </QueryClientProvider>
            </AppProvider>
          </RelayProvider>
        </IndexerProvider>
      </NetworkProvider>
    </UnheadProvider>
  );
}

export default App;
