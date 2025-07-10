require('dotenv').config({ path: '../../.env' });
const { BigQuery } = require('@google-cloud/bigquery');

async function testBigQueryConnection() {
  try {
    console.log('🔍 Testing BigQuery connection...');
    console.log('Project:', process.env.BQ_PROJECT);
    console.log('Key file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    const bigquery = new BigQuery({
      projectId: process.env.BQ_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    // Test 1: List datasets
    console.log('\n📊 Listing datasets...');
    const [datasets] = await bigquery.getDatasets();
    console.log('Found datasets:', datasets.map(d => d.id));

    // Test 2: Check if our target dataset exists
    const targetDataset = 'rentroll';
    const hasRentrollDataset = datasets.some(d => d.id === targetDataset);
    
    if (hasRentrollDataset) {
      console.log(`✅ Found '${targetDataset}' dataset!`);
      
      // Test 3: List tables in rentroll dataset
      const [tables] = await bigquery.dataset(targetDataset).getTables();
      console.log('Tables in rentroll dataset:', tables.map(t => t.id));
      
      // Test 4: Check for Update_7_8 table
      const hasTargetTable = tables.some(t => t.id === 'Update_7_8');
      if (hasTargetTable) {
        console.log(`✅ Found 'Update_7_8' table!`);
        
        // Test 5: Run a simple query
        console.log('\n🔍 Testing simple query...');
        const query = `
          SELECT COUNT(*) as total_rows
          FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8\`
          LIMIT 1
        `;
        
        const [rows] = await bigquery.query(query);
        console.log('✅ Query successful! Total rows:', rows[0].total_rows);
        console.log('\n🎉 BigQuery setup is working perfectly!');
      } else {
        console.log('❌ Table "Update_7_8" not found in rentroll dataset');
        console.log('Available tables:', tables.map(t => t.id));
      }
    } else {
      console.log(`❌ Dataset '${targetDataset}' not found`);
      console.log('Available datasets:', datasets.map(d => d.id));
    }

  } catch (error) {
    console.error('❌ BigQuery connection failed:');
    console.error(error.message);
    
    if (error.message.includes('ENOENT')) {
      console.log('\n💡 Make sure your service account key file exists at:');
      console.log('   ~/.config/gcloud/rentroll-sa.json');
    }
    
    if (error.message.includes('403')) {
      console.log('\n💡 Check that your service account has the right permissions');
    }
    
    if (error.message.includes('default credentials')) {
      console.log('\n💡 Steps to fix:');
      console.log('1. Download your service account key from Google Cloud Console');
      console.log('2. Save it as: ~/.config/gcloud/rentroll-sa.json');
      console.log('3. Make sure the path in .env is correct');
    }
  }
}

testBigQueryConnection(); 