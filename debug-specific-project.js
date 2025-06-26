// Debug script for specific project
const projectId = 'angor1qyuj8z532tnhy7srutwecu3j789z22peu2t8c7v';

async function debugProject() {
  console.log(`🔍 Debugging project: ${projectId}`);
  
  // Test basic project data
  try {
    const projectUrl = `https://explorer.angor.io/api/query/Angor/projects/${projectId}`;
    console.log(`📡 Fetching: ${projectUrl}`);
    
    const response = await fetch(projectUrl);
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Project data:', data);
    } else {
      console.error('❌ Failed to fetch project data');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test stats
  try {
    const statsUrl = `https://explorer.angor.io/api/query/Angor/projects/${projectId}/stats`;
    console.log(`📡 Fetching stats: ${statsUrl}`);
    
    const response = await fetch(statsUrl);
    console.log(`📊 Stats status: ${response.status}`);
    
    if (response.ok) {
      const stats = await response.json();
      console.log('✅ Project stats:', stats);
    } else {
      console.error('❌ Failed to fetch project stats');
    }
  } catch (error) {
    console.error('❌ Stats error:', error);
  }

  // Test if in deny list
  try {
    const denyResponse = await fetch('https://lists.blockcore.net/deny/angor.json');
    if (denyResponse.ok) {
      const denyList = await denyResponse.json();
      const isDenied = denyList.includes(projectId);
      console.log(`🚫 Is project denied: ${isDenied}`);
      console.log(`📋 Deny list:`, denyList);
    }
  } catch (error) {
    console.error('❌ Deny list error:', error);
  }
}

debugProject();
