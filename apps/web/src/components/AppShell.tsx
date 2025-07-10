import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-slate-800">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="px-8 py-6 min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
} 