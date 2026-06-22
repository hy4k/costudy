import { readFileSync } from 'node:fs'

const assertions = []
const failures = []

function assert(name, condition) {
  assertions.push(name)
  if (!condition) failures.push(name)
}

const app = readFileSync('src/App.jsx', 'utf8')
const landing = readFileSync('src/pages/Landing.jsx', 'utf8')
const chat = readFileSync('src/pages/Chat.jsx', 'utf8')
const dashboard = readFileSync('src/pages/Dashboard.jsx', 'utf8')
const rooms = readFileSync('src/pages/StudyRooms.jsx', 'utf8')
const exams = readFileSync('src/pages/Exams.jsx', 'utf8')
const readme = readFileSync('README.md', 'utf8')

for (const route of ['/', '/chat', '/dashboard', '/study-rooms', '/exams']) {
  assert(`route ${route} is registered`, app.includes(`path="${route}"`))
}

assert('landing has primary CTA', landing.includes('Start Learning'))
assert('chat includes subject selector', chat.includes('SUBJECTS'))
assert('dashboard exposes learning stats', dashboard.includes('Your Learning Dashboard'))
assert('study rooms include create action', rooms.includes('Create Room'))
assert('exams include quiz result flow', exams.includes('Quiz Complete!'))
assert('README documents CMA US launch focus', readme.includes('CMA US only'))
assert('README links Stage 01 orchestration', readme.includes('docs/orchestration/stage-01.md'))

if (failures.length) {
  console.error('Tests failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Tests passed: ${assertions.length} assertions.`)
