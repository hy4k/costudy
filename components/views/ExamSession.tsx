import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Icons } from '../Icons';
import Markdown from 'react-markdown';
import { triggerGoalAchievementConfetti, triggerStarConfetti } from '../../utils/confetti';
import { getMcqStudyTips } from '../../services/geminiService';
import {
  MockEngineError,
  resumeAttempt,
  saveMcqAnswer,
  finishMcqSection,
  saveCbqResponse,
  submitExam,
  abandonAttempt,
  type ResumeResult,
  type MockAttempt,
  type MockExam,
  type MockQuestion,
  type CbqCase,
  type CbqTask,
  type ExamResult,
} from '../../services/mockEngineService';

// ============================================================================
// Types
// ============================================================================

interface ExamSessionProps {
  initial: ResumeResult;
  onExit: () => void;
}

type Phase = 'CONFIRM' | 'TERMS' | 'INTRODUCTION' | 'MCQ' | 'TRANSITION' | 'CBQ' | 'SUBMITTING' | 'RESULTS' | 'ERROR';

interface McqAnswerState {
  selected: string | null;
  flagged: boolean;
}

// ============================================================================
// Small utilities
// ============================================================================

const formatTime = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/** Normalizes the jsonb `options` column into a stable [{key, text}] list, defensively. */
const normalizeOptions = (options: any): { key: string; text: string }[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((o, i) => {
      if (o && typeof o === 'object') {
        const key = o.key ?? o.letter ?? String.fromCharCode(65 + i);
        const text = o.text ?? o.label ?? o.value ?? String(o);
        return { key: String(key), text: String(text) };
      }
      return { key: String.fromCharCode(65 + i), text: String(o) };
    });
  }
  if (typeof options === 'object') {
    return Object.entries(options).map(([key, text]) => ({ key, text: String(text) }));
  }
  return [];
};

function useDebouncedSaver<Arg>(fn: (arg: Arg) => Promise<any>, delay = 400) {
  const timers = useRef<Map<string, any>>(new Map());
  return useCallback((id: string, arg: Arg) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      fn(arg).catch(err => console.warn('[ExamSession] save failed', err));
      timers.current.delete(id);
    }, delay);
    timers.current.set(id, t);
  }, [fn, delay]);
}

// ============================================================================
// Orientation tutorial content — accurate to the 2026 CBQ format
// ============================================================================

const INTRO_SLIDES: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Welcome & Exam Structure',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          This CMA mock exam has two sections, taken back to back in a single sitting.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-3">
          <p className="text-sm font-bold">• Section 1 — Multiple Choice: 100 MCQs, 3 hours.</p>
          <p className="text-sm font-bold">• Section 2 — Case-Based Questions (CBQ): 2 case sets, 1 hour combined.</p>
        </div>
        <p className="text-sm italic text-slate-600 dark:text-slate-400">
          This orientation is short and accurate to the current 2026 CMA exam format — no essays, no scratch booklets, just what you'll actually see today.
        </p>
      </>
    ),
  },
  {
    title: 'The 50% Gate',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          You must score at least <strong>50% correct</strong> on Section 1 (MCQs) to unlock Section 2.
        </p>
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-sm font-medium">
          If you don't clear the gate, the exam ends immediately after Section 1 and your case studies are not attempted — this matches the real exam rule.
        </div>
      </>
    ),
  },
  {
    title: 'Section 1: Multiple Choice',
    body: (
      <>
        <p className="text-sm leading-relaxed">Each question presents several option cards. Click an option to select it.</p>
        <ul className="list-disc pl-6 space-y-3 text-sm">
          <li>Use the numbered sidebar to jump to any question instantly.</li>
          <li>Click <strong>Flag</strong> to mark a question for later review — flagging never blocks submission.</li>
          <li>You may change your answer as many times as you like before finishing the section.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Section 2: Case-Based Questions',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Each case presents a short business scenario, supporting exhibits (data tables), and around 7 linked tasks worth up to 100 marks total.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-2 text-sm">
          <p className="font-bold">Five task types you'll see:</p>
          <p>1. Numeric entry — type in a number (and sometimes Favourable/Unfavourable).</p>
          <p>2. Dropdown list — choose from a list for each field.</p>
          <p>3. Multi-select — check every option that applies.</p>
          <p>4. Multiple choice — pick one option.</p>
          <p>5. Drag & drop — classify items into zones (tap-to-place works too).</p>
        </div>
      </>
    ),
  },
  {
    title: 'Partial Credit, No Penalty',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Every CBQ task type awards <strong>partial credit</strong> where it makes sense — a partially correct dropdown or drag-and-drop still earns marks.
        </p>
        <p className="text-sm leading-relaxed">There is <strong>no penalty</strong> for a wrong answer anywhere in this exam, so always leave your best guess rather than nothing.</p>
      </>
    ),
  },
  {
    title: 'Time Management',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          The countdown clock in the header is authoritative — it is driven by the server, not your device.
        </p>
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-900 dark:text-red-200 text-sm font-medium">
          When time runs out for a section, it is submitted automatically with whatever you've answered so far — so don't leave anything to the last second.
        </div>
      </>
    ),
  },
  {
    title: 'Submitting Section 1 & Moving On',
    body: (
      <>
        <p className="text-sm leading-relaxed">
          When you're ready, click <strong>Finish Section 1</strong>. It will be graded immediately and, if you clear the 50% gate, Section 2 opens right away.
        </p>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          Once you submit Section 1, you CANNOT return to change any MCQ answers.
        </p>
      </>
    ),
  },
  {
    title: 'Scoring & Passing',
    body: (
      <>
        <p className="text-sm leading-relaxed">Your final scaled score runs 0–500, with 360 required to pass.</p>
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-2 text-sm">
          <p>• Section 1 (MCQs) is 75% of your scaled score.</p>
          <p>• Section 2 (CBQs) is 25% of your scaled score.</p>
          <p>• A full review with explanations is available after you finish.</p>
        </div>
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm font-bold">
          Click "Start the Test" below when you're ready. Good luck!
        </div>
      </>
    ),
  },
];

