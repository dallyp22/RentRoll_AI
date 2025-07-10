import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  MessageSquare, 
  DollarSign, 
  Building2,
  Settings,
  Command,
  Bell,
  User
} from 'lucide-react'
import { ThemeToggle } from './ui/ThemeToggle'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Data Chat', href: '/chat', icon: MessageSquare },
  { name: 'Unit Pricing', href: '/units', icon: DollarSign },
]

export function Sidebar() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-64 glass-sidebar flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-glow">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-white">RentRoll AI</h1>
          <p className="text-xs text-white/60 font-medium">Property Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link
                to={item.href}
                className={`glass-nav-item flex items-center space-x-3 text-sm font-medium group ${
                  active ? 'active' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-brand-500/10 rounded-xl border border-brand-500/20 -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Command Palette Hint */}
      <div className="px-4 py-3">
        <div className="glass-nav-item cursor-pointer text-white/50 hover:text-white/70 group">
          <div className="flex items-center space-x-3 text-xs">
            <Command className="h-4 w-4" />
            <span>Press ⌘K for quick actions</span>
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dallas</p>
              <p className="text-xs text-white/60">Property Manager</p>
            </div>
          </div>
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-white/50 hover:text-white/70 hover:bg-white/10 rounded-lg transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <button className="p-2 text-white/50 hover:text-white/70 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  )
} 