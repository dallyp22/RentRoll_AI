import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Bed, 
  Bath, 
  Square, 
  MapPin,
  Filter,
  Search,
  Settings,
  Eye,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from 'react-hot-toast'
import { getUnits } from '../lib/api'

interface Unit {
  id: string
  unitNumber: string
  property: string
  bedrooms: number
  bathrooms: number
  sqft: number
  currentRent: number
  marketRent: number
  status: 'occupied' | 'vacant'
  leaseEnd?: string
  tenantName?: string
  marketPosition: 'below' | 'at' | 'above'
  recommendation: string
}

interface UnitCardProps {
  unit: Unit
  delay?: number
  onViewDetails: (unit: Unit) => void
}

function UnitCard({ unit, delay = 0, onViewDetails }: UnitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'vacant': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'below': return 'text-green-400'
      case 'at': return 'text-blue-400'
      case 'above': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getMarketPositionIcon = (position: string) => {
    switch (position) {
      case 'below': return <TrendingDown className="h-4 w-4" />
      case 'at': return <div className="w-4 h-4 bg-blue-400 rounded-full" />
      case 'above': return <TrendingUp className="h-4 w-4" />
    }
  }

  const percentDiff = ((unit.currentRent - unit.marketRent) / unit.marketRent * 100).toFixed(1)
  const isUnderpriced = unit.currentRent < unit.marketRent

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card p-6 cursor-pointer group relative overflow-hidden"
      onClick={() => onViewDetails(unit)}
    >
      {/* Status Badge - Only show for occupied/vacant */}
      {(unit.status === 'occupied' || unit.status === 'vacant') && (
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(unit.status)}`}>
            {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
          </div>
        </div>
      )}

      {/* Unit Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white">{unit.unitNumber}</h3>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-white/60">
          <MapPin className="h-4 w-4" />
          <span>{unit.property}</span>
        </div>
      </div>

      {/* Unit Details */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Bed className="h-4 w-4 text-brand-400" />
          <span className="text-sm text-white/70">{unit.bedrooms}BR</span>
        </div>
        <div className="flex items-center space-x-2">
          <Bath className="h-4 w-4 text-brand-400" />
          <span className="text-sm text-white/70">{unit.bathrooms}BA</span>
        </div>
        <div className="flex items-center space-x-2">
          <Square className="h-4 w-4 text-brand-400" />
          <span className="text-sm text-white/70">{unit.sqft}SF</span>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Current Rent</span>
          <span className="text-lg font-bold text-white">${unit.currentRent.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Market Rent</span>
          <span className="text-lg font-semibold text-white/80">${unit.marketRent.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Variance</span>
          <div className={`flex items-center space-x-1 ${getMarketPositionColor(unit.marketPosition)}`}>
            {getMarketPositionIcon(unit.marketPosition)}
            <span className="text-sm font-medium">
              {isUnderpriced ? '-' : '+'}{Math.abs(parseFloat(percentDiff))}%
            </span>
          </div>
        </div>
      </div>

      {/* Market Position Badge */}
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          unit.marketPosition === 'below' 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : unit.marketPosition === 'above'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {unit.marketPosition === 'below' && <TrendingDown className="h-3 w-3 mr-1" />}
          {unit.marketPosition === 'above' && <TrendingUp className="h-3 w-3 mr-1" />}
          {unit.marketPosition === 'below' && `Below Market - ${Math.abs(parseFloat(percentDiff))}%`}
          {unit.marketPosition === 'above' && `Above Market + ${Math.abs(parseFloat(percentDiff))}%`}
          {unit.marketPosition === 'at' && 'At Market Rate'}
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4">
        <p className="text-sm text-white/70 line-clamp-2">
          {unit.recommendation}
        </p>
      </div>

      {/* Tenant Info */}
      {unit.status === 'occupied' && unit.tenantName && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{unit.tenantName}</p>
              <p className="text-xs text-white/60">Lease expires: {unit.leaseEnd}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-2 px-4 py-2 bg-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500/30 transition-colors text-sm">
          <Eye className="h-4 w-4" />
          <span>View Details</span>
        </button>
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-colors text-sm">
          <Zap className="h-4 w-4" />
          <span>Optimize</span>
        </button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  )
}

export default function UnitPricing() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'vacant'>('all')
  const [filterMarketPosition, setFilterMarketPosition] = useState<'all' | 'below' | 'at' | 'above'>('all')
  const [limit, setLimit] = useState(500) // Increased default limit
  const [, setSelectedUnit] = useState<Unit | null>(null)

  // Fetch real units data from API
  const { data: unitsResponse, isLoading, error } = useQuery({
    queryKey: ['units', filterStatus, limit],
    queryFn: async () => {
      const params: any = { limit };
      if (filterStatus !== 'all') {
        params.status = filterStatus === 'occupied' ? 'Occupied' : 
                       filterStatus === 'vacant' ? 'Vacant' : 'Maintenance';
      }
      return getUnits(params);
    },
    staleTime: 5 * 60 * 1000,
  })

  const units: Unit[] = unitsResponse?.data || []

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.property.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMarketPosition = filterMarketPosition === 'all' || unit.marketPosition === filterMarketPosition
    
    return matchesSearch && matchesMarketPosition
  })

  const handleViewDetails = (unit: Unit) => {
    setSelectedUnit(unit)
    toast.success(`Viewing details for Unit ${unit.unitNumber}`)
  }

  const handleLoadMore = () => {
    setLimit(prevLimit => prevLimit + 500)
    toast.success('Loading more units...')
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-white">Unit Pricing</h1>
          <p className="text-lg text-white/60">Optimize your rental pricing with AI-powered insights</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-white">Unit Pricing</h1>
          <p className="text-lg text-white/60">Optimize your rental pricing with AI-powered insights</p>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to load units</h3>
          <p className="text-white/60">There was an error loading your unit data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-white">Unit Pricing</h1>
          <p className="text-lg text-white/60">Optimize your rental pricing with AI-powered insights</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Showing Units</p>
                <p className="text-2xl font-bold text-white">{filteredUnits.length}</p>
                <p className="text-xs text-white/40">of {units.length} loaded</p>
              </div>
              <DollarSign className="h-8 w-8 text-brand-400" />
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Below Market</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredUnits.filter(u => u.marketPosition === 'below').length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Above Market</p>
                <p className="text-2xl font-bold text-red-400">
                  {filteredUnits.filter(u => u.marketPosition === 'above').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">At Market</p>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredUnits.filter(u => u.marketPosition === 'at').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search units or properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/50" />
              <span className="text-sm text-white/60">Filter by:</span>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="all">All Status</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
            </select>

            <select
              value={filterMarketPosition}
              onChange={(e) => setFilterMarketPosition(e.target.value as any)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="all">All Positions</option>
              <option value="below">Below Market</option>
              <option value="at">At Market</option>
              <option value="above">Above Market</option>
            </select>

            {/* Load Limit Selector */}
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value={250}>Show 250</option>
              <option value={500}>Show 500</option>
              <option value={1000}>Show 1000</option>
              <option value={2000}>Show 2000</option>
              <option value={3000}>Show All (3000)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredUnits.map((unit, index) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              delay={index * 0.1}
              onViewDetails={handleViewDetails}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {units.length > 0 && units.length === limit && limit < 3000 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : `Load More Units (${3000 - limit} remaining)`}
          </button>
        </motion.div>
      )}

      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Portfolio Summary</h3>
        <p className="text-white/60">
          Displaying {filteredUnits.length} units from your portfolio of 3,000 total units
        </p>
        {limit < 3000 && (
          <p className="text-sm text-white/40 mt-1">
            Use the dropdown above to load more units or view your entire portfolio
          </p>
        )}
      </motion.div>

      {/* Empty State */}
      {filteredUnits.length === 0 && units.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Settings className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No units match your filters</h3>
          <p className="text-white/60">Try adjusting your search criteria or filters to see more units.</p>
        </motion.div>
      )}
    </div>
  )
} 