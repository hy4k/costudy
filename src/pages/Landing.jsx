import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulate login - replace with Supabase auth
    setTimeout(() => {
      onLogin({ email, name: email.split('@')[0] })
      navigate('/chat')
    }, 1000)
  }

  const features = [
    {
      icon: '🤖',
      title: 'AI Tutor',
      desc: 'Get instant answers to your doubts from our intelligent AI assistant'
    },
    {
      icon: '👥',
      title: 'Study Together',
      desc: 'Join virtual study rooms and learn with peers'
    },
    {
      icon: '📊',
      title: 'Track Progress',
      desc: 'Monitor your learning journey with detailed analytics'
    },
    {
      icon: '📝',
      title: 'Mock Tests',
      desc: 'Practice with AI-generated questions and ace your exams'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#1e1e2a]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold gradient-text">CoStudy</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#about" className="hover:text-white transition">About</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Learn Smarter with <span className="gradient-text">AI</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Your personal AI tutor combined with collaborative learning. 
            Ace your exams with personalized guidance.
          </p>
          
          {/* CTA Form */}
          <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-3 rounded-lg bg-[#12121a] border border-[#2a2a3a] 
                       focus:border-fets-yellow focus:outline-none transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-fets-yellow text-black font-semibold rounded-lg 
                       hover:bg-fets-yellow-dark transition disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Learning'}
            </button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-[#0f0f15]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why <span className="gradient-text">CoStudy</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="glass p-8 rounded-xl hover:border-fets-yellow/30 transition animate-fadeIn"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold gradient-text">10K+</div>
            <div className="text-gray-400 mt-1">Students</div>
          </div>
          <div>
            <div className="text-4xl font-bold gradient-text">50+</div>
            <div className="text-gray-400 mt-1">Subjects</div>
          </div>
          <div>
            <div className="text-4xl font-bold gradient-text">24/7</div>
            <div className="text-gray-400 mt-1">AI Support</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1e1e2a] text-center text-gray-500 text-sm">
        <p>© 2026 CoStudy. Built for students, by students.</p>
      </footer>
    </div>
  )
}
