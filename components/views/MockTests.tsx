
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { supabase } from '../../services/supabaseClient';
import { syncStudyTelemetry } from '../../services/fetsService';
import { startExam, getHistory, type ResumeResult, type AttemptHistoryItem } from '../../services/mockEngineService';
import { ExamSession } from './ExamSession';

interface MockTestsProps {
  userId?: string;
}

interface MockExamRow {
  id: string;
  title: string;
  exam: string;
  mcq_minutes: number;
  cbq_minutes: number;
  mcq_count: number;
  cbq_count: number;
}

export const MockTests: React.FC<MockTestsProps> = ({ userId }) => {
  const [tests, setTests] = useState<MockExamRow[]>([]);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Exam Session State — holds the live engine payload once an attempt is started/resumed
  const [activeSession, setActiveSession] = useState<ResumeResult | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: examRows, error: examErr }, historyResult] = await Promise.all([
        supabase.from('mock_exams').select('id, title, exam, mcq_minutes, cbq_minutes, mcq_count, cbq_count').eq('is_published', true),
        getHistory().catch(() => ({ attempts: [] })),
      ]);

      if (examErr) throw examErr;
      setTests(examRows || []);
      setHistory(historyResult.attempts || []);
    } catch (e: any) {
      console.error('[MockTests] failed to load exams', e);
      setLoadError(e?.message || "Couldn't load mock exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startTest = async (exam: MockExamRow) => {
    setStartingId(exam.id);
    setStartError(null);
    try {
      const session = await startExam(exam.id);
      setActiveSession(session);
      syncStudyTelemetry({ userId, event: 'start_mock_test', testId: exam.id });
    } catch (e: any) {
      console.error('[MockTests] failed to start exam', e);
      setStartError(e?.message || "Couldn't start this exam. Please try again.");
    } finally {
      setStartingId(null);
    }
  };

  if (activeSession) {
    return (
      <ExamSession
        initial={activeSession}
        onExit={() => { setActiveSession(null); load(); }}
      />
    );
  }

  // Derive real personal stats from attempt history — no fabricated ranks/percentiles.
  const completedAttempts = history.filter(a => a.state === 'completed');
  const bestScore = completedAttempts.length ? Math.max(...completedAttempts.map(a => a.scaled_score || 0)) : null;
  const lastAttempt = completedAttempts[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <header className="w-full text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand/5 blur-[120px] pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 mb-8 bg-slate-900 dark:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-slate-800 dark:border-slate-700">
          <Icons.CloudSync className="w-4 h-4 text-brand" />
          CoStudy Assessment Engine
        </div>
        <h2 className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight scale-y-110 mb-4 uppercase">Exam Portal</h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">100 MCQs, a 50% gate, then two Case-Based Question sets — the current 2026 CMA format, fully timed and scored server-side.</p>
      </header>

      {!loading && completedAttempts.length > 0 && (
        <div className="max-w-4xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Attempts Taken', value: `${completedAttempts.length}`, icon: <Icons.ClipboardList className="w-4 h-4" /> },
            { label: 'Best Scaled Score', value: bestScore != null ? `${bestScore}/500` : '—', icon: <Icons.Trophy className="w-4 h-4" /> },
            { label: 'Last Attempt', value: lastAttempt?.completed_at ? new Date(lastAttempt.completed_at).toLocaleDateString() : '—', icon: <Icons.Clock className="w-4 h-4" /> },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-brand">{s.icon}</div>
              <div>
                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</div>
                <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {startError && (
        <div className="max-w-3xl mx-auto mb-10 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-700 dark:text-red-300 text-sm font-medium text-center">
          {startError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-6 text-slate-400 py-20">
          <Icons.CloudSync className="w-20 h-20 animate-spin text-brand" />
          <span className="font-black uppercase tracking-widest text-sm animate-pulse">Initializing Exam Environment...</span>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Icons.AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-center max-w-md">{loadError}</p>
          <button onClick={load} className="bg-slate-900 dark:bg-brand text-white px-6 py-2.5 rounded-xl font-bold text-sm">Try Again</button>
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500 dark:text-slate-400">
          <Icons.FileText className="w-12 h-12" />
          <p className="font-bold">No published mock exams are available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl mx-auto">
          {tests.map(test => (
            <div key={test.id} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-300 dark:border-slate-800 p-10 md:p-12 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Icons.Logo className="w-48 h-48" /></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 gap-4">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">{test.title}</h3>
                  <span className="px-4 py-1.5 bg-slate-900 dark:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shrink-0">{test.exam === 'cma_p2' ? 'Part 2' : 'Part 1'}</span>
                </div>
                <div className="flex flex-wrap gap-8 mb-12">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Section 1</div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{test.mcq_count} MCQs · {test.mcq_minutes}m</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Section 2</div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{test.cbq_count} Cases · {test.cbq_minutes}m</div>
                  </div>
                </div>
                <button
                  onClick={() => startTest(test)}
                  disabled={startingId === test.id}
                  className="w-full py-6 bg-brand text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-slate-800 transition-all shadow-2xl shadow-brand/20 active:scale-95 disabled:opacity-60"
                >
                  {startingId === test.id ? 'Starting…' : 'Start Session'}
                </button>
                <p className="text-center mt-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  * Progress auto-saves to your profile
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
