// Export all types
export * from './types.js';

// Export schemas and their inferred types with different names to avoid conflicts
export {
  NLQueryRequestSchema,
  NLQueryResponseSchema,
  PricingInputSchema,
  PricingResponseSchema,
  UnitSchema,
  PropertySchema,
  ChatMessageSchema,
  ChatSessionSchema,
} from './schemas.js';

// Export the inferred types from schemas
export type {
  NLQueryRequest,
  NLQueryResponse,
  PricingInput,
  PricingResponse,
} from './schemas.js';

// Common utilities and constants
export const AMENITIES = [
  'pool',
  'gym',
  'parking',
  'balcony',
  'dishwasher',
  'washer_dryer',
  'air_conditioning',
  'hardwood_floors',
  'stainless_appliances',
  'pet_friendly',
  'gated_community',
  'elevator',
  'storage',
  'patio',
  'fireplace',
] as const;

export const UTILITIES = [
  'water',
  'electric',
  'gas',
  'internet',
  'cable',
  'trash',
  'sewer',
] as const;

export const MARKET_CONDITIONS = [
  'hot',
  'normal',
  'soft',
] as const;

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const calculateRentPerSqft = (rent: number, squareFeet: number): number => {
  return Math.round((rent / squareFeet) * 100) / 100;
}; 