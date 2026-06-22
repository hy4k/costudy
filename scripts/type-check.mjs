import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const errors = []

function fail(message) {
  errors.push(message)
}

const appPath = 'src/App.jsx'
const app = readFileSync(appPath, 'utf8')
const importPattern = /import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+['"](\.\/[A-Za-z0-9_\/-]+)['"]/g
const routePattern = /<Route\s+path="([^"]+)"\s+element=\{<([A-Z][A-Za-z0-9_]*)/g
const imports = new Map()
let match

while ((match = importPattern.exec(app))) {
  const [, component, importPath] = match
  const resolved = join(dirname(appPath), `${importPath}.jsx`)
  imports.set(component, resolved)
  if (!existsSync(resolved)) fail(`${appPath}: import for ${component} points to missing file ${resolved}`)
}

while ((match = routePattern.exec(app))) {
  const [, route, component] = match
  if (!imports.has(component)) fail(`${appPath}: route ${route} uses ${component} without a matching import`)
}

for (const [component, file] of imports) {
  if (!existsSync(file)) continue
  const text = readFileSync(file, 'utf8')
  const exportPattern = new RegExp(`export\\s+default\\s+function\\s+${component}\\s*\\(`)
  if (!exportPattern.test(text)) fail(`${file}: expected default function export named ${component}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
for (const dep of ['react', 'react-dom', 'react-router-dom']) {
  if (!packageJson.dependencies?.[dep]) fail(`package.json: missing runtime dependency ${dep}`)
}

if (errors.length) {
  console.error('Type-check failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Type-check passed for ${imports.size} routed components.`)
