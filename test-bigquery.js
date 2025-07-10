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
        
        // Test 5: Get table metadata first
        console.log('\n🔍 Getting table metadata...');
        try {
          const [metadata] = await bigquery
            .dataset(targetDataset)
            .table('Update_7_8')
            .getMetadata();
          
          console.log('✅ Table metadata accessed successfully!');
          console.log('Schema fields (first 5):');
          metadata.schema?.fields?.slice(0, 5).forEach(field => {
            console.log(`  - ${field.name}: ${field.type}`);
          });
          
          // Test 6: Try a simple query with LIMIT
          console.log('\n🔍 Testing simple query...');
          const query = `
            SELECT *
            FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8\`
            LIMIT 5
          `;
          
          const [rows] = await bigquery.query(query);
          console.log('✅ Query successful! Sample data:');
          console.log(`   Returned ${rows.length} rows`);
          if (rows.length > 0) {
            console.log('   First row keys:', Object.keys(rows[0]));
          }
          console.log('\n🎉 BigQuery setup is working perfectly!');
          
        } catch (queryError) {
          console.log('❌ Query failed, but connection works!');
          console.log('Error:', queryError.message);
          
          if (queryError.message.includes('Drive')) {
            console.log('\n💡 This table might be linked to Google Drive.');
            console.log('   The connection is working - this is just a data access issue.');
            console.log('   Try using a different table or check Drive permissions.');
          }
        }
        
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