import { AngorIndexerService } from './services/angorIndexer';

async function debugProjectData() {
  console.log('=== Debug Project Data ===');
  
  const indexer = new AngorIndexerService();
  
  try {
    // Fetch projects from mainnet
    console.log('Fetching projects from mainnet...');
    const projects = await indexer.getProjects(0, 4, 'mainnet');
    console.log(`Found ${projects.length} projects`);
    
    for (let i = 0; i < Math.min(projects.length, 2); i++) {
      const project = projects[i];
      console.log(`\n--- Project ${i + 1}: ${project.projectIdentifier} ---`);
      console.log('Basic project data:', JSON.stringify(project, null, 2));
      
      // Fetch stats for this project
      try {
        console.log(`\nFetching stats for ${project.projectIdentifier}...`);
        const stats = await indexer.getProjectStats(project.projectIdentifier, 'mainnet');
        console.log('Stats data:', JSON.stringify(stats, null, 2));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      
      // Fetch detailed project data
      try {
        console.log(`\nFetching detailed project data for ${project.projectIdentifier}...`);
        const detailed = await indexer.getProject(project.projectIdentifier, 'mainnet');
        console.log('Detailed project data:', JSON.stringify(detailed, null, 2));
      } catch (error) {
        console.error('Error fetching detailed project:', error);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugProjectData();

export {};
