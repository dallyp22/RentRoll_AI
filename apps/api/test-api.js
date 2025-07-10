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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow all Vercel preview and production URLs
    if (origin.includes('.vercel.app') || 
        origin.includes('vercel.app') ||
        origin.includes('.up.railway.app') ||
        allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
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

// Enhanced NL query endpoint with better pattern matching
app.post('/nl-query', async (req, res) => {
  try {
    const { query, prompt } = req.body;
    const userQuery = query || prompt;
    console.log('📝 NL Query:', userQuery);
    
    const lowerQuery = userQuery.toLowerCase();
    let sqlQuery = '';
    let explanation = '';
    
    // Improved pattern matching with more specific logic
    if (lowerQuery.includes('1 bedroom') || lowerQuery.includes('one bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, ROUND(AVG(Rent), 2) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 1 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' AND Rent > 0
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 1-bedroom units by property`;
      
    } else if (lowerQuery.includes('2 bedroom') || lowerQuery.includes('two bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, ROUND(AVG(Rent), 2) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 2 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' AND Rent > 0
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 2-bedroom units by property`;
      
    } else if (lowerQuery.includes('least') || lowerQuery.includes('cheapest') || lowerQuery.includes('lowest') || lowerQuery.includes('minimum')) {
      sqlQuery = `
        SELECT Unit, Property, Bedroom, Bathrooms, Sqft, Rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Rent IS NOT NULL AND Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        ORDER BY Rent ASC
        LIMIT 10
      `;
      explanation = `Found ${userQuery} - showing least expensive units`;
      
    } else if (lowerQuery.includes('most expensive') || lowerQuery.includes('highest') || lowerQuery.includes('maximum') || lowerQuery.includes('priciest')) {
      sqlQuery = `
        SELECT Unit, Property, Bedroom, Bathrooms, Sqft, Rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Rent IS NOT NULL AND Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        ORDER BY Rent DESC
        LIMIT 10
      `;
      explanation = `Found ${userQuery} - showing most expensive units`;
      
    } else if (lowerQuery.includes('vacant') || lowerQuery.includes('empty') || lowerQuery.includes('available')) {
      // First, let's check what status values actually exist
      sqlQuery = `
        SELECT Unit, Property, Bedroom, Bathrooms, Sqft, Status
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE (Status = 'Vacant' OR Status = 'Available' OR Status IS NULL OR Rent = 0 OR Rent IS NULL)
        AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        ORDER BY Property, Unit
        LIMIT 20
      `;
      explanation = `Found ${userQuery} - showing vacant/available units`;
      
    } else if (lowerQuery.includes('average rent') || lowerQuery.includes('avg rent') || lowerQuery.includes('mean rent')) {
      sqlQuery = `
        SELECT 
          Property,
          COUNT(*) as total_units,
          ROUND(AVG(Rent), 2) as average_rent,
          ROUND(MIN(Rent), 2) as min_rent,
          ROUND(MAX(Rent), 2) as max_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        GROUP BY Property
        ORDER BY average_rent DESC
      `;
      explanation = `Found ${userQuery} - showing average rent by property`;
      
    } else if (lowerQuery.includes('occupancy') || lowerQuery.includes('occupied')) {
      sqlQuery = `
        SELECT 
          Property,
          COUNT(*) as total_units,
          COUNT(CASE WHEN Rent > 0 THEN 1 END) as occupied_units,
          ROUND(COUNT(CASE WHEN Rent > 0 THEN 1 END) * 100.0 / COUNT(*), 2) as occupancy_rate
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        GROUP BY Property
        ORDER BY occupancy_rate DESC
      `;
      explanation = `Found ${userQuery} - showing occupancy rates by property`;
      
    } else if (lowerQuery.includes('3 bedroom') || lowerQuery.includes('three bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, ROUND(AVG(Rent), 2) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 3 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' AND Rent > 0
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 3-bedroom units by property`;
      
    } else if (lowerQuery.includes('4 bedroom') || lowerQuery.includes('four bedroom')) {
      sqlQuery = `
        SELECT Property, COUNT(*) as units, ROUND(AVG(Rent), 2) as avg_rent
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Bedroom = 4 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' AND Rent > 0
        GROUP BY Property
        ORDER BY units DESC
      `;
      explanation = `Found ${userQuery} - showing 4-bedroom units by property`;
      
    } else {
      // Default query - property overview
      sqlQuery = `
        SELECT 
          Property,
          COUNT(*) as total_units,
          ROUND(AVG(Rent), 2) as avg_rent,
          COUNT(CASE WHEN Rent > 0 THEN 1 END) as occupied_units
        FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
        WHERE Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
        GROUP BY Property 
        ORDER BY total_units DESC
        LIMIT 10
      `;
      explanation = `Generated query for: "${userQuery}". Showing property portfolio overview.`;
    }
    
    const [rows] = await bq.query(sqlQuery);
    
    res.json({
      data: rows,
      sql: sqlQuery,
      explanation: explanation,
      executionTime: 1200,
      bytesProcessed: 50000,
      cached: false,
      sessionId: req.body.sessionId || 'demo-session',
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

// Occupancy endpoint for Dashboard
app.get('/occupancy', async (req, res) => {
  try {
    console.log('📊 Fetching occupancy stats...');
    const query = `
      SELECT 
        COUNT(*) as total_units,
        COUNT(CASE WHEN Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' THEN 1 END) as occupied_units,
        COUNT(CASE WHEN Status = 'Vacant' OR Status = 'Available' THEN 1 END) as vacant_units,
        ROUND(COUNT(CASE WHEN Rent > 0 AND Unit IS NOT NULL AND Unit NOT LIKE '%Total%' THEN 1 END) * 100.0 / COUNT(*), 2) as occupancy_rate,
        ROUND(AVG(Rent), 2) as avg_rent
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      WHERE Unit IS NOT NULL AND Unit NOT LIKE '%Total%'
    `;
    
    const [rows] = await bq.query(query);
    const stats = rows[0];
    
    res.json({
      status: 'success',
      data: {
        total_units: parseInt(stats.total_units),
        occupied_units: parseInt(stats.occupied_units),
        occupancy_rate: parseFloat(stats.occupancy_rate),
        avg_rent: parseFloat(stats.avg_rent)
      }
    });
  } catch (error) {
    console.error('❌ Occupancy query error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

// Properties endpoint
app.get('/properties', async (req, res) => {
  try {
    console.log('🏢 Fetching properties data...');
    const query = `
      SELECT 
        Property,
        COUNT(*) as total_units,
        COUNT(CASE WHEN Status = 'Occupied' THEN 1 END) as occupied_units,
        ROUND(AVG(Rent), 2) as avg_rent,
        ROUND(AVG(COALESCE(Market_Rent, Rent * 1.05)), 2) as avg_market_rent
      FROM \`${process.env.BQ_PROJECT}.rentroll.Update_7_8_native\`
      WHERE Rent > 0
      GROUP BY Property
      ORDER BY total_units DESC
      LIMIT 10
    `;
    
    const [rows] = await bq.query(query);
    
    res.json({
      status: 'success',
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('❌ Properties query error:', error.message);
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