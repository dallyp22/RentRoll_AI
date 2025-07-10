import { z } from 'zod';
import { PricingInput, PricingResponse, MarketComparable } from '@rentroll-ai/shared';

// Internal types for pricing calculations
interface PricingFactors {
  basePricePerSqft: number;
  amenityMultiplier: number;
  seasonalMultiplier: number;
  marketMultiplier: number;
  occupancyMultiplier: number;
}

interface PricingWeights {
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  amenities: number;
  location: number;
  marketConditions: number;
}

export class DynamicPricingEngine {
  private readonly weights: PricingWeights = {
    squareFeet: 0.4,
    bedrooms: 0.25,
    bathrooms: 0.15,
    amenities: 0.1,
    location: 0.05,
    marketConditions: 0.05,
  };

  // Base price lookup by market (placeholder - would be from API or database)
  private readonly marketBasePrices: Record<string, number> = {
    'hot': 2.5,    // price per sqft
    'normal': 2.0,
    'soft': 1.7,
  };

  // Amenity value adjustments (percentage)
  private readonly amenityValues: Record<string, number> = {
    'pool': 0.08,
    'gym': 0.06,
    'parking': 0.05,
    'balcony': 0.04,
    'dishwasher': 0.03,
    'washer_dryer': 0.07,
    'air_conditioning': 0.05,
    'hardwood_floors': 0.04,
    'stainless_appliances': 0.03,
    'pet_friendly': 0.02,
    'gated_community': 0.06,
    'elevator': 0.03,
    'storage': 0.02,
    'patio': 0.03,
    'fireplace': 0.04,
  };