// ============================================================================
// CBQ Task Renderers
// ============================================================================

const NumTask: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  const v = value?.v ?? '';
  const dir = value?.dir ?? '';
  const needsDir = !!task.payload?.direction;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={v}
          onChange={e => onChange({ v: e.target.value, ...(needsDir ? { dir } : {}) })}
          placeholder="Enter amount"
          className="w-48 px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base focus:border-brand outline-none"
        />
        {needsDir && (
          <div className="flex gap-2">
            {(['F', 'U'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ v, dir: d })}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider border-2 transition-colors ${
                  dir === d
                    ? 'bg-brand border-brand text-white'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {d === 'F' ? 'Favourable' : 'Unfavourable'}
              </button>
            ))}
          </div>
        )}
      </div>
      {task.payload?.decimals != null && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Formatting hint: {task.payload.decimals ? 'include decimals' : 'whole units, no commas'}</p>
      )}
    </div>
  );
};

const ListTask: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  const fields: { label: string; options: string[] }[] = task.payload?.fields || [];
  const current = value || {};
  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <div key={i}>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
          <select
            value={current[i] ?? ''}
            onChange={e => onChange({ ...current, [i]: e.target.value })}
            className="w-full max-w-md px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-brand outline-none"
          >
            <option value="" disabled>Select…</option>
            {f.options.map((o, oi) => (
              <option key={oi} value={o}>{o}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

const MultiTask: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  const options: string[] = task.payload?.options || [];
  const selected: number[] = Array.isArray(value) ? value : [];
  const toggle = (idx: number) => {
    if (selected.includes(idx)) onChange(selected.filter(i => i !== idx));
    else onChange([...selected, idx].sort((a, b) => a - b));
  };
  return (
    <div className="space-y-3">
      {task.payload?.selectCount && (
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Select {task.payload.selectCount}</p>
      )}
      {options.map((o, i) => {
        const isSel = selected.includes(i);
        return (
          <div
            key={i}
            onClick={() => toggle(i)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${isSel ? 'bg-brand border-brand' : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
              {isSel && <Icons.Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`flex-1 p-3 rounded-lg border-2 text-sm transition-colors ${isSel ? 'border-slate-900 dark:border-brand bg-slate-50 dark:bg-brand/10 font-bold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
              {o}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const McqTask: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  const options: string[] = task.payload?.options || [];
  return (
    <div className="space-y-3">
      {options.map((o, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSel = value === letter;
        return (
          <div key={i} onClick={() => onChange(letter)} className="flex items-center gap-3 cursor-pointer">
            <div className={`font-black text-sm w-5 shrink-0 ${isSel ? 'text-brand' : 'text-slate-500 dark:text-slate-400'}`}>{letter}</div>
            <div className={`flex-1 p-3 rounded-lg border-2 text-sm transition-colors ${isSel ? 'border-slate-900 dark:border-brand bg-slate-50 dark:bg-brand/10 font-bold text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
              {o}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DndTask: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  const items: { id: string; text: string }[] = task.payload?.items || [];
  const zones: Record<string, string> = task.payload?.zones || {};
  const placement: Record<string, string> = value || {};
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const placeItem = (itemId: string, zoneKey: string) => {
    onChange({ ...placement, [itemId]: zoneKey });
    setSelectedItem(null);
  };
  const unplaceItem = (itemId: string) => {
    const next = { ...placement };
    delete next[itemId];
    onChange(next);
  };

  const unplacedItems = items.filter(it => !placement[it.id]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 italic">Tap an item, then tap a zone to place it (or drag & drop on desktop). Tap a placed item to pick it back up.</p>

      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {unplacedItems.length === 0 && <span className="text-xs text-slate-400 italic">All items placed</span>}
        {unplacedItems.map(it => (
          <div
            key={it.id}
            draggable
            onDragStart={e => e.dataTransfer.setData('text/plain', it.id)}
            onClick={() => setSelectedItem(prev => (prev === it.id ? null : it.id))}
            className={`px-3 py-2 rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing border-2 transition-all ${
              selectedItem === it.id ? 'bg-brand border-brand text-white scale-105 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100'
            }`}
          >
            {it.text}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(zones).map(([zoneKey, zoneLabel]) => {
          const placedIds = Object.entries(placement).filter(([, z]) => z === zoneKey).map(([id]) => id);
          return (
            <div
              key={zoneKey}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('text/plain');
                if (itemId) placeItem(itemId, zoneKey);
              }}
              onClick={() => { if (selectedItem) placeItem(selectedItem, zoneKey); }}
              className={`min-h-[5rem] p-3 rounded-xl border-2 transition-colors ${selectedItem ? 'border-brand bg-brand/5 cursor-pointer' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{zoneLabel}</div>
              <div className="flex flex-wrap gap-2">
                {placedIds.map(id => {
                  const item = items.find(i => i.id === id);
                  if (!item) return null;
                  return (
                    <div
                      key={id}
                      onClick={e => { e.stopPropagation(); unplaceItem(id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-brand text-white cursor-pointer"
                      title="Tap to pick back up"
                    >
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CbqTaskRenderer: React.FC<{ task: CbqTask; value: any; onChange: (v: any) => void }> = ({ task, value, onChange }) => {
  switch (task.type) {
    case 'num': return <NumTask task={task} value={value} onChange={onChange} />;
    case 'list': return <ListTask task={task} value={value} onChange={onChange} />;
    case 'multi': return <MultiTask task={task} value={value} onChange={onChange} />;
    case 'mcq': return <McqTask task={task} value={value} onChange={onChange} />;
    case 'dnd': return <DndTask task={task} value={value} onChange={onChange} />;
    default: return <p className="text-sm text-red-500">Unsupported task type: {(task as any).type}</p>;
  }
};

// ============================================================================
// Main component
// ============================================================================

export const ExamSession: React.FC<ExamSessionProps> = ({ initial, onExit }) => {
  const [attempt, setAttempt] = useState<MockAttempt>(initial.attempt);
  const [exam] = useState<MockExam>(initial.exam);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>(() => {
    if (initial.result) return 'RESULTS';
    if (initial.attempt.section === 'cbq') return 'CBQ';
    return 'CONFIRM';
  });

  // MCQ state
  const [mcqQuestions, setMcqQuestions] = useState<MockQuestion[]>(initial.questions || []);
  const [mcqAnswers, setMcqAnswers] = useState<Map<string, McqAnswerState>>(() => {
    const m = new Map<string, McqAnswerState>();
    (initial.questions || []).forEach(q => m.set(q.id, { selected: null, flagged: false }));
    (initial.responses as any[] || []).forEach((r: any) => {
      if ('question_id' in r) m.set(r.question_id, { selected: r.selected_key ?? null, flagged: !!r.flagged });
    });
    return m;
  });
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [mcqEndsAt, setMcqEndsAt] = useState<string | null>(initial.attempt.section1_ends_at);

  // CBQ state
  const [cbqCases, setCbqCases] = useState<CbqCase[]>(initial.cases || []);
  const [cbqAnswers, setCbqAnswers] = useState<Map<string, any>>(() => {
    const m = new Map<string, any>();
    (initial.responses as any[] || []).forEach((r: any) => {
      if ('task_id' in r) m.set(r.task_id, r.response);
    });
    return m;
  });
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [cbqEndsAt, setCbqEndsAt] = useState<string | null>(initial.attempt.section2_ends_at);

  // Result
  const [result, setResult] = useState<ExamResult | null>(initial.result || null);
  const [aiTips, setAiTips] = useState<string | null>(null);
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  // UI chrome
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [introPage, setIntroPage] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const finishInFlight = useRef(false);

  // Server-driven clock offset: serverNow - localNow, used so device clock drift
  // never matters — only the server's ends_at timestamps do.
  const clockOffsetMs = useRef(0);
  useEffect(() => {
    if (initial.server_now) {
      clockOffsetMs.current = new Date(initial.server_now).getTime() - Date.now();
    }
  }, [initial.server_now]);
  const serverNow = () => Date.now() + clockOffsetMs.current;

  // ---- Debounced saves ----
  const debouncedSaveMcq = useDebouncedSaver<{ questionId: string; selected_key?: string; flagged?: boolean }>(
    ({ questionId, selected_key, flagged }) => saveMcqAnswer(attempt.id, questionId, { selected_key, flagged }),
    350
  );
  const debouncedSaveCbq = useDebouncedSaver<{ taskId: string; response: any }>(
    ({ taskId, response }) => saveCbqResponse(attempt.id, taskId, response),
    400
  );

  // ---- MCQ timer ----
  const [mcqRemaining, setMcqRemaining] = useState(() => mcqEndsAt ? Math.round((new Date(mcqEndsAt).getTime() - serverNow()) / 1000) : 0);
  useEffect(() => {
    if (phase !== 'MCQ' || !mcqEndsAt) return;
    const tick = () => {
      const rem = Math.round((new Date(mcqEndsAt).getTime() - serverNow()) / 1000);
      setMcqRemaining(rem);
      if (rem <= 0) handleFinishMcq(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mcqEndsAt]);

  // ---- CBQ timer ----
  const [cbqRemaining, setCbqRemaining] = useState(() => cbqEndsAt ? Math.round((new Date(cbqEndsAt).getTime() - serverNow()) / 1000) : 0);
  useEffect(() => {
    if (phase !== 'CBQ' || !cbqEndsAt) return;
    const tick = () => {
      const rem = Math.round((new Date(cbqEndsAt).getTime() - serverNow()) / 1000);
      setCbqRemaining(rem);
      if (rem <= 0) handleSubmit(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cbqEndsAt]);

  // ---- MCQ handlers ----
  const currentMcq = mcqQuestions[currentMcqIndex];
  const currentMcqAnswer = currentMcq ? mcqAnswers.get(currentMcq.id) : undefined;

  const handleSelectMcqOption = (key: string) => {
    if (!currentMcq) return;
    setMcqAnswers(prev => {
      const next = new Map(prev);
      const existing = next.get(currentMcq.id) || { selected: null, flagged: false };
      next.set(currentMcq.id, { ...existing, selected: key });
      return next;
    });
    debouncedSaveMcq(currentMcq.id, { questionId: currentMcq.id, selected_key: key });
  };

  const handleFlagMcq = () => {
    if (!currentMcq) return;
    setMcqAnswers(prev => {
      const next = new Map(prev);
      const existing = next.get(currentMcq.id) || { selected: null, flagged: false };
      const flagged = !existing.flagged;
      next.set(currentMcq.id, { ...existing, flagged });
      debouncedSaveMcq(currentMcq.id + ':flag', { questionId: currentMcq.id, flagged });
      return next;
    });
  };

  const handleFinishMcq = async (auto = false) => {
    if (finishInFlight.current) return;
    finishInFlight.current = true;
    setPhase('SUBMITTING');
    try {
      const res = await finishMcqSection(attempt.id);
      if (res.gate_passed === true) {
        setCbqCases(res.cases);
        setCbqEndsAt(res.section2_ends_at);
        setAttempt(prev => ({ ...prev, section: 'cbq', mcq_score: res.mcq_pct, mcq_correct: res.mcq_correct, mcq_total: res.mcq_total, section2_ends_at: res.section2_ends_at }));
        setCurrentCaseIndex(0);
        setCurrentTaskIndex(0);
        setPhase('TRANSITION');
      } else {
        setResult(res.result);
        setAttempt(prev => ({ ...prev, section: 'completed' }));
        setPhase('RESULTS');
        if (res.result.passed) triggerGoalAchievementConfetti(); else triggerStarConfetti();
      }
    } catch (e: any) {
      if (e instanceof MockEngineError && e.expired) {
        // Server says time's already up — just re-resume to get authoritative state.
        try {
          const fresh = await resumeAttempt(attempt.id);
          if (fresh.result) { setResult(fresh.result); setPhase('RESULTS'); }
          else if (fresh.attempt.section === 'cbq') {
            setCbqCases(fresh.cases || []); setCbqEndsAt(fresh.attempt.section2_ends_at); setAttempt(fresh.attempt); setPhase('CBQ');
          }
        } catch (e2: any) {
          setErrorMsg(e2?.message || 'Could not load exam state.');
          setPhase('ERROR');
        }
      } else {
        setErrorMsg(e?.message || 'Could not finish Section 1. Please try again.');
        setPhase(auto ? 'MCQ' : 'MCQ');
      }
    } finally {
      finishInFlight.current = false;
    }
  };

  // ---- CBQ handlers ----
  const currentCase = cbqCases[currentCaseIndex];
  const flatTasks: CbqTask[] = useMemo(() => (currentCase ? currentCase.tasks : []), [currentCase]);
  const currentTask = flatTasks[currentTaskIndex];

  const handleCbqChange = (taskId: string, value: any) => {
    setCbqAnswers(prev => {
      const next = new Map(prev);
      next.set(taskId, value);
      return next;
    });
    debouncedSaveCbq(taskId, { taskId, response: value });
  };

  const handleSubmit = async (auto = false) => {
    if (finishInFlight.current) return;
    finishInFlight.current = true;
    setPhase('SUBMITTING');
    try {
      const res = await submitExam(attempt.id);
      setResult(res.result);
      setAttempt(prev => ({ ...prev, section: 'completed' }));
      setPhase('RESULTS');
      if (res.result.passed) triggerGoalAchievementConfetti(); else triggerStarConfetti();
    } catch (e: any) {
      if (e instanceof MockEngineError && e.expired) {
        try {
          const fresh = await resumeAttempt(attempt.id);
          if (fresh.result) { setResult(fresh.result); setPhase('RESULTS'); }
          else { setErrorMsg('Section 2 time expired but result is not ready yet. Please refresh.'); setPhase('ERROR'); }
        } catch (e2: any) {
          setErrorMsg(e2?.message || 'Could not load exam result.');
          setPhase('ERROR');
        }
      } else {
        setErrorMsg(e?.message || 'Could not submit the exam. Please try again.');
        setPhase('CBQ');
      }
    } finally {
      finishInFlight.current = false;
    }
  };

  const handleExit = async () => {
    if (phase !== 'RESULTS' && phase !== 'ERROR') {
      try { await abandonAttempt(attempt.id); } catch { /* best-effort */ }
    }
    onExit();
  };

  const handleLoadTips = async () => {
    if (!result) return;
    setIsLoadingTips(true);
    try {
      const wrong = result.mcq_review.filter(r => !r.correct || r.selected !== r.correct);
      const tips = await getMcqStudyTips(wrong as any);
      setAiTips(tips);
    } catch (e) {
      setAiTips('AI study tips are unavailable right now.');
    } finally {
      setIsLoadingTips(false);
    }
  };

  // ==========================================================================
  // Renderers
  // ==========================================================================

  if (phase === 'ERROR') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 rounded-2xl p-10 max-w-md text-center shadow-xl">
          <Icons.AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{errorMsg || 'Please try again.'}</p>
          <button onClick={handleExit} className="bg-slate-900 dark:bg-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm">Return to Exam Portal</button>
        </div>
      </div>
    );
  }

  if (phase === 'SUBMITTING') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icons.CloudSync className="w-10 h-10 text-[#8dc63f] animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">Grading your responses...</p>
        </div>
      </div>
    );
  }

  // 1. CONFIRM DETAILS
  if (phase === 'CONFIRM') {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-lg rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
          <div className="bg-[#4d4d4d] text-white px-6 py-3 flex justify-between items-center">
            <span className="font-bold text-lg">Confirm Details</span>
          </div>
          <div className="p-8 flex flex-col items-center text-slate-900 dark:text-slate-100">
            <div className="mb-8 w-40">
              <div className="border border-slate-300 dark:border-slate-700 p-2 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-2xl text-slate-800 dark:text-white">CMA</span>
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                  <span className="text-[6px] uppercase leading-tight font-bold text-slate-500 dark:text-slate-400">IMA's Certification for<br />Accountants and<br />Financial Professionals<br />in Business</span>
                </div>
              </div>
            </div>
            <div className="border border-slate-300 dark:border-slate-700 p-6 w-full mb-8 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
              <div className="grid grid-cols-3 gap-y-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Exam:</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">{exam.title}</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Section 1:</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">{mcqQuestions.length} MCQs · {exam.mcq_minutes} min</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Section 2:</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">{exam.cbq_count} Cases · {exam.cbq_minutes} min</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Language:</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">English (US)</span>
              </div>
            </div>
            <p className="mb-8 font-medium">Are the details above correct?</p>
            <div className="flex gap-4">
              <button onClick={() => setPhase('TERMS')} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2.5 rounded font-bold shadow-sm flex items-center gap-2">
                <Icons.CheckBadge className="w-4 h-4" /> Confirm
              </button>
              <button onClick={handleExit} className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2.5 rounded font-bold shadow-sm flex items-center gap-2">
                <Icons.Plus className="w-4 h-4 rotate-45" /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. TERMS
  if (phase === 'TERMS') {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
        <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-[1000px] h-[85vh] flex flex-col border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-[#4d4d4d] text-white px-4 py-2 flex justify-between items-center shrink-0 h-12">
            <span className="font-bold text-lg">Agree to Terms</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-white dark:bg-slate-900 relative text-slate-900 dark:text-slate-100">
            <p className="text-slate-800 dark:text-slate-200 text-lg text-center font-medium mb-6">
              Please read and accept the terms before beginning.
            </p>
            <div className="w-full max-w-4xl flex-1 border-[3px] border-[#f7b500] rounded-xl p-1 mb-8 relative bg-white dark:bg-slate-950">
              <div className="h-full max-h-[400px] overflow-y-auto p-8 text-justify text-sm leading-relaxed text-slate-800 dark:text-slate-200 pr-6">
                <h3 className="text-center font-bold text-slate-900 dark:text-white mb-8 uppercase text-base">Confidentiality Agreement</h3>
                <p className="mb-6">
                  I hereby attest that I will not copy, reproduce, transmit, disclose, or share any exam questions or scenarios in whole or in part to any person or entity.
                </p>
                <p className="font-bold">By clicking "I accept these terms" you affirm that you accept all rules and terms of this agreement.</p>
              </div>
            </div>
            <div className="mb-8 flex items-center gap-3 cursor-pointer select-none" onClick={() => setTermsAccepted(!termsAccepted)}>
              <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${termsAccepted ? 'border-[#8dc63f] bg-[#8dc63f]' : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                {termsAccepted && <Icons.CheckBadge className="w-4 h-4 text-white" />}
              </div>
              <span className="text-slate-800 dark:text-slate-200 font-bold text-base">I accept these terms.</span>
            </div>
            <div className="flex gap-4 mb-4">
              <button onClick={handleExit} className="bg-slate-600 hover:bg-slate-700 text-white px-10 py-3 rounded font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors">
                <span className="font-bold text-xl leading-none">×</span> Exit
              </button>
              <button
                onClick={() => termsAccepted && setPhase('INTRODUCTION')}
                disabled={!termsAccepted}
                className={`px-10 py-3 rounded font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors ${termsAccepted ? 'bg-[#8dc63f] hover:bg-[#7db536] text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'}`}
              >
                <Icons.CheckBadge className="w-5 h-5" /> Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. INTRODUCTION
  if (phase === 'INTRODUCTION') {
    const total = INTRO_SLIDES.length;
    const slide = INTRO_SLIDES[introPage];
    const progress = Math.round(((introPage + 1) / total) * 100);
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100">
        <div className="bg-[#333333] dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 border-b border-slate-700">
          <div className="text-sm font-bold leading-tight">Orientation<br /><span className="font-medium text-slate-300">Slide {introPage + 1} of {total}</span></div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-right hidden sm:block">
              <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                <div className="bg-[#8dc63f] h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              Progress {progress}%
            </div>
          </div>
        </div>

        <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
          <span className="font-bold text-sm">Exam: {exam.title}</span>
        </div>

        <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900">
          <div className="w-16 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0 no-scrollbar">
            {INTRO_SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setIntroPage(i)}
                className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-1 border border-l-0 ${i === introPage ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1 shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-[#8dc63f]/30'}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                <span className="text-xs font-black text-brand uppercase tracking-widest">Slide {introPage + 1} of {total}</span>
                <h1 className="text-2xl font-black uppercase tracking-tight mt-1">{slide.title}</h1>
              </div>
              {slide.body}
            </div>
          </div>
        </div>

        <div className="bg-[#4d4d4d] dark:bg-slate-950 px-4 py-3 flex justify-between items-center border-t border-[#666] dark:border-slate-800 shrink-0">
          <div className="flex gap-2 text-xs font-bold text-slate-300">Slide {introPage + 1} of {total}</div>
          <div className="flex gap-3">
            <button onClick={() => setIntroPage(Math.max(0, introPage - 1))} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 text-sm shadow-md">
              <Icons.ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {introPage < total - 1 ? (
              <button onClick={() => setIntroPage(Math.min(total - 1, introPage + 1))} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 text-sm shadow-md">
                Next <Icons.ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 ml-4 text-sm shadow-lg border border-white/20" onClick={() => setPhase('MCQ')}>
                Start the Test <Icons.ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. MCQ SECTION
  if (phase === 'MCQ' && currentMcq) {
    const answeredCount = Array.from(mcqAnswers.values()).filter(a => a.selected !== null).length;
    const progressPercent = mcqQuestions.length ? Math.round((answeredCount / mcqQuestions.length) * 100) : 0;
    const optionList = normalizeOptions(currentMcq.options);

    return (
      <div className="flex flex-col h-screen bg-white dark:bg-[#0b0f19] font-sans relative text-slate-900 dark:text-slate-100">
        <div className="bg-[#333333] dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 z-20 relative border-b border-slate-800">
          <div className="text-sm font-bold leading-tight">
            Question {currentMcqIndex + 1} of {mcqQuestions.length}<br />
            <span className="font-medium text-slate-300">{currentMcq.section}</span>
          </div>
          <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <Icons.Clock className="w-6 h-6 text-white" />
            <div className="text-left">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">Section 1 Time Remaining</div>
              <div className={`font-mono text-xl leading-none font-bold ${mcqRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(mcqRemaining)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-right hidden sm:block">
              <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                <div className="bg-[#8dc63f] h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
              Answered {progressPercent}%
            </div>
            <button onClick={() => handleFinishMcq(false)} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-colors border border-slate-400 dark:border-slate-600">
              Finish Section 1
            </button>
          </div>
        </div>

        <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
          <span className="font-bold text-sm">{exam.title}</span>
          <span className="font-bold text-sm">Section 1 — Multiple Choice</span>
        </div>

        <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-slate-900">
          <div className="w-14 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0 no-scrollbar">
            {mcqQuestions.map((q, i) => {
              const isCurrent = i === currentMcqIndex;
              const ans = mcqAnswers.get(q.id);
              const isAnswered = ans?.selected != null;
              const isFlagged = ans?.flagged;
              return (
                <div
                  key={q.id}
                  onClick={() => setCurrentMcqIndex(i)}
                  className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold shadow-sm cursor-pointer transition-all border border-l-0 relative mb-1 ${
                    isCurrent ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' :
                    isAnswered ? 'bg-slate-700 text-white border-slate-800' :
                    'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {i + 1}
                  {isFlagged && <div className="absolute top-0 right-0 p-[1px]"><Icons.Flag className="w-2 h-2 fill-current text-amber-400" /></div>}
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {showCalculator && <CalculatorWidget onClose={() => setShowCalculator(false)} />}

            {isReviewOpen && (
              <div className="absolute bottom-0 left-0 w-80 h-[450px] z-40 bg-slate-100 dark:bg-slate-900 border-t border-r border-slate-400 dark:border-slate-700 shadow-2xl flex flex-col">
                <div className="bg-[#4d4d4d] dark:bg-slate-950 text-white px-4 py-2 font-bold text-xs flex justify-between items-center border-b border-[#666]">
                  <span>Section Review Matrix</span>
                  <button onClick={() => setIsReviewOpen(false)} className="hover:text-red-300 text-sm font-bold">✕</button>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-900 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-2">
                    {mcqQuestions.map((q, idx) => {
                      const ans = mcqAnswers.get(q.id);
                      return (
                        <button
                          key={q.id}
                          onClick={() => { setCurrentMcqIndex(idx); setIsReviewOpen(false); }}
                          className={`h-9 border-2 relative font-bold text-xs rounded flex items-center justify-center transition-all ${
                            ans?.selected ? 'bg-[#8dc63f] text-white border-[#7db536]' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {idx + 1}
                          {ans?.flagged && <div className="absolute top-0 right-0 p-0.5"><Icons.Flag className="w-2 h-2 fill-current text-amber-400" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white dark:bg-slate-900">
              <div className="max-w-6xl mx-auto h-full flex flex-col">
                <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                  <h2 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tight">Multiple-Choice Question</h2>
                  <button onClick={() => setShowCalculator(!showCalculator)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg shadow-sm">
                    <Icons.Calculator className="w-4 h-4 text-brand" /> Calculator
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 p-8 min-h-[300px] mb-8 rounded-2xl shadow-sm">
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-8">
                    {currentMcq.question_text}
                  </p>
                  <div className="space-y-4">
                    {optionList.map(opt => {
                      const isSelected = currentMcqAnswer?.selected === opt.key;
                      return (
                        <div key={opt.key} onClick={() => handleSelectMcqOption(opt.key)} className="flex items-center gap-4 cursor-pointer group">
                          <div className={`font-black text-sm w-5 ${isSelected ? 'text-brand scale-125' : 'text-slate-500 dark:text-slate-400'}`}>{opt.key}</div>
                          <div className={`flex-1 p-4 border-2 rounded-xl transition-all ${isSelected ? 'border-slate-900 dark:border-amber-400 bg-[#fff9c4] dark:bg-amber-500/20 text-slate-900 dark:text-white font-bold' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-500 dark:hover:border-slate-500'}`}>
                            <span className={`text-base ${isSelected ? 'font-bold' : 'font-medium'}`}>{opt.text}</span>
                          </div>
                        </div>
                      );
                    })}
                    {optionList.length === 0 && <p className="text-sm text-red-500">This question has no options available.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#4d4d4d] dark:bg-slate-950 px-6 py-4 flex justify-between items-center border-t border-[#666] dark:border-slate-800 shrink-0 z-30 relative h-16">
          <div className="flex gap-2">
            <button onClick={() => setIsReviewOpen(!isReviewOpen)} className={`w-10 h-10 rounded flex items-center justify-center text-white border transition-colors ${isReviewOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'}`} title="Toggle Section Review Grid">
              <Icons.Grid className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleFlagMcq} className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors text-sm ${currentMcqAnswer?.flagged ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}>
              <Icons.Flag className={`w-4 h-4 ${currentMcqAnswer?.flagged ? 'fill-current text-amber-300' : ''}`} />
              {currentMcqAnswer?.flagged ? 'Flagged' : 'Flag'}
            </button>
            <div className="h-6 w-px bg-[#666] mx-2"></div>
            <button onClick={() => setCurrentMcqIndex(Math.max(0, currentMcqIndex - 1))} disabled={currentMcqIndex === 0} className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 rounded font-bold flex items-center gap-1 transition-colors text-sm shadow-md">
              <Icons.ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => setCurrentMcqIndex(Math.min(mcqQuestions.length - 1, currentMcqIndex + 1))} disabled={currentMcqIndex === mcqQuestions.length - 1} className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 rounded font-bold flex items-center gap-1 transition-colors text-sm shadow-md">
              Next <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. TRANSITION — gate passed
  if (phase === 'TRANSITION') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-10 max-w-lg text-center shadow-2xl">
          <Icons.CheckBadge className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Section 1 Cleared</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Score: <strong>{attempt.mcq_score}%</strong> ({attempt.mcq_correct}/{attempt.mcq_total})</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">You've cleared the 50% gate. Section 2 (Case-Based Questions) is now unlocked — {exam.cbq_minutes} minutes for {cbqCases.length} case{cbqCases.length !== 1 ? 's' : ''}.</p>
          <button onClick={() => setPhase('CBQ')} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-10 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg">
            Begin Section 2 <Icons.ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>
    );
  }

  // 6. CBQ SECTION
  if (phase === 'CBQ' && currentCase) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-[#0b0f19] font-sans relative text-slate-900 dark:text-slate-100">
        <div className="bg-[#333333] dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 z-20 relative border-b border-slate-800">
          <div className="text-sm font-bold leading-tight">
            Case {currentCaseIndex + 1} of {cbqCases.length}<br />
            <span className="font-medium text-slate-300">{currentCase.section}</span>
          </div>
          <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <Icons.Clock className="w-6 h-6 text-white" />
            <div className="text-left">
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">Section 2 Time Remaining</div>
              <div className={`font-mono text-xl leading-none font-bold ${cbqRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{formatTime(cbqRemaining)}</div>
            </div>
          </div>
          <button onClick={() => handleSubmit(false)} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-colors border border-slate-400 dark:border-slate-600">
            Submit Exam
          </button>
        </div>

        <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
          <span className="font-bold text-sm">{exam.title}</span>
          <span className="font-bold text-sm">Section 2 — Case-Based Questions</span>
        </div>

        {cbqCases.length > 1 && (
          <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 flex gap-2 border-b border-slate-300 dark:border-slate-800 shrink-0">
            {cbqCases.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setCurrentCaseIndex(i); setCurrentTaskIndex(0); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-colors ${i === currentCaseIndex ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'}`}
              >
                Case {i + 1}: {c.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900">
          {/* Left: narrative + exhibits */}
          <div className="w-1/2 overflow-y-auto p-6 md:p-8 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">{currentCase.title}</h3>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line mb-8">{currentCase.narrative}</p>
            {(currentCase.exhibits || []).map((ex, i) => (
              <div key={i} className="mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand mb-1">Exhibit {i + 1} — {ex.label}</h4>
                {ex.caption && <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">{ex.caption}</p>}
                <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-200 dark:bg-slate-800">
                      <tr>{ex.columns.map((c, ci) => <th key={ci} className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-200">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {ex.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/60'}>
                          {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-800 dark:text-slate-200">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Right: tasks */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Task {currentTaskIndex + 1} of {flatTasks.length}</span>
              <div className="flex gap-1">
                {flatTasks.map((t, i) => {
                  const answered = cbqAnswers.get(t.id) != null;
                  return (
                    <button key={t.id} onClick={() => setCurrentTaskIndex(i)} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${i === currentTaskIndex ? 'bg-brand text-white' : answered ? 'bg-slate-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            {currentTask && (
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{currentTask.prompt}</p>
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-brand text-white px-2.5 py-1 rounded-full">{currentTask.marks} pts</span>
                </div>
                {currentTask.hint && <p className="text-xs italic text-slate-500 dark:text-slate-400 mb-6">{currentTask.hint}</p>}
                <CbqTaskRenderer task={currentTask} value={cbqAnswers.get(currentTask.id)} onChange={v => handleCbqChange(currentTask.id, v)} />
              </div>
            )}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-between shrink-0 bg-white dark:bg-slate-900">
              <button onClick={() => setCurrentTaskIndex(Math.max(0, currentTaskIndex - 1))} disabled={currentTaskIndex === 0} className="bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-200 px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                <Icons.ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={() => setCurrentTaskIndex(Math.min(flatTasks.length - 1, currentTaskIndex + 1))} disabled={currentTaskIndex === flatTasks.length - 1} className="bg-brand hover:bg-slate-900 disabled:opacity-40 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                Next <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. RESULTS
  if (phase === 'RESULTS' && result) {
    const wrongCount = result.mcq_review.filter(r => !r.correct || r.selected !== r.correct).length;
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center font-sans p-6 text-slate-900 dark:text-slate-100">
        <div className="bg-white dark:bg-slate-900 shadow-2xl max-w-3xl w-full border border-slate-300 dark:border-slate-800 rounded-3xl overflow-hidden my-10">
          <div className="bg-[#4d4d4d] dark:bg-slate-950 text-white px-6 py-4 font-bold text-lg flex justify-between">
            <span>Examination Result</span>
            <span className="text-[#8dc63f] uppercase tracking-widest text-sm self-center font-black">CoStudy</span>
          </div>

          <div className="p-10 flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${result.passed ? 'border-[#8dc63f] text-[#8dc63f]' : 'border-red-500 text-red-500'}`}>
              {result.passed ? <Icons.CheckBadge className="w-12 h-12" /> : <Icons.AlertCircle className="w-12 h-12" />}
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{result.passed ? 'Pass' : 'Did Not Pass'}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium text-center">
              Scaled Score: <strong>{result.scaled} / 500</strong> (pass threshold {result.pass_threshold})
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center mb-8 rounded-2xl">
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{result.mcq_pct}%</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">MCQ Score</div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{result.gate_passed ? `${result.cbq_pct}%` : '—'}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">CBQ Score</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#8dc63f] mb-1">{result.mcq_correct}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">MCQ Correct</div>
              </div>
              <div>
                <div className="text-3xl font-black text-red-500 mb-1">{result.mcq_total - result.mcq_correct}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">MCQ Incorrect</div>
              </div>
            </div>

            {!result.gate_passed && (
              <div className="w-full mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-sm font-medium text-center">
                You didn't clear the 50% gate on Section 1, so Section 2 (Case-Based Questions) was not unlocked — matching the real 2026 CMA exam rule. Review your MCQ mistakes below and try again.
              </div>
            )}

            {result.gate_passed && result.cbq_cases?.length > 0 && (
              <div className="w-full mb-8 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Section 2 Case Review</h3>
                {result.cbq_cases.map(c => (
                  <details key={c.case_id} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl p-4">
                    <summary className="cursor-pointer font-bold text-sm text-slate-900 dark:text-white flex justify-between">
                      <span>{c.title}</span>
                      <span>{c.marks}/{c.available} pts ({Math.round(c.pct)}%)</span>
                    </summary>
                    <div className="mt-4 space-y-3">
                      {c.detail.map(d => (
                        <div key={d.task_id} className="text-xs border-t border-slate-200 dark:border-slate-700 pt-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{d.prompt}</p>
                          <p className="text-slate-600 dark:text-slate-300 mb-1">Score: {d.got}/{d.marks} — {d.note}</p>
                          {d.explanation && <p className="text-slate-500 dark:text-slate-400 italic">{d.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}

            <div className="w-full mb-8 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">MCQ Review ({wrongCount} incorrect)</h3>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {result.mcq_review.filter(r => !r.correct || r.selected !== r.correct).map((r, i) => (
                  <div key={r.id} className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{r.section} {r.topic ? `· ${r.topic}` : ''}</p>
                    <p className="text-slate-600 dark:text-slate-400">Your answer: {r.selected ?? '—'} | Correct: {r.correct ?? '—'}</p>
                    {r.explanation && <p className="text-slate-500 dark:text-slate-400 italic mt-1">{r.explanation}</p>}
                  </div>
                ))}
                {wrongCount === 0 && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Perfect MCQ score — no mistakes to review!</p>}
              </div>
            </div>

            {aiTips ? (
              <div className="w-full mb-8 p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl text-left max-h-[350px] overflow-y-auto no-scrollbar border-4 border-brand/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-brand/20 rounded-xl"><Icons.Sparkles className="w-5 h-5 text-brand" /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">AI Study Tips</h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{aiTips}</Markdown>
                </div>
              </div>
            ) : wrongCount > 0 && (
              <button onClick={handleLoadTips} disabled={isLoadingTips} className="w-full mb-8 py-5 bg-slate-900 dark:bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                {isLoadingTips ? (<><Icons.CloudSync className="w-5 h-5 animate-spin" /> Generating Tips...</>) : (<><Icons.Brain className="w-5 h-5" /> Get AI Study Tips on Wrong MCQs</>)}
              </button>
            )}

            <button onClick={handleExit} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-12 py-3.5 rounded font-bold shadow-lg transition-all uppercase tracking-widest text-sm">
              Return to Exam Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================================
// Calculator widget (unchanged visual language)
// ============================================================================

const CalculatorWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="absolute top-12 right-12 w-64 bg-slate-100 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded-xl shadow-2xl z-50 p-3 select-none">
    <div className="bg-slate-700 dark:bg-slate-900 text-white px-2 py-1 text-xs font-bold rounded flex justify-between cursor-move mb-2">
      <span>Calculator</span>
      <button onClick={onClose} className="hover:text-red-400 font-bold">X</button>
    </div>
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 h-10 mb-2 text-right p-2 font-mono text-lg font-bold flex items-center justify-end rounded text-slate-900 dark:text-white">0</div>
    <div className="grid grid-cols-4 gap-1.5">
      {['MC', 'MR', 'MS', 'M+', '←', 'CE', 'C', '±', '√', '7', '8', '9', '/', '%', '4', '5', '6', '*', '1/x', '1', '2', '3', '-', '=', '0', '.', '+'].map((k, idx) => (
        <button key={idx} className={`bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 text-xs font-bold rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white ${k === '=' ? 'row-span-2 bg-[#8dc63f] text-white hover:bg-[#7db536]' : ''}`}>{k}</button>
      ))}
    </div>
  </div>
);
