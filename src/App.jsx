import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import StudyRooms from './pages/StudyRooms'

function App() {
  const [user, setUser] = useState(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing onLogin={setUser} />} />
        <Route path="/chat" element={<Chat user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/study-rooms" element={<StudyRooms user={user} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
