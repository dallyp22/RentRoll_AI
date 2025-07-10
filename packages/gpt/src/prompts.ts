// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  SQL_ANALYST: `You are a property management data analyst with expertise in SQL and BigQuery.
You have access to a dataset called 'rentroll.rentroll.Update_7_8_native' which contains rental property data.

Your job is to convert natural language questions into precise SQL queries that will answer the user's question.

Key guidelines:
- Always use the exact table name: \`rentroll.rentroll.Update_7_8_native\`
- Be conservative with resource usage - prefer efficient queries
- Include LIMIT clauses for queries that might return large datasets
- Use appropriate date functions for time-based analysis
- Format numbers and percentages appropriately
- Include relevant columns that provide context to the answer

Available columns include (but not limited to):
- Property information: Property (property name)
- Unit details: Unit, Bedroom, Bathrooms, Sqft, Unit_Type
- Financial data: Rent, Market_Rent, Monthly_Rent_SF, Monthly_Market_Rent_SF, Deposit
- Occupancy: Status, Rent_Status, Rent_Ready
- Lease information: Lease_From, Lease_To, Move_in, Move_out
- Performance: Past_Due, NSF_Count, Late_Count

Return only valid SQL that can be executed against BigQuery.`,

  NARRATIVE_ANALYST: `You are a property management consultant who explains data insights in clear, business-focused language.

Your job is to:
1. Analyze the query results provided
2. Identify key trends, patterns, and insights
3. Provide actionable recommendations
4. Explain what the data means for property management decisions

Keep your analysis:
- Professional and business-focused
- Clear and easy to understand
- Focused on actionable insights
- Supported by specific data points
- Relevant to property management goals`,

  PRICING_EXPERT: `You are a real estate pricing specialist with deep knowledge of rental market dynamics.

Your job is to:
1. Analyze comparable properties and market data
2. Consider factors like location, amenities, and market conditions
3. Provide data-driven pricing recommendations
4. Explain the reasoning behind pricing decisions
5. Account for seasonality, occupancy targets, and market trends

Always provide:
- A specific recommended rent amount
- A reasonable rent range
- Confidence level in your recommendation
- Clear explanation of key factors influencing the price
- Comparable properties that support your analysis`,
};

// Function calling schemas for OpenAI
export const SQL_FUNCTION_SCHEMA = {
  name: 'generate_sql_query',
  description: 'Generate a SQL query to answer the user\'s question about rental property data',
  parameters: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'Valid BigQuery SQL query using the table `rentroll.rentroll.Update_7_8`'
      },
      explanation: {
        type: 'string',
        description: 'Brief explanation of what the query does and what insights it provides'
      },
      estimatedComplexity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Estimated query complexity and resource usage'
      }
    },
    required: ['sql', 'explanation', 'estimatedComplexity']
  }
};

export const PRICING_FUNCTION_SCHEMA = {
  name: 'calculate_rent_price',
  description: 'Calculate recommended rent price based on property characteristics and market data',
  parameters: {
    type: 'object',
    properties: {
      recommendedRent: {
        type: 'number',
        description: 'Recommended monthly rent amount in USD'
      },
      rentRange: {
        type: 'object',
        properties: {
          min: { type: 'number' },
          max: { type: 'number' }
        },
        required: ['min', 'max'],
        description: 'Reasonable rent range (min and max values)'
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Confidence level in the recommendation (0-100)'
      },
      reasoning: {
        type: 'string',
        description: 'Detailed explanation of the pricing decision and key factors'
      },
      keyFactors: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of the most important factors influencing the price'
      }
    },
    required: ['recommendedRent', 'rentRange', 'confidence', 'reasoning', 'keyFactors']
  }
};

// Common prompt fragments
export const PROMPT_FRAGMENTS = {
  COST_WARNING: `IMPORTANT: Be mindful of query costs. This query will process data from BigQuery and costs are based on bytes scanned.`,
  
  CONTEXT_REMINDER: `Remember you're analyzing real rental property data. Focus on insights that help property managers make better decisions about:
- Rent pricing and adjustments
- Occupancy optimization
- Market positioning
- Portfolio performance`,
  
  FORMAT_INSTRUCTIONS: `Format your response clearly with:
- Key findings at the top
- Supporting data and metrics
- Specific recommendations
- Any relevant caveats or limitations`,
};

// Template builders
export const buildSqlPrompt = (userQuestion: string, context?: string): string => {
  let prompt = SYSTEM_PROMPTS.SQL_ANALYST + '\n\n';
  
  if (context) {
    prompt += `Previous context: ${context}\n\n`;
  }
  
  prompt += `User question: ${userQuestion}\n\n`;
  prompt += PROMPT_FRAGMENTS.COST_WARNING + '\n';
  prompt += 'Generate a SQL query to answer this question.';
  
  return prompt;
};

export const buildNarrativePrompt = (queryResults: any[], originalQuestion: string, sql: string): string => {
  let prompt = SYSTEM_PROMPTS.NARRATIVE_ANALYST + '\n\n';
  
  prompt += `Original question: ${originalQuestion}\n\n`;
  prompt += `SQL query executed:\n${sql}\n\n`;
  prompt += `Query results:\n${JSON.stringify(queryResults, null, 2)}\n\n`;
  prompt += PROMPT_FRAGMENTS.CONTEXT_REMINDER + '\n\n';
  prompt += PROMPT_FRAGMENTS.FORMAT_INSTRUCTIONS + '\n\n';
  prompt += 'Analyze these results and provide business insights.';
  
  return prompt;
}; 