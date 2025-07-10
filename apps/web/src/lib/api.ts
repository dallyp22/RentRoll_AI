import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.message || 'Request failed')
    } else if (error.request) {
      // Network error
      throw new Error('Network error - please check your connection')
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred')
    }
  }
)

// Specific API functions
export const nlQuery = async (prompt: string, sessionId?: string) => {
  return api.post('/nl-query', {
    prompt,
    sessionId,
    includeExplanation: true,
  })
}

export const calculatePricing = async (input: any) => {
  return api.post('/price', input)
}

export const generateScenarios = async (input: any, occupancyTargets?: number[]) => {
  return api.post('/scenarios', {
    ...input,
    occupancyTargets,
  })
}

export const getSchema = async () => {
  return api.get('/schema')
}

export const getHealth = async () => {
  return api.get('/health')
}

// Add new functions for the existing endpoints
export const getOccupancy = async () => {
  return api.get('/occupancy')
}

export const getProperties = async () => {
  return api.get('/properties')
}

// Add new functions for units data
export const getUnits = async (params: { limit?: number; status?: string; property?: string } = {}) => {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.property) queryParams.append('property', params.property);
  
  const url = `/units${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return api.get(url);
}

export const getUnitsByProperty = async () => {
  return api.get('/units/by-property')
}

// Add a function to get queries (for dashboard metrics)
export const getQueries = async () => {
  // For now, return mock data since this endpoint doesn't exist in simple server
  return {
    recentQueries: [
      { id: 1, query: 'Show me 1 bedroom units', timestamp: new Date().toISOString() },
      { id: 2, query: 'What is the average rent?', timestamp: new Date().toISOString() },
    ],
    totalQueries: 247
  }
} 