import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Clock,
  Database,
  Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { nlQuery } from '../lib/api'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  results?: any[]
  loading?: boolean
}

interface ChatHistory {
  id: string
  title: string
  timestamp: Date
  preview: string
}

export default function DataChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  // Mock chat history - in real app, this would come from an API
  const chatHistory: ChatHistory[] = [
    {
      id: '1',
      title: 'Bedroom Analysis',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      preview: 'How many 1 bedroom units are there?'
    },
    {
      id: '2',
      title: 'Pricing Analysis',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      preview: 'What are the most expensive units?'
    },
    {
      id: '3',
      title: 'Vacancy Report',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      preview: 'Show me vacant units by property'
    },
  ]

  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      // Use the nlQuery function from api.ts instead of raw fetch
      return nlQuery(query, 'demo-session')
    },
    onSuccess: (response) => {
      // Remove loading message and add response
      setMessages(prev => [
        ...prev.filter(msg => !msg.loading),
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: response.explanation || `Found ${response.data?.length || 0} results`,
          timestamp: new Date(),
          results: response.data,
        }
      ])
      setIsComposing(false)
      toast.success('Query processed successfully!')
    },
    onError: () => {
      setMessages(prev => prev.filter(msg => !msg.loading))
      setIsComposing(false)
      toast.error('Failed to process query')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isComposing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Analyzing your query...',
      timestamp: new Date(),
      loading: true,
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInput('')
    setIsComposing(true)
    queryMutation.mutate(input)
  }

  const formatResults = (results: any[]) => {
    if (!results || results.length === 0) return null

    // Show first few results in a clean table format
    const displayResults = results.slice(0, 10)
    const headers = Object.keys(displayResults[0])

    return (
      <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {headers.map((header) => (
                  <th key={header} className="text-left py-2 px-3 text-white/60 font-medium">
                    {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayResults.map((row, index) => (
                <tr key={index} className="border-b border-white/5">
                  {headers.map((header) => (
                    <td key={header} className="py-2 px-3 text-white/80">
                      {typeof row[header] === 'number' 
                        ? row[header].toLocaleString() 
                        : String(row[header] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length > 10 && (
          <p className="text-xs text-white/40 mt-3">
            Showing first 10 of {results.length} results
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] space-x-6">
      {/* Left Panel - Chat History */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-80 glass-card p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Chat History</h2>
        </div>

        <div className="space-y-3">
          {chatHistory.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white group-hover:text-brand-400 transition-colors">
                    {chat.title}
                  </h3>
                  <p className="text-sm text-white/60 mt-1 line-clamp-2">
                    {chat.preview}
                  </p>
                  <p className="text-xs text-white/40 mt-2">
                    {chat.timestamp.toLocaleDateString()}
                  </p>
                </div>
                <MessageSquare className="h-4 w-4 text-white/40 group-hover:text-brand-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/60 mb-3">Quick Questions</h3>
          <div className="space-y-2">
            {[
              'What\'s my average rent?',
              'How many 1 bedroom units?',
              'Show vacant units',
              'Most expensive properties',
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all duration-200"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Chat Interface */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 glass-card p-6 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Data Chat</h1>
              <p className="text-sm text-white/60">Ask questions about your property data</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-400 font-medium">BigQuery Connected</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4">
                  <Database className="h-8 w-8 text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start a conversation</h3>
                <p className="text-white/60 max-w-md">
                  Ask me anything about your property data. I can help you analyze units, rents, occupancy, and more.
                </p>
              </motion.div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-white/10 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/10 text-white border-l-2 border-brand-600'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        
                        {message.loading && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        )}
                      </div>

                      {/* Results Table */}
                      {message.results && formatResults(message.results)}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/40">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your property data..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
              disabled={isComposing}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-brand-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isComposing}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </motion.div>
    </div>
  )
} 