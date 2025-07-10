import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BigQuery } from '@google-cloud/bigquery';
import { RentRollGPTClient } from '@rentroll-ai/gpt';
import { DynamicPricingEngine } from '@rentroll-ai/pricing';
import {
  NLQueryRequestSchema,
  PricingInputSchema,
  NLQueryResponse,
  PricingResponse,
  type NLQueryRequest,
  type PricingInput
} from '@rentroll-ai/shared';
import { createLogger, format, transports } from 'winston';

// Initialize services
const app: express.Application = express();
const port = process.env.PORT || 4000;

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ],
});

// Initialize BigQuery
const bq = new BigQuery({
  projectId: process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Initialize AI services
const gptClient = new RentRollGPTClient();
const pricingEngine = new DynamicPricingEngine();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Natural Language Query endpoint
app.post('/nl-query', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Validate request
    const { prompt, sessionId, includeExplanation } = NLQueryRequestSchema.parse(req.body);
    
    logger.info('Processing NL query', { prompt, sessionId });
    
    // Step 1: Generate SQL from natural language
    const sqlResult = await gptClient.generateSql(prompt);
    
    // Step 2: Validate SQL for safety and cost
    const validation = await gptClient.validateSql(sqlResult.sql);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Generated SQL failed validation',
        issues: validation.issues,
        suggestions: validation.suggestions,
      });
    }
    
    // Step 3: Cost guardrail - dry run to check bytes processed
    const [dryRunJob] = await bq.createQueryJob({
      query: sqlResult.sql,
      dryRun: true,
    });
    
    const bytesProcessed = parseInt(dryRunJob.metadata.statistics.totalBytesProcessed || '0');
    const maxBytes = 500 * 1024 * 1024; // 500 MB limit
    
    if (bytesProcessed > maxBytes) {
      logger.warn('Query exceeds byte limit', { bytesProcessed, maxBytes });
      return res.status(400).json({
        error: 'Query would process too much data',
        bytesProcessed,
        maxBytes,
        suggestion: 'Please refine your query to be more specific or add date filters',
      });
    }
    
    // Step 4: Execute the query
    const [rows] = await bq.query({
      query: sqlResult.sql,
      maxResults: 1000, // Limit results
    });
    
    const executionTime = Date.now() - startTime;
    
    // Step 5: Generate narrative explanation if requested
    let explanation: string | undefined;
    if (includeExplanation && rows.length > 0) {
      try {
        explanation = await gptClient.generateNarrative(rows, prompt, sqlResult.sql);
      } catch (error) {
        logger.error('Failed to generate explanation', error);
        // Continue without explanation rather than failing the whole request
      }
    }
    
    const response: NLQueryResponse = {
      data: rows,
      sql: sqlResult.sql,
      explanation,
      executionTime,
      bytesProcessed,
      cached: false, // TODO: Implement caching
      sessionId: sessionId || 'anonymous',
    };
    
    logger.info('NL query completed', {
      prompt,
      executionTime,
      bytesProcessed,
      resultCount: rows.length,
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error('NL query failed', error);
    res.status(500).json({
      error: 'Failed to process natural language query',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Dynamic Pricing endpoint
app.post('/price', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Validate request
    const input = PricingInputSchema.parse(req.body);
    
    logger.info('Processing pricing request', { input });
    
    // TODO: Fetch comparables from BigQuery or external API
    // For now, we'll use the pricing engine without comparables
    const pricing = await pricingEngine.calculateRent(input);
    
    const executionTime = Date.now() - startTime;
    
    logger.info('Pricing calculation completed', {
      input,
      recommendedRent: pricing.recommendedRent,
      confidence: pricing.confidence,
      executionTime,
    });
    
    res.json({
      ...pricing,
      executionTime,
    });
    
  } catch (error) {
    logger.error('Pricing calculation failed', error);
    res.status(500).json({
      error: 'Failed to calculate pricing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Pricing Scenarios endpoint
app.post('/scenarios', async (req, res) => {
  try {
    const input = PricingInputSchema.parse(req.body);
    const occupancyTargets = req.body.occupancyTargets || [85, 90, 95];
    
    logger.info('Processing scenario analysis', { input, occupancyTargets });
    
    const scenarios = await pricingEngine.generateScenarios(input, occupancyTargets);
    
    res.json({
      scenarios,
      baseInput: input,
    });
    
  } catch (error) {
    logger.error('Scenario analysis failed', error);
    res.status(500).json({
      error: 'Failed to generate scenarios',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// BigQuery schema inspection endpoint (for development)
app.get('/schema', async (req, res) => {
  try {
    const datasetId = 'rentroll';
    const tableId = 'Update_7_8';
    
    const [metadata] = await bq
      .dataset(datasetId)
      .table(tableId)
      .getMetadata();
    
    const schema = metadata.schema?.fields || [];
    
    res.json({
      table: `${datasetId}.${tableId}`,
      schema: schema.map((field: any) => ({
        name: field.name,
        type: field.type,
        mode: field.mode,
        description: field.description,
      })),
    });
    
  } catch (error) {
    logger.error('Schema inspection failed', error);
    res.status(500).json({
      error: 'Failed to inspect schema',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(port, () => {
  logger.info(`RentRoll AI API server running on port ${port}`, {
    environment: process.env.NODE_ENV || 'development',
    bigQueryProject: process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 