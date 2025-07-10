require('dotenv').config({ path: '../../.env' });

console.log('🔍 Testing API startup...');
console.log('Environment check:');
console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('- BQ Project:', process.env.BQ_PROJECT);
console.log('- Key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

try {
  console.log('\n📦 Testing imports...');
  
  const express = require('express');
  console.log('✅ Express imported');
  
  const { BigQuery } = require('@google-cloud/bigquery');
  console.log('✅ BigQuery imported');
  
  // Test creating BigQuery client
  const bq = new BigQuery({
    projectId: process.env.BQ_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  console.log('✅ BigQuery client created');
  
  // Test Express setup
  const app = express();
  app.get('/test', (req, res) => res.json({ status: 'ok' }));
  
  const server = app.listen(4001, () => {
    console.log('✅ Express server started on port 4001');
    console.log('\n🎉 Basic setup is working!');
    server.close();
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ Error during startup test:');
  console.error(error.message);
  console.error('\nStack:', error.stack);
} 