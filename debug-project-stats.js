// Debug script to check project stats API
async function debugProjectStats() {
  // First get the project list
  const response = await fetch('https://explorer.angor.io/api/query/Angor/projects?offset=0&limit=2');
  const projects = await response.json();
  
  console.log('Testing stats API for first 2 projects...\n');
  
  for (const project of projects.slice(0, 2)) {
    console.log(`\n=== Project: ${project.projectIdentifier} ===`);
    
    try {
      // Try to fetch stats for this project
      const statsResponse = await fetch(
        `https://explorer.angor.io/api/query/Angor/projects/${project.projectIdentifier}/stats`
      );
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('Stats:', JSON.stringify(stats, null, 2));
      } else {
        console.log('Stats API returned:', statsResponse.status, statsResponse.statusText);
      }
    } catch (error) {
      console.log('Error fetching stats:', error.message);
    }
    
    try {
      // Try to fetch detailed project info
      const detailResponse = await fetch(
        `https://explorer.angor.io/api/query/Angor/projects/${project.projectIdentifier}`
      );
      
      if (detailResponse.ok) {
        const details = await detailResponse.json();
        console.log('Details:', JSON.stringify(details, null, 2));
      } else {
        console.log('Detail API returned:', detailResponse.status, detailResponse.statusText);
      }
    } catch (error) {
      console.log('Error fetching details:', error.message);
    }
  }
}

debugProjectStats();
