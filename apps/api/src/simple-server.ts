import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app: express.Application = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    bigQueryProject: 'rentroll-ai',
  });
});

// Natural Language Query endpoint - Demo version with realistic data
app.post('/nl-query', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Simple pattern matching for common queries
    const lowerPrompt = prompt.toLowerCase();
    let responseText = '';
    let data: any[] = [];

    if (lowerPrompt.includes('average rent') || lowerPrompt.includes('avg rent')) {
      responseText = `Your average rent across all 3,077 units is $1,295`;
      data = [
        { average_rent: 1295, total_units: 3077 }
      ];
    } else if (lowerPrompt.includes('1 bedroom') || lowerPrompt.includes('one bedroom')) {
      responseText = `You have 1,826 one-bedroom units across 17 properties. Here's the breakdown by property:`;
      data = [
        { Property: 'Atlas - 2929 California Plaza', unit_count: 441, avg_rent: 1284 },
        { Property: 'The Wire - 100 S 19th Street', unit_count: 223, avg_rent: 1325 },
        { Property: 'The Duo - 222 S 15th Street', unit_count: 195, avg_rent: 1255 },
        { Property: 'Breakers - 415 Leavenworth Street', unit_count: 168, avg_rent: 1489 },
        { Property: 'The Exchange at The Bank', unit_count: 142, avg_rent: 1021 }
      ];
    } else if (lowerPrompt.includes('2 bedroom') || lowerPrompt.includes('two bedroom')) {
      responseText = `You have 1,251 two-bedroom units across 17 properties. Here's the breakdown by property:`;
      data = [
        { Property: 'Atlas - 2929 California Plaza', unit_count: 291, avg_rent: 1485 },
        { Property: 'The Wire - 100 S 19th Street', unit_count: 183, avg_rent: 1567 },
        { Property: 'The Duo - 222 S 15th Street', unit_count: 177, avg_rent: 1445 },
        { Property: 'Breakers - 415 Leavenworth Street', unit_count: 149, avg_rent: 1689 },
        { Property: 'The Exchange at The Bank', unit_count: 168, avg_rent: 1321 }
      ];
    } else if (lowerPrompt.includes('vacant') || lowerPrompt.includes('available')) {
      responseText = `You currently have 89 vacant units across your portfolio. Here's the breakdown by property:`;
      data = [
        { Property: 'Atlas - 2929 California Plaza', vacant_units: 18, avg_rent: 1295 },
        { Property: 'The Wire - 100 S 19th Street', vacant_units: 12, avg_rent: 1329 },
        { Property: 'The Duo - 222 S 15th Street', vacant_units: 15, avg_rent: 1271 },
        { Property: 'Breakers - 415 Leavenworth Street', vacant_units: 8, avg_rent: 1506 },
        { Property: 'The Exchange at The Bank', vacant_units: 11, avg_rent: 1031 }
      ];
    } else if (lowerPrompt.includes('expensive') || lowerPrompt.includes('highest') || lowerPrompt.includes('most expensive')) {
      responseText = `Here are your most expensive units. The highest rent is $4,300 for unit 2801 at Atlas:`;
      data = [
        { Unit: '2801', Property: 'Atlas - 2929 California Plaza', Rent: 4300, Bedroom: 2, Bathroom: 2 },
        { Unit: '2701', Property: 'Atlas - 2929 California Plaza', Rent: 4250, Bedroom: 2, Bathroom: 2 },
        { Unit: '1901', Property: 'The Wire - 100 S 19th Street', Rent: 4100, Bedroom: 2, Bathroom: 2 },
        { Unit: '2501', Property: 'Atlas - 2929 California Plaza', Rent: 3950, Bedroom: 2, Bathroom: 2 },
        { Unit: '1801', Property: 'The Wire - 100 S 19th Street', Rent: 3850, Bedroom: 2, Bathroom: 2 }
      ];
    } else if (lowerPrompt.includes('occupancy') || lowerPrompt.includes('occupied')) {
      responseText = `Your portfolio has an occupancy rate of 97.1% with 2,988 occupied units out of 3,077 total units.`;
      data = [
        { total_units: 3077, occupied_units: 2988, occupancy_rate: 97.1 }
      ];
    } else {
      responseText = `Here's an overview of your property portfolio:`;
      data = [
        { Property: 'Atlas - 2929 California Plaza', units: 732, avg_rent: 1296 },
        { Property: 'The Wire - 100 S 19th Street', units: 306, avg_rent: 1329 },
        { Property: 'The Duo - 222 S 15th Street', units: 272, avg_rent: 1271 },
        { Property: 'Breakers - 415 Leavenworth Street', units: 217, avg_rent: 1506 },
        { Property: 'The Exchange at The Bank', units: 210, avg_rent: 1031 }
      ];
    }

    res.json({
      explanation: responseText,
      data: data,
      executionTime: 650,
      bytesProcessed: 15000,
      cached: false,
      sessionId: req.body.sessionId || 'demo-session',
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simple occupancy stats for dashboard
app.get('/occupancy', async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        total_units: 3077,
        occupied_units: 2988,
        occupancy_rate: 97.1,
        avg_rent: 1295.72
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simple data query for properties
app.get('/properties', async (req, res) => {
  try {
    const data = [
      { Property: 'Atlas - 2929 California Plaza Omaha, NE 68131', total_units: 732, occupied_units: 711, avg_rent: 1295.73, avg_market_rent: 1320.45 },
      { Property: 'The Wire - 100 S 19th Street Omaha, NE 68102', total_units: 306, occupied_units: 294, avg_rent: 1329.38, avg_market_rent: 1345.20 },
      { Property: 'The Duo - 222 S 15th Street Omaha, NE 68102', total_units: 272, occupied_units: 257, avg_rent: 1270.71, avg_market_rent: 1285.65 },
      { Property: 'Breakers - 415 Leavenworth Street Omaha, NE 68102', total_units: 217, occupied_units: 209, avg_rent: 1505.62, avg_market_rent: 1535.80 },
      { Property: 'The Exchange at The Bank - 1920 Farnam Street Omaha, NE 68102', total_units: 210, occupied_units: 199, avg_rent: 1031.05, avg_market_rent: 1055.25 }
    ];
    
    res.json({
      status: 'success',
      data: data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Schema endpoint for development
app.get('/schema', async (req, res) => {
  try {
    const schema = [
      { name: 'Property', type: 'STRING', mode: 'REQUIRED', description: 'Property name and address' },
      { name: 'Unit', type: 'STRING', mode: 'REQUIRED', description: 'Unit number' },
      { name: 'Bedroom', type: 'INTEGER', mode: 'REQUIRED', description: 'Number of bedrooms' },
      { name: 'Bathroom', type: 'FLOAT', mode: 'REQUIRED', description: 'Number of bathrooms' },
      { name: 'Rent', type: 'FLOAT', mode: 'REQUIRED', description: 'Monthly rent amount' },
      { name: 'MarketRent', type: 'FLOAT', mode: 'NULLABLE', description: 'Estimated market rent' },
      { name: 'Status', type: 'STRING', mode: 'REQUIRED', description: 'Unit status (Occupied/Vacant)' },
      { name: 'LeaseEnd', type: 'DATE', mode: 'NULLABLE', description: 'Lease expiration date' },
      { name: 'SqFt', type: 'INTEGER', mode: 'NULLABLE', description: 'Square footage' },
    ];
    
    res.json({
      table: 'rentroll.Update_7_8',
      schema: schema,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Queries endpoint for dashboard metrics
app.get('/queries', async (req, res) => {
  try {
    const recentQueries = [
      { id: 1, query: 'Show me 1 bedroom units', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), execution_time: 650 },
      { id: 2, query: 'What is the average rent?', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), execution_time: 420 },
      { id: 3, query: 'Show vacant units', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), execution_time: 780 },
      { id: 4, query: 'Most expensive properties', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(), execution_time: 540 },
      { id: 5, query: 'How many 2 bedroom units?', timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(), execution_time: 610 },
    ];
    
    res.json({
      status: 'success',
      data: {
        recentQueries: recentQueries,
        totalQueries: 247,
        avgExecutionTime: 600,
        queriesThisMonth: 89
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 RentRoll AI Demo API running on port ${port}`);
  console.log(`📊 Demo Mode: Using realistic sample data`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`💬 Natural Language: http://localhost:${port}/nl-query`);
});

export default app; 