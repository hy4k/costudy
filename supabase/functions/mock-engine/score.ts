/* CBQ scoring — ported verbatim from cbqkit/score.js (portable, no deps).
   Every type awards partial credit; nothing returns below zero (ICMA: no penalty). */

export type TaskType = 'num' | 'list' | 'multi' | 'dnd' | 'mcq';
export interface CbqTask {
  id: string; case_id: string; seq: number; type: TaskType; marks: number;
  prompt: string; hint?: string | null; payload: any; answer: any; explanation?: string | null;
}

export function scoreTask(task: CbqTask, given: any): { got: number; note: string } {
  const key = task.answer || {};
  const marks = task.marks;
  const none = { got: 0, note: 'No answer recorded.' };

  switch (task.type) {
    case 'num': {
      if (!given || given.v === '' || given.v == null) return none;
      const v = Number(String(given.v).replace(/,/g, '').trim());
      if (!isFinite(v)) return { got: 0, note: 'Entry was not a number.' };
      const decimals = task.payload?.decimals;
      const tol = key.tolerance != null ? key.tolerance : (decimals ? 0.005 : 0.5);
      const amountRight = Math.abs(v - key.value) <= tol;
      if (!key.direction) {
        return amountRight ? { got: marks, note: 'Correct.' }
          : { got: 0, note: `Entered ${given.v}; the correct amount is ${key.value}.` };
      }
      const dirRight = given.dir === key.direction;
      if (amountRight && dirRight) return { got: marks, note: 'Correct amount and direction.' };
      if (amountRight) return { got: Math.round(marks * 0.6),
        note: `Amount correct, direction wrong — it is ${key.direction === 'U' ? 'unfavourable' : 'favourable'}.` };
      return { got: 0, note: `Entered ${given.v}${given.dir ? ' ' + given.dir : ''}; correct is ${key.value} ${key.direction}.` };
    }
    case 'list': {
      const want: string[] = key.values || [];
      const per = marks / (want.length || 1);
      let got = 0, right = 0;
      want.forEach((w, i) => { if (given && given[i] === w) { got += per; right++; } });
      return { got: Math.round(got), note: `${right} of ${want.length} fields correct.` };
    }
    case 'mcq': {
      if (given == null || given === '') return none;
      return given === key.value ? { got: marks, note: 'Correct.' }
        : { got: 0, note: `Selected ${given}; the correct option is ${key.value}.` };
    }
    case 'multi': {
      const correct = new Set<number>(key.values || []);
      const chosen = new Set<number>(Array.isArray(given) ? given : []);
      if (!chosen.size) return none;
      const per = marks / (correct.size || 1);
      let got = 0, hit = 0, miss = 0;
      correct.forEach(i => { if (chosen.has(i)) { got += per; hit++; } });
      chosen.forEach(i => { if (!correct.has(i)) { got -= per; miss++; } });
      return { got: Math.max(0, Math.round(got)),
        note: `${hit} of ${correct.size} correct selected` + (miss ? `, ${miss} incorrect selected.` : '.') };
    }
    case 'dnd': {
      const want: Record<string, string> = key.placement || {};
      const ids = Object.keys(want);
      const per = marks / (ids.length || 1);
      let got = 0, right = 0;
      ids.forEach(id => { if (given && given[id] === want[id]) { got += per; right++; } });
      return { got: Math.round(got), note: `${right} of ${ids.length} items correctly placed.` };
    }
    default:
      return { got: 0, note: `Unrecognised task type "${(task as any).type}".` };
  }
}

export function scoreCase(tasks: CbqTask[], responses: Record<string, any>) {
  let marks = 0, available = 0;
  const detail = tasks.map(t => {
    const r = scoreTask(t, (responses || {})[t.id]);
    marks += r.got; available += t.marks;
    return { task_id: t.id, seq: t.seq, type: t.type, prompt: t.prompt, marks: t.marks,
             got: r.got, note: r.note, explanation: t.explanation, answer: t.answer, response: (responses || {})[t.id] ?? null };
  });
  return { marks, available, pct: available ? marks / available * 100 : 0, detail };
}

/* ICMA convention: MCQ 75%, section 2 25%, out of 500, 360 to pass (= 72%). */
export function scaledScore(mcqPct: number, section2Pct: number) {
  return Math.max(0, Math.min(500, Math.round((0.75 * mcqPct + 0.25 * section2Pct) * 5)));
}

export const GATE_PCT = 50;
