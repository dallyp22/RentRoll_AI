import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'rectangular'
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded'
  
  const variantClasses = {
    card: 'glass-card h-32 w-full',
    text: 'h-4 w-full rounded-md',
    circle: 'h-10 w-10 rounded-full',
    rectangular: 'h-20 w-full rounded-lg'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="circle" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton variant="text" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
} 