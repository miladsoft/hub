import { useAngorProjects } from '@/hooks/useAngorProjects';

export function testSearchAndFilter() {
  const { projects } = useAngorProjects({ enabled: true });
  
  console.log('🔍 Projects loaded:', projects.length);
  console.log('📋 First few projects:', projects.slice(0, 3).map(p => ({
    id: p.projectIdentifier,
    name: p.metadata?.name || 'No name',
    amount: p.amountInvested || 0
  })));
  
  // Test search functionality
  const searchTerm = 'bitcoin';
  const searchResults = projects.filter(project => {
    const projectName = project.metadata?.name || project.profile?.name || '';
    const projectDescription = project.metadata?.about || project.profile?.about || '';
    return projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           projectDescription.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  console.log(`🔍 Search for "${searchTerm}":`, searchResults.length, 'results');
  
  // Test filter functionality
  const activeProjects = projects.filter(project => {
    const now = Date.now() / 1000;
    const startDate = project.details?.startDate;
    const expiryDate = project.details?.expiryDate;
    const completionPercentage = project.stats?.completionPercentage || 0;
    
    const hasStarted = !startDate || startDate <= now;
    const notExpired = !expiryDate || expiryDate > now;
    const notCompleted = completionPercentage < 100;
    
    return hasStarted && notExpired && notCompleted;
  });
  
  console.log('📊 Active projects:', activeProjects.length);
  
  return {
    total: projects.length,
    searchResults: searchResults.length,
    activeProjects: activeProjects.length
  };
}

// Run in console: testSearchAndFilter()
