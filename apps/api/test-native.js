require('dotenv').config({ path: '../../.env' });
const { BigQuery } = require('@google-cloud/bigquery');

async function testNativeTable() {
  try {
    const bigquery = new BigQuery({
      projectId: process.env.BQ_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    console.log('🔍 Testing native BigQuery table...');
    
    // Try the native table instead
    const query = `
      SELECT COUNT(*) as total_rows
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      LIMIT 1
    `;
    
    const [rows] = await bigquery.query(query);
    console.log('✅ Native table query successful!');
    console.log('Total rows:', rows[0].total_rows);
    
    // Get some sample data
    const sampleQuery = `
      SELECT *
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      LIMIT 3
    `;
    
    const [sampleRows] = await bigquery.query(sampleQuery);
    console.log('\n📊 Sample data from native table:');
    console.log('Columns:', Object.keys(sampleRows[0] || {}));
    console.log('Sample rows:', sampleRows.length);
    
    console.log('\n🎉 BigQuery is working! We can use the native table.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('404')) {
      console.log('💡 Native table might not exist. Let\'s list all tables:');
      
      try {
        const [tables] = await bigquery.dataset('rentroll').getTables();
        console.log('Available tables:', tables.map(t => t.id));
      } catch (e) {
        console.log('Could not list tables:', e.message);
      }
    }
  }
}

testNativeTable(); 