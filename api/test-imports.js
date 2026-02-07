// Test if Azure packages can be imported
try {
  const azureFunctions = require('@azure/functions');
  console.log('✅ @azure/functions imported successfully');
  console.log('Functions version:', azureFunctions.version || 'N/A');
} catch (error) {
  console.log('❌ @azure/functions import failed:', error.message);
}

try {
  const { CosmosClient } = require('@azure/cosmos');
  console.log('✅ @azure/cosmos imported successfully');
  console.log('CosmosClient available:', typeof CosmosClient === 'function');
} catch (error) {
  console.log('❌ @azure/cosmos import failed:', error.message);
}