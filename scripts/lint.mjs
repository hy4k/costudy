import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const sourceDirs = ['src']
const files = []
const errors = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path)
    else if (/\.(jsx|js|css)$/.test(entry)) files.push(path)
  }
}

for (const dir of sourceDirs) walk(join(root, dir))

function report(file, line, message) {
  const rel = relative(root, file)
  errors.push(`${rel}:${line}: ${message}`)
}

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    const lineNo = index + 1
    if (/[\t]/.test(line)) report(file, lineNo, 'tabs are not allowed')
    if (/\s+$/.test(line)) report(file, lineNo, 'trailing whitespace is not allowed')
    if (/\bconsole\./.test(line)) report(file, lineNo, 'console statements are not allowed')
    if (/\bdebugger\b/.test(line)) report(file, lineNo, 'debugger statements are not allowed')
  })

  const reactImport = text.match(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/)
  if (reactImport) {
    for (const imported of reactImport[1].split(',').map(item => item.trim().split(/\s+as\s+/)[0])) {
      const usage = new RegExp(`\\b${imported}\\b`, 'g')
      const matches = text.match(usage) || []
      if (matches.length <= 1) report(file, 1, `unused React import: ${imported}`)
    }
  }
}

if (errors.length) {
  console.error('Lint failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Lint passed for ${files.length} source files.`)
