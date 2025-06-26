import { ANGOR_INDEXER_CONFIG, getPrimaryIndexerUrl } from '@/types/angor';

// Test the indexer configuration
console.log('=== Angor Indexer Configuration Test ===');
console.log('Mainnet Primary URL:', getPrimaryIndexerUrl('mainnet'));
console.log('Testnet Primary URL:', getPrimaryIndexerUrl('testnet'));
console.log('Full Config:', ANGOR_INDEXER_CONFIG);

// Test API endpoints
async function testEndpoints() {
  const mainnetUrl = getPrimaryIndexerUrl('mainnet');
  const testnetUrl = getPrimaryIndexerUrl('testnet');
  
  console.log('\n=== Testing API Endpoints ===');
  
  try {
    console.log('Testing Mainnet:', mainnetUrl);
    const mainnetResponse = await fetch(`${mainnetUrl}api/query/Angor/projects?offset=0&limit=5`);
    console.log('Mainnet Response:', mainnetResponse.status, mainnetResponse.statusText);
    
    if (mainnetResponse.ok) {
      const mainnetData = await mainnetResponse.json();
      console.log('Mainnet Projects Count:', Array.isArray(mainnetData) ? mainnetData.length : 'Not an array');
      if (Array.isArray(mainnetData) && mainnetData.length > 0) {
        console.log('Sample Mainnet Project Structure:', JSON.stringify(mainnetData[0], null, 2));
        
        // Test stats endpoint for the first project
        const projectId = mainnetData[0].projectIdentifier;
        console.log(`\nTesting stats for project: ${projectId}`);
        try {
          const statsResponse = await fetch(`${mainnetUrl}api/query/Angor/projects/${projectId}/stats`);
          console.log('Stats Response:', statsResponse.status, statsResponse.statusText);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('Sample Stats Structure:', JSON.stringify(statsData, null, 2));
          }
        } catch (error) {
          console.error('Stats Error:', error);
        }
        
        // Test individual project endpoint
        console.log(`\nTesting individual project endpoint for: ${projectId}`);
        try {
          const projectResponse = await fetch(`${mainnetUrl}api/query/Angor/projects/${projectId}`);
          console.log('Individual Project Response:', projectResponse.status, projectResponse.statusText);
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            console.log('Individual Project Structure:', JSON.stringify(projectData, null, 2));
          }
        } catch (error) {
          console.error('Individual Project Error:', error);
        }
      }
    }
  } catch (error) {
    console.error('Mainnet Error:', error);
  }
  
  try {
    console.log('Testing Testnet:', testnetUrl);
    const testnetResponse = await fetch(`${testnetUrl}api/query/Angor/projects?offset=0&limit=5`);
    console.log('Testnet Response:', testnetResponse.status, testnetResponse.statusText);
    
    if (testnetResponse.ok) {
      const testnetData = await testnetResponse.json();
      console.log('Testnet Projects Count:', Array.isArray(testnetData) ? testnetData.length : 'Not an array');
    }
  } catch (error) {
    console.error('Testnet Error:', error);
  }
}

// Run the test
testEndpoints();

export {};
