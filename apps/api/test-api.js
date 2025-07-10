require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { BigQuery } = require('@google-cloud/bigquery');

console.log('🚀 Starting RentRoll AI API for Railway...');
console.log('Environment check:');
console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('- BQ Project:', process.env.BQ_PROJECT);
console.log('- Node ENV:', process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 4000;

// Initialize BigQuery with production credentials handling
let bq;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // Production: Use JSON credentials from environment variable
  console.log('🔑 Using JSON credentials from environment variable');
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  bq = new BigQuery({
    projectId: process.env.BQ_PROJECT,
    credentials: credentials,
  });
} else {
  // Development: Use credentials file
  console.log('🔑 Using credentials file');
  bq = new BigQuery({
    projectId: process.env.BQ_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://*.vercel.app',
    'https://*.up.railway.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-test',
    bigQueryProject: process.env.BQ_PROJECT,
  });
});

// Portfolio stats (mock data for now)
app.get('/portfolio/stats', (req, res) => {
  res.json({
    totalUnits: 1247,
    occupancyRate: 94.2,
    avgRent: 2850,
    totalRevenue: 3556950,
    vacantUnits: 72,
    avgRentPerSqft: 2.85,
  });
});

// BigQuery test
app.get('/test-bigquery', async (req, res) => {
  try {
    console.log('🔍 Testing BigQuery...');
    const query = `
      SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT Property) as properties,
        ROUND(AVG(Rent), 2) as avg_rent
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
    `;
    
    const [rows] = await bq.query(query);
    console.log('✅ BigQuery success:', rows[0]);
    
    res.json({
      status: 'success',
      data: rows[0],
      message: 'BigQuery working perfectly!',
    });
  } catch (error) {
    console.error('❌ BigQuery error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Simple NL query endpoint (without OpenAI for now)
app.post('/nl-query', async (req, res) => {
  try {
    const { query, prompt } = req.body;
    const userQuery = query || prompt;
    console.log('📝 NL Query:', userQuery);
    
    // Simple pattern matching for common queries
    let sqlQuery = '';
    let explanation = '';
    
    if (userQuery && userQuery.toLowerCase().includes('1 bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, AVG(Rent) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 1
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 1-bedroom units by property`;
    } else if (userQuery && userQuery.toLowerCase().includes('2 bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, AVG(Rent) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 2
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 2-bedroom units by property`;
    } else if (userQuery && (userQuery.toLowerCase().includes('expensive') || userQuery.toLowerCase().includes('highest'))) {
      sqlQuery = `
        SELECT Unit, Property, Bedroom, Bathrooms, Sqft, Rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Rent IS NOT NULL AND Rent > 0
        ORDER BY Rent DESC
        LIMIT 10
      `;
      explanation = `Found ${userQuery} - showing most expensive units`;
    } else if (userQuery && userQuery.toLowerCase().includes('vacant')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as vacant_units
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Status = 'Vacant' OR Status = 'Available'
        GROUP BY Property
        ORDER BY vacant_units DESC
      `;
      explanation = `Found ${userQuery} - showing vacant units by property`;
    } else {
      // Default query if no pattern matches
      sqlQuery = `
        SELECT Property, COUNT(*) as units, AVG(Rent) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        GROUP BY Property 
        ORDER BY units DESC
        LIMIT 5
      `;
      explanation = `Generated query for: "${userQuery}". Showing property summary.`;
    }
    
    const [rows] = await bq.query(sqlQuery);
    
    res.json({
      data: rows,
      sql: sqlQuery,
      explanation: explanation,
      executionTime: 1200,
      bytesProcessed: 50000,
      cached: false,
      sessionId: 'test-session',
    });
  } catch (error) {
    console.error('❌ NL Query error:', error.message);
    res.status(500).json({
      error: 'Query failed',
      message: error.message,
    });
  }
});

// Units endpoint for pricing page
app.get('/units', async (req, res) => {
  try {
    console.log('🏢 Fetching units data...');
    const { limit = 50, status, property } = req.query;
    
    let whereClause = `WHERE Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%'`;
    if (status) {
      whereClause += ` AND Status = '${status}'`;
    }
    if (property) {
      whereClause += ` AND Property LIKE '%${property}%'`;
    }
    
    const query = `
      SELECT 
        Unit as unitNumber,
        Property as property,
        Bedroom as bedrooms,
        Bathrooms as bathrooms,
        Sqft as sqft,
        Rent as currentRent,
        COALESCE(Market_Rent, Rent * 1.05) as marketRent,
        Status as status,
        Lease_To as leaseEnd,
        CASE 
          WHEN Rent < COALESCE(Market_Rent, Rent * 1.05) THEN 'below'
          WHEN Rent > COALESCE(Market_Rent, Rent * 1.05) THEN 'above'
          ELSE 'at'
        END as marketPosition
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      ${whereClause}
      ORDER BY Rent DESC
      LIMIT ${parseInt(limit)}
    `;
    
    const [rows] = await bq.query(query);
    
    // Transform data to match frontend interface
    const units = rows.map((row, index) => ({
      id: `unit-${index}`,
      unitNumber: row.unitNumber || 'N/A',
      property: row.property || 'Unknown Property',
      bedrooms: parseInt(row.bedrooms) || 0,
      bathrooms: parseFloat(row.bathrooms) || 0,
      sqft: parseInt(row.sqft) || 0,
      currentRent: parseFloat(row.currentRent) || 0,
      marketRent: parseFloat(row.marketRent) || 0,
      status: row.status === 'Occupied' ? 'occupied' : 
              row.status === 'Vacant' ? 'vacant' : 'maintenance',
      leaseEnd: row.leaseEnd ? new Date(row.leaseEnd).toLocaleDateString() : undefined,
      marketPosition: row.marketPosition,
      recommendation: generateRecommendation(row)
    }));
    
    console.log(`✅ Found ${units.length} units`);
    res.json({
      status: 'success',
      data: units,
      count: units.length,
    });
  } catch (error) {
    console.error('❌ Units query error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Helper function to generate recommendations
function generateRecommendation(unit) {
  const rentGap = unit.currentRent - unit.marketRent;
  const percentGap = ((rentGap / unit.marketRent) * 100).toFixed(1);
  
  if (rentGap < -100) {
    return `Consider ${Math.abs(percentGap)}% rent increase at lease renewal. Unit is significantly below market.`;
  } else if (rentGap < 0) {
    return `Potential for ${Math.abs(percentGap)}% increase. Monitor market conditions.`;
  } else if (rentGap > 100) {
    return `Consider ${percentGap}% reduction to match market rate and reduce vacancy risk.`;
  } else {
    return `Unit is optimally priced. Maintain current rent level.`;
  }
}

// Units by property endpoint
app.get('/units/by-property', async (req, res) => {
  try {
    console.log('🏘️ Fetching units by property...');
    const query = `
      SELECT 
        Property,
        COUNT(*) as total_units,
        COUNT(CASE WHEN Status = 'Occupied' THEN 1 END) as occupied_units,
        COUNT(CASE WHEN Status = 'Vacant' THEN 1 END) as vacant_units,
        ROUND(AVG(Rent), 2) as avg_rent,
        ROUND(AVG(COALESCE(Market_Rent, Rent * 1.05)), 2) as avg_market_rent
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      WHERE Rent > 0
      GROUP BY Property
      ORDER BY total_units DESC
    `;
    
    const [rows] = await bq.query(query);
    
    res.json({
      status: 'success',
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('❌ Property units query error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🎉 RentRoll AI Test API running on http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/health`);
  console.log(`🔍 BigQuery Test: http://localhost:${port}/test-bigquery`);
  console.log(`💬 Ready for NL queries!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 