import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CommandPalette } from './components/ui/CommandPalette'
import Dashboard from './pages/Dashboard'
import DataChat from './pages/DataChat'
import UnitPricing from './pages/UnitPricing'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<DataChat />} />
          <Route path="/units" element={<UnitPricing />} />
        </Routes>
      </Layout>
      
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </>
  )
}

export default App 