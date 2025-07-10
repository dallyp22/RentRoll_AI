import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Command } from 'cmdk'
import { 
  Search, 
  Home, 
  MessageSquare, 
  DollarSign, 
  Building2, 
  Calculator,
  BarChart3,
  Zap,
  Hash,
  ArrowRight
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [inputValue, setInputValue] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleCommand = (command: string) => {
    onClose()
    
    switch (command) {
      case 'dashboard':
        navigate('/')
        break
      case 'chat':
        navigate('/chat')
        break
      case 'units':
        navigate('/units')
        break
      case 'quick-stats':
        navigate('/?tab=stats')
        break
      case 'pricing-analysis':
        navigate('/units?filter=below-market')
        break
      case 'vacancy-report':
        navigate('/chat?q=Show vacant units')
        break
      default:
        // Handle search queries
        if (command.startsWith('search:')) {
          const query = command.replace('search:', '')
          navigate(`/chat?q=${encodeURIComponent(query)}`)
        }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="glass-card w-full max-w-2xl mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Command className="w-full" shouldFilter={false}>
            <div className="flex items-center border-b border-white/10 px-4">
              <Search className="h-5 w-5 text-white/50 mr-3" />
              <Command.Input
                value={inputValue}
                onValueChange={setInputValue}
                placeholder="Search commands, pages, or ask a question..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 py-4 text-lg"
              />
              <div className="flex items-center space-x-2 text-xs text-white/40">
                <kbd className="px-2 py-1 bg-white/10 rounded">↵</kbd>
                <span>to select</span>
              </div>
            </div>

            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="flex flex-col items-center justify-center py-12 text-center">
                <Hash className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/60 text-lg mb-2">No results found</p>
                <p className="text-white/40 text-sm">Try a different search term or command</p>
              </Command.Empty>

              {!inputValue && (
                <>
                  <Command.Group heading="Pages" className="mb-4">
                    <div className="text-xs font-medium text-white/60 px-3 py-2 mb-2">PAGES</div>
                    <CommandItem
                      value="dashboard"
                      onSelect={() => handleCommand('dashboard')}
                      icon={Home}
                      title="Dashboard"
                      subtitle="View portfolio overview"
                    />
                    <CommandItem
                      value="chat"
                      onSelect={() => handleCommand('chat')}
                      icon={MessageSquare}
                      title="Data Chat"
                      subtitle="Ask questions about your data"
                    />
                    <CommandItem
                      value="units"
                      onSelect={() => handleCommand('units')}
                      icon={DollarSign}
                      title="Unit Pricing"
                      subtitle="Optimize rental pricing"
                    />
                  </Command.Group>

                  <Command.Group heading="Quick Actions" className="mb-4">
                    <div className="text-xs font-medium text-white/60 px-3 py-2 mb-2">QUICK ACTIONS</div>
                    <CommandItem
                      value="quick-stats"
                      onSelect={() => handleCommand('quick-stats')}
                      icon={BarChart3}
                      title="Quick Stats"
                      subtitle="View key metrics"
                    />
                    <CommandItem
                      value="pricing-analysis"
                      onSelect={() => handleCommand('pricing-analysis')}
                      icon={Calculator}
                      title="Pricing Analysis"
                      subtitle="Units below market rate"
                    />
                    <CommandItem
                      value="vacancy-report"
                      onSelect={() => handleCommand('vacancy-report')}
                      icon={Building2}
                      title="Vacancy Report"
                      subtitle="Show vacant units"
                    />
                  </Command.Group>
                </>
              )}

              {inputValue && (
                <Command.Group heading="Search Results">
                  <div className="text-xs font-medium text-white/60 px-3 py-2 mb-2">SEARCH RESULTS</div>
                  <CommandItem
                    value={`search:${inputValue}`}
                    onSelect={() => handleCommand(`search:${inputValue}`)}
                    icon={Zap}
                    title={`Search: "${inputValue}"`}
                    subtitle="Ask Data Chat about this"
                  />
                  
                  {/* Dynamic suggestions based on input */}
                  {inputValue.toLowerCase().includes('bedroom') && (
                    <CommandItem
                      value="search:How many 1 bedroom units are there?"
                      onSelect={() => handleCommand('search:How many 1 bedroom units are there?')}
                      icon={MessageSquare}
                      title="Bedroom Analysis"
                      subtitle="Analyze units by bedroom count"
                    />
                  )}
                  
                  {inputValue.toLowerCase().includes('rent') && (
                    <CommandItem
                      value="search:What's the average rent by property?"
                      onSelect={() => handleCommand('search:What\'s the average rent by property?')}
                      icon={DollarSign}
                      title="Rent Analysis"
                      subtitle="Compare rental rates"
                    />
                  )}
                  
                  {inputValue.toLowerCase().includes('vacant') && (
                    <CommandItem
                      value="search:Show me all vacant units"
                      onSelect={() => handleCommand('search:Show me all vacant units')}
                      icon={Building2}
                      title="Vacancy Report"
                      subtitle="View available units"
                    />
                  )}
                </Command.Group>
              )}
            </Command.List>

            <div className="border-t border-white/10 px-4 py-3 bg-white/5">
              <div className="flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-white/10 rounded">↑</kbd>
                    <kbd className="px-2 py-1 bg-white/10 rounded">↓</kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <kbd className="px-2 py-1 bg-white/10 rounded">↵</kbd>
                    <span>select</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded">esc</kbd>
                  <span>close</span>
                </div>
              </div>
            </div>
          </Command>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface CommandItemProps {
  value: string
  onSelect: () => void
  icon: React.ElementType
  title: string
  subtitle: string
}

function CommandItem({ value, onSelect, icon: Icon, title, subtitle }: CommandItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group"
    >
      <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center group-hover:bg-brand-500/30 transition-colors">
        <Icon className="h-5 w-5 text-brand-400" />
      </div>
      <div className="flex-1">
        <div className="text-white font-medium">{title}</div>
        <div className="text-white/60 text-sm">{subtitle}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors" />
    </Command.Item>
  )
} 