import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EXAMS = [
  { id: 'jee', name: 'JEE Main', subjects: ['Physics', 'Chemistry', 'Math'], icon: '🎯' },
  { id: 'neet', name: 'NEET', subjects: ['Physics', 'Chemistry', 'Biology'], icon: '🏥' },
  { id: 'cbse', name: 'CBSE Board', subjects: ['All Subjects'], icon: '📚' },
  { id: 'state', name: 'State Board', subjects: ['All Subjects'], icon: '🗺️' }
]

const SAMPLE_QUESTIONS = {
  physics: [
    { q: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], answer: 0 },
    { q: 'Speed of light in vacuum is approximately?', options: ['3×10⁶ m/s', '3×10⁷ m/s', '3×10⁸ m/s', '3×10⁹ m/s'], answer: 2 },
    { q: 'Which planet is known as Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 }
  ],
  chemistry: [
    { q: 'Atomic number of Carbon is?', options: ['4', '6', '8', '12'], answer: 1 },
    { q: 'What is H2O commonly known as?', options: ['Hydrogen Peroxide', 'Water', 'Heavy Water', 'Hydroxide'], answer: 1 },
    { q: 'Which gas is absorbed by lime water?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], answer: 2 }
  ],
  math: [
    { q: 'What is 12 × 12?', options: ['124', '144', '154', '164'], answer: 1 },
    { q: 'Value of π (pi) approximately?', options: ['2.14', '3.14', '4.14', '5.14'], answer: 1 },
    { q: 'Square root of 144 is?', options: ['10', '11', '12', '13'], answer: 2 }
  ]
}

export default function Exams({ user }) {
  const navigate = useNavigate()
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const questions = selectedSubject ? SAMPLE_QUESTIONS[selectedSubject.toLowerCase()] || [] : []

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    
    if (index === questions[currentQuestion].answer) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScore(0)
    setShowResult(false)
    setSelectedAnswer(null)
  }

  if (!selectedExam) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2a]">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
            <span className="text-xl font-bold gradient-text">CoStudy</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/chat')} className="px-4 py-2 text-sm text-gray-400 hover:text-white">AI Chat</button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Dashboard</button>
            <button onClick={() => navigate('/study-rooms')} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Study Rooms</button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-8 text-center">Choose Your Exam</h1>
          <div className="grid md:grid-cols-2 gap-6">
            {EXAMS.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className="glass p-8 rounded-xl text-left hover:border-fets-yellow/50 transition"
              >
                <div className="text-4xl mb-4">{exam.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{exam.name}</h3>
                <div className="flex gap-2 flex-wrap">
                  {exam.subjects.map(s => (
                    <span key={s} className="px-3 py-1 bg-[#1e1e2a] rounded-full text-sm text-gray-400">
                      {s}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="glass p-12 rounded-2xl text-center max-w-md">
          <div className="text-6xl mb-4">{percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-gray-400 mb-6">You scored {score} out of {questions.length}</p>
          
          <div className="text-5xl font-bold gradient-text mb-8">{percentage}%</div>
          
          <div className="flex gap-4">
            <button 
              onClick={resetQuiz}
              className="flex-1 py-3 bg-fets-yellow text-black font-semibold rounded-lg"
            >
              Try Again
            </button>
            <button 
              onClick={() => { setSelectedExam(null); setSelectedSubject(null) }}
              className="flex-1 py-3 border border-[#2a2a3a] rounded-lg hover:border-fets-yellow"
            >
              Change Exam
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-2xl">⚡</button>
          <span className="text-xl font-bold gradient-text">CoStudy</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {!selectedSubject ? (
          <div>
            <button 
              onClick={() => setSelectedExam(null)}
              className="text-gray-400 hover:text-white mb-6"
            >
              ← Back to Exams
            </button>
            <h2 className="text-2xl font-bold mb-6">{selectedExam.name} - Select Subject</h2>
            <div className="space-y-4">
              {selectedExam.subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className="w-full glass p-6 rounded-xl text-left hover:border-fets-yellow/50 transition"
                >
                  <span className="text-xl font-semibold">{subject}</span>
                  <span className="float-right text-gray-400">
                    {SAMPLE_QUESTIONS[subject.toLowerCase()]?.length || 0} Questions
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="text-gray-400 hover:text-white"
              >
                ← Back
              </button>
              <div className="text-gray-400">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>

            <div className="h-2 bg-[#1e1e2a] rounded-full mb-8">
              <div 
                className="h-full bg-fets-yellow transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="glass p-8 rounded-xl mb-6">
              <h3 className="text-xl font-semibold mb-6">
                {questions[currentQuestion]?.q}
              </h3>
              <div className="space-y-3">
                {questions[currentQuestion]?.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-lg text-left transition
                      ${selectedAnswer === i 
                        ? i === questions[currentQuestion].answer 
                          ? 'bg-green-500/20 border-green-500' 
                          : 'bg-red-500/20 border-red-500'
                        : selectedAnswer !== null
                          ? 'opacity-50'
                          : 'bg-[#12121a] hover:bg-[#1a1a24]'
                      }
                      ${selectedAnswer === null ? 'border border-[#2a2a3a]' : 'border'}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-gray-400">
              Score: {score} / {currentQuestion + (selectedAnswer !== null ? 1 : 0)}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
