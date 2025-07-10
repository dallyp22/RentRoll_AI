import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true) // Default to dark mode for this app

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative w-12 h-6 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20"
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center"
        animate={{
          x: isDark ? 0 : 24,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        <motion.div
          animate={{
            rotate: isDark ? 0 : 180,
          }}
          transition={{
            duration: 0.3,
          }}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-slate-700" />
          ) : (
            <Sun className="h-3 w-3 text-amber-500" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  )
} 