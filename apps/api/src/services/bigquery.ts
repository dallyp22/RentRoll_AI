import { BigQuery, Job } from '@google-cloud/bigquery';
import { QueryResult } from '@rentroll-ai/shared';

export class BigQueryService {
  private bq: BigQuery;
  private readonly defaultDataset = 'rentroll';
  private readonly defaultTable = 'Update_7_8_native';

  constructor() {
    this.bq = new BigQuery({
      projectId: process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  /**
   * Execute a query with cost and safety checks
   */
  async executeQuery(
    sql: string,
    options: {
      maxBytes?: number;
      maxResults?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<QueryResult> {
    const {
      maxBytes = 500 * 1024 * 1024, // 500MB default
      maxResults = 1000,
      timeoutMs = 30000, // 30 seconds
    } = options;

    try {
      const startTime = Date.now();

      // Step 1: Dry run to check cost
      const [dryRunJob] = await this.bq.createQueryJob({
        query: sql,
        dryRun: true,
      });

      const bytesProcessed = parseInt(
        dryRunJob.metadata.statistics?.totalBytesProcessed || '0'
      );

      if (bytesProcessed > maxBytes) {
        throw new Error(
          `Query would process ${bytesProcessed} bytes, exceeding limit of ${maxBytes} bytes`
        );
      }

      // Step 2: Execute actual query
      const [rows] = await this.bq.query({
        query: sql,
        maxResults,
        jobTimeoutMs: timeoutMs,
      });

      const executionTime = Date.now() - startTime;

      return {
        data: rows,
        sql,
        executionTime,
        bytesProcessed,
        cached: false, // TODO: Implement proper cache detection
      };
    } catch (error) {
      throw new Error(
        `BigQuery execution failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get table schema for reference
   */
  async getTableSchema(
    datasetId: string = this.defaultDataset,
    tableId: string = this.defaultTable
  ) {
    try {
      const [metadata] = await this.bq
        .dataset(datasetId)
        .table(tableId)
        .getMetadata();

      return {
        table: `${datasetId}.${tableId}`,
        schema: metadata.schema?.fields?.map((field: any) => ({
          name: field.name,
          type: field.type,
          mode: field.mode,
          description: field.description,
        })) || [],
        creationTime: metadata.creationTime,
        lastModifiedTime: metadata.lastModifiedTime,
        numRows: metadata.numRows,
        numBytes: metadata.numBytes,
      };
    } catch (error) {
      throw new Error(
        `Failed to get schema: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get sample data from the main table
   */
  async getSampleData(limit: number = 10) {
    const sql = `
      SELECT * 
      FROM \`${process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT}.${this.defaultDataset}.${this.defaultTable}\`
      LIMIT ${limit}
    `;

    return this.executeQuery(sql, { maxResults: limit });
  }

  /**
   * Get basic table statistics
   */
  async getTableStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT property_name) as unique_properties,
        COUNT(DISTINCT unit_number) as unique_units,
        AVG(current_rent) as avg_rent,
        MIN(current_rent) as min_rent,
        MAX(current_rent) as max_rent,
        AVG(square_feet) as avg_sqft,
        COUNT(CASE WHEN is_occupied = true THEN 1 END) as occupied_units,
        COUNT(CASE WHEN is_occupied = false THEN 1 END) as vacant_units
      FROM \`${process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT}.${this.defaultDataset}.${this.defaultTable}\`
    `;

    return this.executeQuery(sql);
  }

  /**
   * Validate SQL syntax without executing
   */
  async validateSql(sql: string): Promise<{
    isValid: boolean;
    error?: string;
    bytesProcessed?: number;
  }> {
    try {
      const [job] = await this.bq.createQueryJob({
        query: sql,
        dryRun: true,
      });

      const bytesProcessed = parseInt(
        job.metadata.statistics?.totalBytesProcessed || '0'
      );

      return {
        isValid: true,
        bytesProcessed,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent queries for a session (would require query history tracking)
   */
  async getQueryHistory(sessionId: string, limit: number = 10) {
    // TODO: Implement query history storage and retrieval
    // This would typically be stored in a separate table or Redis
    return {
      sessionId,
      queries: [],
      message: 'Query history not yet implemented',
    };
  }

  /**
   * Generate common property management queries
   */
  getCommonQueries() {
    const projectTable = `\`${process.env.BQ_PROJECT || process.env.BIGQUERY_PROJECT}.${this.defaultDataset}.${this.defaultTable}\``;
    
    return {
      occupancy_overview: {
        name: 'Portfolio Occupancy Overview',
        description: 'Current occupancy rates by property',
        sql: `
          SELECT 
            property_name,
            COUNT(*) as total_units,
            COUNT(CASE WHEN is_occupied = true THEN 1 END) as occupied_units,
            ROUND(COUNT(CASE WHEN is_occupied = true THEN 1 END) * 100.0 / COUNT(*), 2) as occupancy_rate
          FROM ${projectTable}
          GROUP BY property_name
          ORDER BY occupancy_rate DESC
        `,
      },
      rent_analysis: {
        name: 'Rent Analysis by Unit Type',
        description: 'Average rent by bedroom count',
        sql: `
          SELECT 
            bedrooms,
            COUNT(*) as unit_count,
            ROUND(AVG(current_rent), 2) as avg_rent,
            ROUND(AVG(current_rent / square_feet), 2) as avg_rent_per_sqft,
            MIN(current_rent) as min_rent,
            MAX(current_rent) as max_rent
          FROM ${projectTable}
          WHERE current_rent > 0
          GROUP BY bedrooms
          ORDER BY bedrooms
        `,
      },
      market_positioning: {
        name: 'Market vs Current Rent Analysis',
        description: 'Compare current rents to market rates',
        sql: `
          SELECT 
            property_name,
            AVG(current_rent) as avg_current_rent,
            AVG(market_rent) as avg_market_rent,
            ROUND(AVG(current_rent - market_rent), 2) as rent_gap,
            ROUND(AVG((current_rent - market_rent) / market_rent * 100), 2) as rent_gap_percent
          FROM ${projectTable}
          WHERE current_rent > 0 AND market_rent > 0
          GROUP BY property_name
          ORDER BY rent_gap_percent DESC
        `,
      },
    };
  }
} 