  /**
   * Calculate dynamic rent pricing
   */
  async calculateRent(input: PricingInput, comparables?: MarketComparable[]): Promise<PricingResponse> {
    try {
      // Step 1: Calculate base factors
      const factors = this.calculateFactors(input, comparables);
      
      // Step 2: Calculate base rent
      const baseRent = this.calculateBaseRent(input, factors);
      
      // Step 3: Apply adjustments
      const adjustedRent = this.applyAdjustments(baseRent, factors, input);
      
      // Step 4: Calculate rent range
      const rentRange = this.calculateRentRange(adjustedRent);
      
      // Step 5: Calculate confidence
      const confidence = this.calculateConfidence(input, comparables);
      
      // Step 6: Generate reasoning
      const reasoning = this.generateReasoning(input, factors, adjustedRent, comparables);
      
      return {
        recommendedRent: Math.round(adjustedRent),
        rentRange: {
          min: Math.round(rentRange.min),
          max: Math.round(rentRange.max),
        },
        rentPerSqft: Math.round((adjustedRent / input.squareFeet) * 100) / 100,
        confidence: Math.round(confidence),
        factors: {
          baseRent: Math.round(baseRent),
          amenityAdjustment: Math.round((factors.amenityMultiplier - 1) * baseRent),
          marketAdjustment: Math.round((factors.marketMultiplier - 1) * baseRent),
          seasonalAdjustment: Math.round((factors.seasonalMultiplier - 1) * baseRent),
          occupancyAdjustment: Math.round((factors.occupancyMultiplier - 1) * baseRent),
        },
        comparables: comparables || [],
        reasoning,
      };
    } catch (error) {
      throw new Error(`Pricing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate pricing scenarios for different occupancy targets
   */
  async generateScenarios(
    input: PricingInput,
    occupancyTargets: number[] = [85, 90, 95],
    comparables?: MarketComparable[]
  ): Promise<Array<PricingResponse & { occupancyTarget: number }>> {
    const scenarios = [];
    
    for (const target of occupancyTargets) {
      const scenarioInput = { ...input, targetOccupancy: target };
      const pricing = await this.calculateRent(scenarioInput, comparables);
      scenarios.push({
        ...pricing,
        occupancyTarget: target,
      });
    }
    
    return scenarios;
  }

  private calculateFactors(input: PricingInput, comparables?: MarketComparable[]): PricingFactors {
    // Base price per sqft based on market condition
    const basePricePerSqft = this.marketBasePrices[input.marketCondition] || this.marketBasePrices['normal'];
    
    // Amenity multiplier
    const amenityMultiplier = this.calculateAmenityMultiplier(input.amenities);
    
    // Seasonal multiplier (placeholder - would be based on actual seasonal data)
    const seasonalMultiplier = this.calculateSeasonalMultiplier();
    
    // Market multiplier based on comparables
    const marketMultiplier = this.calculateMarketMultiplier(input, comparables);
    
    // Occupancy multiplier
    const occupancyMultiplier = this.calculateOccupancyMultiplier(input.targetOccupancy);
    
    return {
      basePricePerSqft,
      amenityMultiplier,
      seasonalMultiplier,
      marketMultiplier,
      occupancyMultiplier,
    };
  }

  private calculateBaseRent(input: PricingInput, factors: PricingFactors): number {
    // Start with square footage as primary factor
    let baseRent = input.squareFeet * factors.basePricePerSqft;
    
    // Bedroom/bathroom adjustments
    const bedroomBonus = Math.max(0, input.bedrooms - 1) * 150; // $150 per additional bedroom
    const bathroomBonus = Math.max(0, input.bathrooms - 1) * 100; // $100 per additional bathroom
    
    baseRent += bedroomBonus + bathroomBonus;
    
    return baseRent;
  }

  private applyAdjustments(baseRent: number, factors: PricingFactors, input: PricingInput): number {
    let adjustedRent = baseRent;
    
    // Apply all multipliers
    adjustedRent *= factors.amenityMultiplier;
    adjustedRent *= factors.seasonalMultiplier;
    adjustedRent *= factors.marketMultiplier;
    adjustedRent *= factors.occupancyMultiplier;
    
    return adjustedRent;
  }

  private calculateAmenityMultiplier(amenities: string[]): number {
    let multiplier = 1;
    
    for (const amenity of amenities) {
      const value = this.amenityValues[amenity.toLowerCase()] || 0;
      multiplier += value;
    }
    
    // Cap the amenity bonus at 25%
    return Math.min(multiplier, 1.25);
  }

  private calculateSeasonalMultiplier(): number {
    const month = new Date().getMonth(); // 0-11
    
    // Peak season (spring/summer) vs off-peak
    if (month >= 3 && month <= 8) { // April through September
      return 1.02; // 2% increase during peak season
    } else {
      return 0.98; // 2% decrease during off-peak
    }
  }

  private calculateMarketMultiplier(input: PricingInput, comparables?: MarketComparable[]): number {
    if (!comparables || comparables.length === 0) {
      return 1; // No adjustment if no comparables
    }
    
    // Calculate average rent per sqft from comparables
    const avgRentPerSqft = comparables.reduce((sum, comp) => sum + comp.rentPerSqft, 0) / comparables.length;
    
    // Base market price per sqft
    const basePrice = this.marketBasePrices['normal'];
    
    // Adjust based on how market compares to our base
    const marketRatio = avgRentPerSqft / basePrice;
    
    // Cap the adjustment between 0.8 and 1.3 (20% down to 30% up)
    return Math.max(0.8, Math.min(1.3, marketRatio));
  }

  private calculateOccupancyMultiplier(targetOccupancy?: number): number {
    if (!targetOccupancy) return 1;
    
    // Lower target occupancy = higher prices to maintain revenue
    // Higher target occupancy = lower prices to attract tenants
    const baseOccupancy = 90; // Baseline
    const difference = targetOccupancy - baseOccupancy;
    
    // Each 1% occupancy difference = 0.5% price adjustment (inverse relationship)
    const adjustment = -difference * 0.005;
    
    return Math.max(0.8, Math.min(1.2, 1 + adjustment));
  }

  private calculateRentRange(recommendedRent: number): { min: number; max: number } {
    const variance = 0.1; // 10% variance
    
    return {
      min: recommendedRent * (1 - variance),
      max: recommendedRent * (1 + variance),
    };
  }

  private calculateConfidence(input: PricingInput, comparables?: MarketComparable[]): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence with more comparables
    if (comparables && comparables.length > 0) {
      confidence += Math.min(20, comparables.length * 4);
    }
    
    // Increase confidence for standard unit sizes
    if (input.bedrooms >= 1 && input.bedrooms <= 3 && input.squareFeet >= 500 && input.squareFeet <= 2000) {
      confidence += 5;
    }
    
    // Decrease confidence for unusual configurations
    if (input.bedrooms > 4 || input.squareFeet < 400 || input.squareFeet > 3000) {
      confidence -= 10;
    }
    
    return Math.max(50, Math.min(95, confidence));
  }

  private generateReasoning(
    input: PricingInput,
    factors: PricingFactors,
    finalRent: number,
    comparables?: MarketComparable[]
  ): string {
    const reasoning = [];
    
    reasoning.push(`Base calculation: ${input.squareFeet} sqft at $${factors.basePricePerSqft.toFixed(2)}/sqft in ${input.marketCondition} market`);
    
    if (input.bedrooms > 1) {
      reasoning.push(`Bedroom premium: +$${(input.bedrooms - 1) * 150} for ${input.bedrooms} bedrooms`);
    }
    
    if (input.bathrooms > 1) {
      reasoning.push(`Bathroom premium: +$${(input.bathrooms - 1) * 100} for ${input.bathrooms} bathrooms`);
    }
    
    if (input.amenities.length > 0) {
      const amenityValue = Math.round((factors.amenityMultiplier - 1) * 100);
      reasoning.push(`Amenity premium: +${amenityValue}% for ${input.amenities.length} amenities`);
    }
    
    if (factors.seasonalMultiplier !== 1) {
      const seasonalValue = Math.round((factors.seasonalMultiplier - 1) * 100);
      reasoning.push(`Seasonal adjustment: ${seasonalValue > 0 ? '+' : ''}${seasonalValue}% for current season`);
    }
    
    if (comparables && comparables.length > 0) {
      reasoning.push(`Market adjustment based on ${comparables.length} comparable properties`);
    }
    
    if (input.targetOccupancy) {
      const occValue = Math.round((factors.occupancyMultiplier - 1) * 100);
      reasoning.push(`Occupancy strategy: ${occValue > 0 ? '+' : ''}${occValue}% for ${input.targetOccupancy}% target occupancy`);
    }
    
    return reasoning.join('. ') + '.';
  }
} 