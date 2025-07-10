import { z } from 'zod';

// Natural language query schemas
export const NLQueryRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  sessionId: z.string().optional(),
  includeExplanation: z.boolean().default(true),
});

export const NLQueryResponseSchema = z.object({
  data: z.array(z.record(z.any())),
  sql: z.string(),
  explanation: z.string().optional(),
  executionTime: z.number(),
  bytesProcessed: z.number(),
  cached: z.boolean(),
  sessionId: z.string(),
});

// Pricing request schemas
export const PricingInputSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  bedrooms: z.number().min(0).max(10),
  bathrooms: z.number().min(0).max(10),
  squareFeet: z.number().min(100).max(10000),
  amenities: z.array(z.string()).default([]),
  floorLevel: z.number().optional(),
  hasBalcony: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  utilities: z.array(z.string()).optional(),
  targetOccupancy: z.number().min(0).max(100).optional(),
  marketCondition: z.enum(['hot', 'normal', 'soft']).default('normal'),
});

export const PricingResponseSchema = z.object({
  recommendedRent: z.number(),
  rentRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  rentPerSqft: z.number(),
  confidence: z.number().min(0).max(100),
  factors: z.object({
    baseRent: z.number(),
    amenityAdjustment: z.number(),
    marketAdjustment: z.number(),
    seasonalAdjustment: z.number(),
    occupancyAdjustment: z.number(),
  }),
  comparables: z.array(z.object({
    propertyName: z.string(),
    distance: z.number(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    squareFeet: z.number(),
    rent: z.number(),
    rentPerSqft: z.number(),
    amenities: z.array(z.string()),
    dataSource: z.string(),
    date: z.date(),
  })),
  reasoning: z.string(),
});

// Unit and property schemas
export const UnitSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  unitNumber: z.string(),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  squareFeet: z.number().min(1),
  currentRent: z.number().min(0),
  marketRent: z.number().min(0),
  isOccupied: z.boolean(),
  leaseStartDate: z.date().optional(),
  leaseEndDate: z.date().optional(),
  amenities: z.array(z.string()),
  lastRenovated: z.date().optional(),
});

export const PropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  totalUnits: z.number().min(1),
  occupancy: z.number().min(0).max(100),
  marketRentPerSqft: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Chat schemas
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  sql: z.string().optional(),
  queryResult: z.object({
    data: z.array(z.record(z.any())),
    sql: z.string(),
    executionTime: z.number(),
    bytesProcessed: z.number(),
    cached: z.boolean(),
  }).optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export type inference helpers
export type NLQueryRequest = z.infer<typeof NLQueryRequestSchema>;
export type NLQueryResponse = z.infer<typeof NLQueryResponseSchema>;
export type PricingInput = z.infer<typeof PricingInputSchema>;
export type PricingResponse = z.infer<typeof PricingResponseSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>; 