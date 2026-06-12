const EXAM_ID = '7e48129a-35ae-41a2-9cb8-8bb3f7227578';

const sections = [
  { id: 'cma_p1_b', topic: 'Planning, Budgeting and Forecasting', startPos: 31 },
  { id: 'cma_p1_c', topic: 'Performance Management', startPos: 66 },
  { id: 'cma_p1_d', topic: 'Cost Management', startPos: 102 },
  { id: 'cma_p1_e', topic: 'Internal Controls', startPos: 124 },
];

function parseAnswerKey(raw) {
  const answers = {};
  const lines = raw.trim().split('\n').filter(l => l.trim());
  let qNum = 0;
  for (const line of lines) {
    const cleaned = line.replace(/^\(/, '').replace(/\)$/, '').trim();
    // Match patterns like: "D. 87,000" or "(B) $3,880,000" or "B" or "1. D. answer text"
    let m = cleaned.match(/^(\d+)[\.\)]\s*([A-D])[\.\)]/i);
    if (m) {
      answers[parseInt(m[1])] = m[2].toUpperCase();
      continue;
    }
    m = cleaned.match(/^\(?([A-D])\)?[\.\)]/i);
    if (m) {
      qNum++;
      answers[qNum] = m[1].toUpperCase();
      continue;
    }
    m = cleaned.match(/^\(?([A-D])\)?$/i);
    if (m) {
      qNum++;
      answers[qNum] = m[1].toUpperCase();
      continue;
    }
    // multi-line explanation — skip
  }
  return answers;
}

function parseQuestions(raw) {
  const questions = [];
  // Split by question number pattern
  const parts = raw.split(/(?=^\d+[\.\)\\]+\s*\.?\s)/m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const text = part.replace(/\\+\.\s*/g, '. ').trim();

    // Extract question number
    const numMatch = text.match(/^(\d+)[\.\)]/);
    if (!numMatch) continue;
    const qNum = parseInt(numMatch[1]);

    // Find choices - look for A/B/C/D patterns
    const choicePatterns = [
      /\n\s*A[\.\)]\s*/,
      /\n\s*A\.\s/,
    ];

    let stemEnd = -1;
    for (const p of choicePatterns) {
      const idx = text.search(p);
      if (idx > 0) { stemEnd = idx; break; }
    }

    if (stemEnd === -1) {
      // Try inline choices
      const inlineIdx = text.search(/\bA[\.\)]\s/);
      if (inlineIdx > 50) stemEnd = inlineIdx;
    }

    if (stemEnd === -1) continue;

    // Extract stem (remove question number prefix)
    let stem = text.substring(0, stemEnd).replace(/^\d+[\.\)\\]+\s*\.?\s*/, '').trim();

    // Extract choices
    const choicesText = text.substring(stemEnd);
    const choices = [];

    for (const key of ['A', 'B', 'C', 'D']) {
      const nextKey = key === 'A' ? 'B' : key === 'B' ? 'C' : key === 'C' ? 'D' : null;
      let regex;
      if (nextKey) {
        regex = new RegExp(`${key}[\\.\\)]\\s*(.+?)(?=\\n\\s*${nextKey}[\\.\\)]|$)`, 's');
      } else {
        regex = new RegExp(`${key}[\\.\\)]\\s*(.+?)$`, 's');
      }
      const match = choicesText.match(regex);
      if (match) {
        choices.push({ key, text: match[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ') });
      }
    }

    if (choices.length >= 2) {
      questions.push({ qNum, stem: stem.replace(/\n/g, ' ').replace(/\s+/g, ' '), choices });
    }
  }

  return questions;
}

function escSql(s) {
  return s.replace(/'/g, "''");
}

function generateSQL(questions, answers, section, startPos) {
  const values = [];
  questions.forEach((q, i) => {
    const correctKey = answers[q.qNum] || answers[i + 1];
    if (!correctKey) {
      console.error(`WARNING: No answer for Q${q.qNum} in section ${section.id}`);
      return;
    }
    const choicesJson = JSON.stringify(q.choices.map(c => ({ key: c.key, text: c.text })));
    values.push(`(
    '${EXAM_ID}',
    '${section.id}',
    '${escSql(section.topic)}',
    '${escSql(q.stem)}',
    '${escSql(choicesJson)}'::jsonb,
    '${correctKey}',
    '',
    'medium',
    ${startPos + i},
    '{"source": "elance", "section": "${section.id.split('_').pop().toUpperCase()}", "original_number": ${q.qNum}}'::jsonb
  )`);
  });
  return values;
}

// Read section files
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'sections');

let allValues = [];

for (const section of sections) {
  const letter = section.id.split('_').pop().toUpperCase();
  const qFile = path.join(dir, `questions_${letter}.txt`);
  const aFile = path.join(dir, `answers_${letter}.txt`);

  if (!fs.existsSync(qFile)) {
    console.error(`Missing: ${qFile}`);
    continue;
  }

  const qRaw = fs.readFileSync(qFile, 'utf-8');
  const aRaw = fs.readFileSync(aFile, 'utf-8');

  const questions = parseQuestions(qRaw);
  const answers = parseAnswerKey(aRaw);

  console.error(`Section ${letter}: ${questions.length} questions parsed, ${Object.keys(answers).length} answers parsed`);

  const values = generateSQL(questions, answers, section, section.startPos);
  allValues = allValues.concat(values);
}

if (allValues.length > 0) {
  console.log(`INSERT INTO public.mcq_questions (exam_id, section_id, topic, stem, choices, correct_key, explanation, difficulty, position, metadata)\nVALUES\n${allValues.join(',\n')};`);
}

console.error(`\nTotal: ${allValues.length} questions ready for insert`);
