import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SUBJECTS = [
  { id: 'math', emoji: '📐', name: 'Mathematics' },
  { id: 'science', emoji: '🔬', name: 'Science' },
  { id: 'english', emoji: '📚', name: 'English' },
  { id: 'history', emoji: '🏛️', name: 'History' },
  { id: 'geography', emoji: '🌍', name: 'Geography' },
  { id: 'general', emoji: '💡', name: 'General Knowledge' }
]

const SAMPLE_RESPONSES = {
  math: "Let me help you with this math problem. Could you share the specific question you're working on? I'll break it down step by step.",
  science: "Great question! Let's explore this scientific concept together. What specific topic are you studying?",
  english: "I'd be happy to help with English! Whether it's grammar, vocabulary, or literature - let's dive in.",
  history: "History is fascinating! What period or event would you like to learn about?",
  geography: "Let's explore the world! What geographical concept would you like to understand better?",
  general: "I'm here to help you learn! What would you like to know more about today?"
}

export default function Chat({ user }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI study partner. Select a subject to get started, or ask me anything!" }
  ])
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState(null)
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)

  useEffect(() => {
    if (!user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate AI response - replace with actual API call
    setTimeout(() => {
      const aiMsg = { 
        role: 'assistant', 
        content: SAMPLE_RESPONSES[subject?.id] || "That's a great question! Let me think about that and get back to you with a detailed explanation." 
      }
      setMessages(prev => [...prev, aiMsg])
      setLoading(false)
    }, 1500)
  }

  const selectSubject = (s) => {
    setSubject(s)
    setMessages(prev => [...prev, 
      { role: 'user', content: `I want to study ${s.name}` },
      { role: 'assistant', content: `Perfect! Let's learn ${s.name} together. What would you like to explore first?` }
    ])
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
          <div>
            <h1 className="font-bold">CoStudy AI</h1>
            <p className="text-xs text-gray-500">{user?.name || 'Student'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigate('/study-rooms')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Study Rooms
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Subjects */}
        <aside className="w-64 border-r border-[#1e1e2a] p-4 hidden md:block">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">SUBJECTS</h3>
          <div className="space-y-2">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => selectSubject(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${subject?.id === s.id 
                    ? 'bg-fets-yellow/20 text-fets-yellow' 
                    : 'hover:bg-[#12121a] text-gray-300'}`}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] px-5 py-3 rounded-2xl animate-fadeIn
                  ${msg.role === 'user' 
                    ? 'bg-fets-yellow text-black' 
                    : 'bg-[#12121a] border border-[#1e1e2a]'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#12121a] border border-[#1e1e2a] px-5 py-3 rounded-2xl">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-[#1e1e2a]">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-5 py-3 rounded-xl bg-[#12121a] border border-[#2a2a3a] 
                         focus:border-fets-yellow focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-fets-yellow text-black font-semibold rounded-xl 
                         hover:bg-fets-yellow-dark transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}