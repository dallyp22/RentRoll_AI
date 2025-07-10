// Core property and unit types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  occupancy: number;
  marketRentPerSqft: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  currentRent: number;
  marketRent: number;
  isOccupied: boolean;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  amenities: string[];
  lastRenovated?: Date;
}

// Pricing and market data types
export interface MarketComparable {
  propertyName: string;
  distance: number; // miles
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rent: number;
  rentPerSqft: number;
  amenities: string[];
  dataSource: string;
  date: Date;
}

export interface PricingFactors {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  floorLevel?: number;
  hasBalcony?: boolean;
  hasParking?: boolean;
  petFriendly?: boolean;
  utilities?: string[];
}

export interface PricingResult {
  recommendedRent: number;
  rentRange: {
    min: number;
    max: number;
  };
  rentPerSqft: number;
  confidence: number; // 0-100
  factors: {
    baseRent: number;
    amenityAdjustment: number;
    marketAdjustment: number;
    seasonalAdjustment: number;
    occupancyAdjustment: number;
  };
  comparables: MarketComparable[];
  reasoning: string;
}

// Query and response types
export interface QueryResult {
  data: any[];
  sql: string;
  executionTime: number;
  bytesProcessed: number;
  cached: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sql?: string;
  queryResult?: QueryResult;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
} 