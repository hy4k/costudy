import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  
  const stats = [
    { label: 'Total Sessions', value: '24', icon: '📚' },
    { label: 'Hours Learned', value: '48', icon: '⏱️' },
    { label: 'Questions Asked', value: '156', icon: '❓' },
    { label: 'Topics Mastered', value: '12', icon: '🎯' }
  ]

  const recentSessions = [
    { subject: 'Mathematics', topic: 'Quadratic Equations', date: 'Today', duration: '45 min' },
    { subject: 'Science', topic: 'Chemical Reactions', date: 'Yesterday', duration: '30 min' },
    { subject: 'English', topic: 'Essay Writing', date: '2 days ago', duration: '60 min' }
  ]

  const upcomingGoals = [
    { goal: 'Complete Calculus Chapter 5', deadline: 'Tomorrow', progress: 75 },
    { goal: 'Practice 50 Math Problems', deadline: '3 days', progress: 40 },
    { goal: 'Review Physics Notes', deadline: '5 days', progress: 20 }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
          <span className="text-xl font-bold gradient-text">CoStudy</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-gray-400">{user?.name || 'Student'}</span>
          <button 
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-fets-yellow text-black font-semibold rounded-lg"
          >
            Start Learning
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Your Learning Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="glass p-6 rounded-xl">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
            <div className="space-y-4">
              {recentSessions.map((session, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-[#12121a] rounded-lg">
                  <div>
                    <div className="font-medium">{session.subject}</div>
                    <div className="text-sm text-gray-500">{session.topic}</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{session.date}</div>
                    <div>{session.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">Your Goals</h2>
            <div className="space-y-4">
              {upcomingGoals.map((goal, i) => (
                <div key={i} className="p-3 bg-[#12121a] rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>{goal.goal}</span>
                    <span className="text-sm text-gray-500">{goal.deadline}</span>
                  </div>
                  <div className="h-2 bg-[#1e1e2a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-fets-yellow transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{goal.progress}% complete</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}