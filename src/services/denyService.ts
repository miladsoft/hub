import { useQuery } from '@tanstack/react-query';

// CORS proxy URLs - try multiple proxies for reliability
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
];

// API URLs
const DENY_LIST_URL = 'https://lists.blockcore.net/deny/angor.json';
const DENY_LIST_PROXY_URL = '/api/deny/angor.json'; // Vite proxy URL

interface DenyListService {
  isDenied: (projectIdentifier: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

function useDenyList(): DenyListService {
  const { data: denyList = [], isLoading, error } = useQuery({
    queryKey: ['denyList'],
    queryFn: async (): Promise<string[]> => {
      // Hardcoded fallback list based on the actual deny list
      const fallbackDenyList = [
        'angor1qfs3835r3r8leha9ksnrf8jadvtyzwuzu7huqk9',
        'angor1q748m7hqu5d7h58zyxvl6gvz4hhaptg5kez6r7f', 
        'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem'
      ];

      try {
        console.log('🚫 Fetching deny list...');
        
        // Try proxy URL first (for development)
        let response;
        try {
          console.log('🔄 Trying proxy URL:', DENY_LIST_PROXY_URL);
          response = await fetch(DENY_LIST_PROXY_URL, { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            console.log('✅ Proxy URL worked!');
          }
        } catch (proxyError) {
          console.warn('❌ Proxy URL failed, trying direct fetch...', proxyError);
          
          // Try direct fetch
          try {
            response = await fetch(DENY_LIST_URL, { 
              mode: 'cors',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (response.ok) {
              console.log('✅ Direct fetch worked!');
            }
          } catch (corsError) {
            console.warn('❌ Direct fetch failed due to CORS, trying proxies...', corsError);
            
            // Try CORS proxies one by one
            for (const proxy of CORS_PROXIES) {
              try {
                console.log(`🔄 Trying proxy: ${proxy}`);
                response = await fetch(proxy + encodeURIComponent(DENY_LIST_URL), {
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache'
                  }
                });
                if (response.ok) {
                  console.log(`✅ Proxy ${proxy} worked!`);
                  break;
                }
              } catch (proxyError) {
                console.warn(`❌ Proxy ${proxy} failed:`, proxyError);
                continue;
              }
            }
          }
        }
        
        if (!response || !response.ok) {
          console.warn('❌ Failed to fetch deny list from all sources, using fallback list');
          return fallbackDenyList;
        }
        
        const list = await response.json();
        
        if (!Array.isArray(list)) {
          console.error('❌ Deny list format is incorrect, using fallback list');
          return fallbackDenyList;
        }
        
        console.log('✅ Deny list loaded successfully:', list.length, 'entries');
        console.log('🚫 Full deny list:', list);
        
        // Log each denied project ID separately for clarity
        console.log('📋 DENIED PROJECTS LIST:');
        list.forEach((projectId, index) => {
          console.log(`   ${index + 1}. ${projectId}`);
        });
        
        return list;
        
      } catch (error) {
        console.error('❌ Error loading deny list, using fallback list:', error);
        console.log('📋 USING FALLBACK DENIED PROJECTS LIST:');
        fallbackDenyList.forEach((projectId, index) => {
          console.log(`   ${index + 1}. ${projectId}`);
        });
        return fallbackDenyList;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const isDenied = (projectIdentifier: string): boolean => {
    if (!projectIdentifier || !denyList.length) {
      return false;
    }
    
    // Special test for the specific project ID
    const testProjectId = 'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem';
    if (projectIdentifier === testProjectId) {
      console.log(`🔍 Testing specific project: ${projectIdentifier}`);
      console.log(`🔍 Current deny list (${denyList.length} items):`, denyList);
      console.log(`🔍 Is "${projectIdentifier}" in deny list:`, denyList.includes(projectIdentifier));
      
      // Check each item individually for debugging
      console.log('🔍 Checking each deny list item:');
      denyList.forEach((deniedId, index) => {
        const matches = deniedId === projectIdentifier;
        console.log(`   ${index + 1}. "${deniedId}" === "${projectIdentifier}" ? ${matches}`);
      });
    }
    
    const denied = denyList.includes(projectIdentifier);
    if (denied) {
      console.warn(`🚫 Project ${projectIdentifier} is denied and will be filtered out`);
    }
    
    return denied;
  };

  return {
    isDenied,
    isLoading,
    error: error as Error | null,
  };
}

function filterDeniedProjects<T extends { projectIdentifier?: string }>(
  projects: T[],
  denyService: DenyListService
): T[] {
  if (!projects.length) {
    return projects;
  }

  if (denyService.isLoading) {
    console.log('🔄 Deny list still loading, showing all projects for now...');
    return projects;
  }

  const filtered = projects.filter(project => {
    if (!project.projectIdentifier) {
      console.log('⚠️ Project without identifier found, keeping it');
      return true;
    }
    
    // Extra logging for our specific test project
    const testProjectId = 'angor1q2a5m2zcwpmkh49z05pg6gd9cxm4dhx3ywfclem';
    if (project.projectIdentifier === testProjectId) {
      console.log(`🔥 FOUND TEST PROJECT IN FILTER: ${project.projectIdentifier}`);
      console.log(`🔥 denyService.isLoading: ${denyService.isLoading}`);
      console.log(`🔥 About to call isDenied...`);
    }
    
    const isDenied = denyService.isDenied(project.projectIdentifier);
    
    if (project.projectIdentifier === testProjectId) {
      console.log(`🔥 isDenied result for test project: ${isDenied}`);
    }
    
    if (isDenied) {
      console.log(`🚫 Filtering out denied project: ${project.projectIdentifier}`);
    }
    
    return !isDenied;
  });

  if (projects.length !== filtered.length) {
    console.log(`✅ Filtered ${projects.length - filtered.length} denied projects out of ${projects.length} total`);
  }
  
  return filtered;
}

export { useDenyList, filterDeniedProjects };
export type { DenyListService };
