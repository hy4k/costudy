import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ROOMS = [
  { id: 1, name: 'JEE Advanced Prep', subject: 'Physics', members: 12, maxMembers: 20, active: true },
  { id: 2, name: 'NEET Biology', subject: 'Biology', members: 8, maxMembers: 15, active: true },
  { id: 3, name: 'Mathematics - Calculus', subject: 'Math', members: 5, maxMembers: 10, active: true },
  { id: 4, name: 'English Literature', subject: 'English', members: 3, maxMembers: 12, active: false },
  { id: 5, name: 'General Knowledge', subject: 'GK', members: 15, maxMembers: 25, active: true }
]

export default function StudyRooms({ user }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const filteredRooms = filter === 'all' 
    ? ROOMS 
    : filter === 'active' 
      ? ROOMS.filter(r => r.active)
      : ROOMS.filter(r => !r.active)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
          <span className="text-xl font-bold gradient-text">CoStudy</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/chat')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            AI Chat
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Study Rooms</h1>
          <button className="px-6 py-3 bg-fets-yellow text-black font-semibold rounded-lg hover:bg-fets-yellow-dark transition">
            Create Room
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {['all', 'active', 'full'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition
                ${filter === f 
                  ? 'bg-fets-yellow/20 text-fets-yellow' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <div key={room.id} className="glass p-6 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{room.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  room.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {room.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex gap-4 text-sm text-gray-400 mb-4">
                <span>📚 {room.subject}</span>
                <span>👥 {room.members}/{room.maxMembers}</span>
              </div>

              {/* Member avatars */}
              <div className="flex -space-x-2 mb-4">
                {[...Array(Math.min(room.members, 5))].map((_, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-fets-yellow to-orange-400 border-2 border-[#0a0a0f]"
                  />
                ))}
                {room.members > 5 && (
                  <div className="w-8 h-8 rounded-full bg-[#1e1e2a] border-2 border-[#0a0a0f] flex items-center justify-center text-xs">
                    +{room.members - 5}
                  </div>
                )}
              </div>

              <button 
                disabled={!room.active || room.members >= room.maxMembers}
                className="w-full py-2 rounded-lg font-medium transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-fets-yellow/20 text-fets-yellow hover:bg-fets-yellow/30"
              >
                {room.members >= room.maxMembers ? 'Room Full' : 'Join Room'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}