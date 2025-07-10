import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  description?: string
  delay?: number
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description, 
  delay = 0 
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!change) return 'text-slate-400'
    switch (change.trend) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getTrendIcon = () => {
    if (!change) return null
    switch (change.trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      default: return '→'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-6 relative overflow-hidden group cursor-pointer"
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon container */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-brand-500/10 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 text-brand-400" />
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor()}`}>
            <span className="text-lg leading-none">{getTrendIcon()}</span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/60 tracking-wide uppercase">
          {title}
        </h3>
        
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-white font-display">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
        
        {description && (
          <p className="text-sm text-white/50 mt-2">
            {description}
          </p>
        )}
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%] group-hover:duration-1000" />
    </motion.div>
  )
} 