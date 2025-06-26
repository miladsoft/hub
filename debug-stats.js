// Debug script to check actual project data structure
async function debugStats() {
  const response = await fetch('https://explorer.angor.io/api/query/Angor/projects?offset=0&limit=5');
  const projects = await response.json();
  
  console.log('Total projects:', projects.length);
  console.log('First project structure:', JSON.stringify(projects[0], null, 2));
  
  // Check each project for financial data
  projects.forEach((project, index) => {
    console.log(`\nProject ${index + 1} (${project.projectIdentifier}):`);
    console.log('- amountInvested:', project.amountInvested);
    console.log('- targetAmount:', project.targetAmount);
    console.log('- investorCount:', project.investorCount);
    console.log('- totalInvestmentsCount:', project.totalInvestmentsCount);
    console.log('- stats:', project.stats);
    console.log('- details:', project.details);
  });
}

debugStats();
