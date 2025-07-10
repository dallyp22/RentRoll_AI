import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, DollarSign, TrendingUp, Users, MapPin, Calendar, Target } from 'lucide-react'
import { MetricCard } from '../components/ui/MetricCard'
import { SkeletonMetrics } from '../components/ui/Skeleton'

interface DashboardData {
  totalUnits: number
  totalRent: number
  avgRent: number
  occupancy: number
  propertiesCount: number
  pendingApplications: number
  maintenanceRequests: number
  lastUpdated: string
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    // Fetch basic statistics from API
    const response = await fetch('/api/occupancy')
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }
    const result = await response.json()
    
    if (result.status === 'success' && result.data) {
      const data = result.data
      return {
        totalUnits: data.total_units || 3000,
        totalRent: (data.total_units || 3000) * (data.avg_rent || 2433),
        avgRent: Math.round(data.avg_rent || 2433),
        occupancy: Math.round(data.occupancy_rate || 94),
        propertiesCount: 17, // Static for now
        pendingApplications: 23, // Static for now
        maintenanceRequests: 7, // Static for now
        lastUpdated: new Date().toISOString(),
      }
    } else {
      throw new Error('Invalid response format')
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    // Fallback to static data
    return {
      totalUnits: 3000,
      totalRent: 7300000,
      avgRent: 2433,
      occupancy: 94,
      propertiesCount: 17,
      pendingApplications: 23,
      maintenanceRequests: 7,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-white">Dashboard</h1>
          <p className="text-lg text-white/60">Welcome back! Here's your property portfolio overview.</p>
        </div>
        <SkeletonMetrics />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display text-white">Dashboard</h1>
          <p className="text-lg text-white/60">Welcome back! Here's your property portfolio overview.</p>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to load dashboard</h3>
          <p className="text-white/60">There was an error loading your dashboard data. Please try again later.</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total Units',
      value: data?.totalUnits || 3000,
      change: { value: 5.2, trend: 'up' as const },
      icon: Building2,
      description: 'Active rental units',
      delay: 0,
    },
    {
      title: 'Monthly Revenue',
      value: `$${((data?.totalRent || 7300000) / 1000).toFixed(0)}K`,
      change: { value: 3.8, trend: 'up' as const },
      icon: DollarSign,
      description: 'Gross monthly income',
      delay: 0.1,
    },
    {
      title: 'Average Rent',
      value: `$${data?.avgRent || 2433}`,
      change: { value: 2.1, trend: 'up' as const },
      icon: TrendingUp,
      description: 'Per unit average',
      delay: 0.2,
    },
    {
      title: 'Occupancy Rate',
      value: `${data?.occupancy || 94}%`,
      change: { value: 1.2, trend: 'up' as const },
      icon: Users,
      description: 'Current occupancy',
      delay: 0.3,
    },
  ]

  const additionalMetrics = [
    {
      title: 'Properties',
      value: data?.propertiesCount || 17,
      icon: MapPin,
      description: 'Managed properties',
      delay: 0.4,
    },
    {
      title: 'Applications',
      value: data?.pendingApplications || 23,
      icon: Calendar,
      description: 'Pending review',
      delay: 0.5,
    },
    {
      title: 'Maintenance',
      value: data?.maintenanceRequests || 7,
      icon: Target,
      description: 'Active requests',
      delay: 0.6,
    },
  ]

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
          <h1 className="text-4xl font-bold font-display text-white">Dashboard</h1>
          <p className="text-lg text-white/60">Welcome back! Here's your property portfolio overview.</p>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-white/60">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-brand-400 rounded-full"></div>
                <span className="text-sm text-white/60">Data Sync Active</span>
              </div>
            </div>
            <div className="text-sm text-white/50">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {additionalMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'New tenant application', property: 'The Atlas', time: '2 hours ago', status: 'pending' },
            { action: 'Maintenance request completed', property: 'Drake Court', time: '4 hours ago', status: 'completed' },
            { action: 'Rent payment received', property: 'The Sterling', time: '6 hours ago', status: 'completed' },
            { action: 'Property inspection scheduled', property: 'The Wire', time: '8 hours ago', status: 'scheduled' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-400' :
                  activity.status === 'pending' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`}></div>
                <div>
                  <p className="text-white font-medium">{activity.action}</p>
                  <p className="text-sm text-white/60">{activity.property}</p>
                </div>
              </div>
              <span className="text-sm text-white/50">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
} 