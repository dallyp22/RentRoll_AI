import OpenAI from 'openai';
import { z } from 'zod';
import { 
  buildSqlPrompt, 
  buildNarrativePrompt, 
  SQL_FUNCTION_SCHEMA, 
  PRICING_FUNCTION_SCHEMA,
  SYSTEM_PROMPTS 
} from './prompts';

// Response schemas
const SqlGenerationResponseSchema = z.object({
  sql: z.string(),
  explanation: z.string(),
  estimatedComplexity: z.enum(['low', 'medium', 'high']),
});

const PricingResponseSchema = z.object({
  recommendedRent: z.number(),
  rentRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  keyFactors: z.array(z.string()),
});

export type SqlGenerationResponse = z.infer<typeof SqlGenerationResponseSchema>;
export type PricingGptResponse = z.infer<typeof PricingResponseSchema>;

export class RentRollGPTClient {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate SQL query from natural language
   */
  async generateSql(
    userQuestion: string, 
    context?: string
  ): Promise<SqlGenerationResponse> {
    try {
      const prompt = buildSqlPrompt(userQuestion, context);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        functions: [SQL_FUNCTION_SCHEMA],
        function_call: { name: 'generate_sql_query' },
        temperature: 0.1, // Low temperature for consistent SQL generation
        max_tokens: 1000,
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call returned from OpenAI');
      }

      const response = JSON.parse(functionCall.arguments);
      return SqlGenerationResponseSchema.parse(response);
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error(`Failed to generate SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate narrative analysis from query results
   */
  async generateNarrative(
    queryResults: any[], 
    originalQuestion: string, 
    sql: string
  ): Promise<string> {
    try {
      const prompt = buildNarrativePrompt(queryResults, originalQuestion, sql);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Slightly higher for more natural narrative
        max_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Error generating narrative:', error);
      throw new Error(`Failed to generate narrative: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate pricing recommendations
   */
  async generatePricing(
    propertyData: {
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
      amenities: string[];
      location?: string;
      comparables?: any[];
      marketCondition?: 'hot' | 'normal' | 'soft';
    }
  ): Promise<PricingGptResponse> {
    try {
      const prompt = this.buildPricingPrompt(propertyData);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        functions: [PRICING_FUNCTION_SCHEMA],
        function_call: { name: 'calculate_rent_price' },
        temperature: 0.2,
        max_tokens: 1000,
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call returned from OpenAI');
      }

      const response = JSON.parse(functionCall.arguments);
      return PricingResponseSchema.parse(response);
    } catch (error) {
      console.error('Error generating pricing:', error);
      throw new Error(`Failed to generate pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate SQL query for safety and efficiency
   */
  async validateSql(sql: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const prompt = `
As a SQL expert, analyze this BigQuery SQL query for potential issues:

${sql}

Check for:
1. Security issues (SQL injection risks)
2. Performance problems (missing LIMIT, inefficient joins)
3. Syntax errors
4. BigQuery-specific issues
5. Data access patterns that might be expensive

Provide a brief analysis of any issues and suggestions for improvement.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // Simple parsing - in production, you might want more structured output
      const hasIssues = content.toLowerCase().includes('issue') || 
                       content.toLowerCase().includes('problem') ||
                       content.toLowerCase().includes('error');

      return {
        isValid: !hasIssues,
        issues: hasIssues ? [content] : [],
        suggestions: [content],
      };
    } catch (error) {
      console.error('Error validating SQL:', error);
      return {
        isValid: false,
        issues: ['Failed to validate SQL query'],
        suggestions: [],
      };
    }
  }

  private buildPricingPrompt(propertyData: any): string {
    let prompt = SYSTEM_PROMPTS.PRICING_EXPERT + '\n\n';
    
    prompt += `Property details:
- Bedrooms: ${propertyData.bedrooms}
- Bathrooms: ${propertyData.bathrooms}
- Square feet: ${propertyData.squareFeet}
- Amenities: ${propertyData.amenities.join(', ')}`;

    if (propertyData.location) {
      prompt += `\n- Location: ${propertyData.location}`;
    }

    if (propertyData.marketCondition) {
      prompt += `\n- Market condition: ${propertyData.marketCondition}`;
    }

    if (propertyData.comparables && propertyData.comparables.length > 0) {
      prompt += '\n\nComparable properties:\n';
      propertyData.comparables.forEach((comp: any, index: number) => {
        prompt += `${index + 1}. ${comp.propertyName}: $${comp.rent}/month, ${comp.squareFeet} sqft, ${comp.bedrooms}br/${comp.bathrooms}ba\n`;
      });
    }

    prompt += '\n\nProvide a comprehensive pricing analysis and recommendation.';
    
    return prompt;
  }
} 