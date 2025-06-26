import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { ANGOR_EVENT_KINDS } from '@/types/angor';
import type { NostrProfile, ProjectDetails, ProjectFAQ, ProjectMedia, ProjectMembers } from '@/types/angor';

/**
 * Retry mechanism for Nostr queries
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  description: string,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${description}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`All ${maxRetries} attempts failed for ${description}`);
}

/**
 * Hook to fetch user profile by pubkey
 */
export function useNostrProfile(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-profile', pubkey],
    queryFn: async () => {
      if (!pubkey) return null;

      return queryWithRetry(async () => {
        const signal = AbortSignal.timeout(5000);
        const events = await nostr.query([{
          kinds: [ANGOR_EVENT_KINDS.PROFILE_METADATA],
          authors: [pubkey],
          limit: 1
        }], { signal });

        if (events.length > 0) {
          try {
            return JSON.parse(events[0].content) as NostrProfile;
          } catch (error) {
            console.error('Error parsing profile metadata:', error);
            return {};
          }
        }
        return {};
      }, `Profile for ${pubkey}`);
    },
    enabled: !!pubkey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch project details by event ID
 */
export function useNostrProjectDetails(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-project-details', eventId],
    queryFn: async () => {
      if (!eventId) return {};

      return queryWithRetry(async () => {
        const signal = AbortSignal.timeout(5000);
        const events = await nostr.query([{
          ids: [eventId],
          limit: 1
        }], { signal });

        if (events.length > 0) {
          try {
            return JSON.parse(events[0].content) as ProjectDetails;
          } catch (error) {
            console.error('Error parsing project details:', error);
            return {};
          }
        }
        return {};
      }, `Project details for ${eventId}`);
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to fetch additional project data (FAQ, media, members)
 */
export function useNostrAdditionalData(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-additional-data', pubkey],
    queryFn: async () => {
      if (!pubkey) return { faq: {}, media: {}, members: {} };

      return queryWithRetry(async () => {
        const signal = AbortSignal.timeout(5000);
        const events = await nostr.query([{
          kinds: [ANGOR_EVENT_KINDS.ADDITIONAL_DATA],
          authors: [pubkey],
          limit: 100
        }], { signal });

        let faq: ProjectFAQ = { questions: [] };
        let media: ProjectMedia = {};
        let members: ProjectMembers = { team: [] };

        events.forEach(event => {
          const dTag = event.tags.find(tag => tag[0] === 'd');
          if (dTag) {
            const tagValue = dTag[1];
            try {
              const content = JSON.parse(event.content);
              
              if (tagValue === 'angor:faq' || tagValue === 'faq') {
                faq = content;
              } else if (tagValue === 'angor:media' || tagValue === 'media') {
                media = content;
              } else if (tagValue === 'angor:members' || tagValue === 'members') {
                members = content;
              }
            } catch (error) {
              console.error(`Error parsing ${tagValue} data:`, error);
            }
          }
        });

        return { faq, media, members };
      }, `Additional data for ${pubkey}`);
    },
    enabled: !!pubkey,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch project updates
 */
export function useProjectUpdates(projectId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      return queryWithRetry(async () => {
        const signal = AbortSignal.timeout(5000);
        const events = await nostr.query([{
          kinds: [ANGOR_EVENT_KINDS.PROJECT_UPDATE],
          '#project': [projectId],
          limit: 50
        }], { signal });

        return events
          .sort((a, b) => b.created_at - a.created_at)
          .map(event => ({
            id: event.id,
            content: event.content,
            created_at: event.created_at,
            author: event.pubkey,
            tags: event.tags,
          }));
      }, `Updates for project ${projectId}`);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch all projects from Nostr
 */
export function useNostrProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-projects'],
    queryFn: async () => {
      return queryWithRetry(async () => {
        const signal = AbortSignal.timeout(10000);
        const events = await nostr.query([{
          kinds: [ANGOR_EVENT_KINDS.PROJECT_DETAILS],
          limit: 100
        }], { signal });

        return events
          .sort((a, b) => b.created_at - a.created_at)
          .map(event => {
            try {
              const content = JSON.parse(event.content);
              return {
                ...content,
                eventId: event.id,
                pubkey: event.pubkey,
                created_at: event.created_at,
              };
            } catch (error) {
              console.error('Error parsing project event:', error);
              return null;
            }
          })
          .filter(Boolean);
      }, 'All Nostr projects');
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
