import { AngorIndexerService } from '@/services/angorIndexer';

async function debugProjectData() {
  const indexerService = new AngorIndexerService();
  
  try {
    console.log('🌐 Testing project API...');
    const projects = await indexerService.getProjects(0, 5, 'mainnet');
    
    console.log('📊 API Response:', {
      isArray: Array.isArray(projects),
      length: projects.length,
      firstProject: projects[0] ? {
        identifier: projects[0].projectIdentifier,
        hasMetadata: !!projects[0].metadata,
        hasProfile: !!projects[0].profile,
        hasStats: !!projects[0].stats,
        hasDetails: !!projects[0].details,
        targetAmount: projects[0].targetAmount,
        amountInvested: projects[0].amountInvested,
        name: projects[0].metadata?.name || projects[0].profile?.name || 'No name',
        about: projects[0].metadata?.about || projects[0].profile?.about || 'No description'
      } : null
    });
    
    if (projects.length > 0) {
      console.log('🔍 Sample project full structure:');
      console.log(JSON.stringify(projects[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ API Error:', error);
  }
}

// Call this in console: debugProjectData()
export { debugProjectData };
