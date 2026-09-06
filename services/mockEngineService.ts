import { supabase } from './supabaseClient';

// ==========================================================================
// mockEngineService — thin typed wrapper around the deployed `mock-engine`
// Supabase Edge Function. The server owns the clock, the answer key, and all
// scoring; this file only shapes requests/responses for the frontend.
// ==========================================================================

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://avtjxcdcjbwmggdimkgh.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/mock-engine`;

export class MockEngineError extends Error {
  expired?: boolean;
  status?: number;
  constructor(message: string, opts?: { expired?: boolean; status?: number }) {
    super(message);
    this.name = 'MockEngineError';
    this.expired = opts?.expired;
    this.status = opts?.status;
  }
}

async function callMockEngine<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    throw new MockEngineError('You must be signed in to use the exam engine.');
  }

  let res: Response;
  try {
    res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (e: any) {
    throw new MockEngineError(e?.message || 'Network error contacting the exam engine.');
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON body, fall through with null
  }

  if (!res.ok) {
    throw new MockEngineError(json?.error || `Exam engine error (${res.status})`, {
      expired: !!json?.expired,
      status: res.status,
    });
  }

  return json as T;
}

// ---- Types -----------------------------------------------------------------

export interface MockExam {
  id: string;
  title: string;
  exam: string;
  mcq_minutes: number;
  cbq_minutes: number;
  cbq_count: number;
  gate_pct: number;
  pass_threshold: number;
}

export interface MockAttempt {
  id: string;
  section: 'mcq' | 'cbq' | 'completed';
  state: string;
  section1_ends_at: string | null;
  section2_ends_at: string | null;
  mcq_score: number | null;
  mcq_correct: number | null;
  mcq_total: number | null;
}

export interface MockQuestion {
  id: string;
  question_text: string;
  options: any;
  section: string;
  topic: string;
  difficulty: string;
}

export interface McqResponse {
  question_id: string;
  selected_key: string | null;
  flagged: boolean;
}

export type CbqTaskType = 'num' | 'list' | 'multi' | 'dnd' | 'mcq';

export interface CbqTask {
  id: string;
  case_id: string;
  seq: number;
  type: CbqTaskType;
  marks: number;
  prompt: string;
  hint?: string | null;
  payload: any;
}

export interface CbqExhibit {
  label: string;
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface CbqCase {
  id: string;
  part: string;
  section: string;
  title: string;
  narrative: string;
  exhibits: CbqExhibit[];
  difficulty: string;
  tasks: CbqTask[];
}

export interface CbqResponse {
  task_id: string;
  response: any;
}

export interface ResumeResult {
  attempt: MockAttempt;
  exam: MockExam;
  server_now: string;
  questions?: MockQuestion[];
  responses?: (McqResponse | CbqResponse)[];
  cases?: CbqCase[];
  result?: ExamResult;
}

export interface FinishMcqPassed {
  gate_passed: true;
  mcq_pct: number;
  mcq_correct: number;
  mcq_total: number;
  section2_ends_at: string;
  cases: CbqCase[];
  responses: CbqResponse[];
}

export interface FinishMcqFailed {
  gate_passed: false;
  result: ExamResult;
}

export type FinishMcqResult = FinishMcqPassed | FinishMcqFailed;

export interface McqReviewItem {
  id: string;
  selected: string | null;
  correct: string | null;
  explanation: string | null;
  section: string | null;
  topic: string | null;
}

export interface CbqTaskDetail {
  task_id: string;
  seq: number;
  type: CbqTaskType;
  prompt: string;
  marks: number;
  got: number;
  note: string;
  explanation?: string | null;
  answer?: any;
  response: any;
}

export interface CbqCaseResult {
  case_id: string;
  title: string;
  section: string;
  marks: number;
  available: number;
  pct: number;
  detail: CbqTaskDetail[];
}

export interface ExamResult {
  mcq_pct: number;
  mcq_correct: number;
  mcq_total: number;
  gate_passed: boolean;
  gate_pct: number;
  cbq_pct: number;
  cbq_marks?: number;
  cbq_available?: number;
  cbq_cases: CbqCaseResult[];
  scaled: number;
  passed: boolean;
  pass_threshold: number;
  by_section: Record<string, { correct: number; total: number }>;
  mcq_review: McqReviewItem[];
  completed_at: string;
}

export interface AttemptHistoryItem {
  id: string;
  exam_id: string;
  state: string;
  section: string;
  started_at: string;
  completed_at: string | null;
  mcq_score: number | null;
  cbq_score: number | null;
  scaled_score: number | null;
  passed: boolean | null;
  mock_exams?: { title: string; exam: string };
}

// ---- API ---------------------------------------------------------------

export const startExam = (examId: string): Promise<ResumeResult> =>
  callMockEngine<ResumeResult>('start', { exam_id: examId });

export const resumeAttempt = (attemptId: string): Promise<ResumeResult> =>
  callMockEngine<ResumeResult>('resume', { attempt_id: attemptId });

export const saveMcqAnswer = (
  attemptId: string,
  questionId: string,
  opts: { selected_key?: string; flagged?: boolean }
): Promise<{ ok: true }> =>
  callMockEngine('save_mcq', { attempt_id: attemptId, question_id: questionId, ...opts });

export const finishMcqSection = (attemptId: string): Promise<FinishMcqResult> =>
  callMockEngine<FinishMcqResult>('finish_mcq', { attempt_id: attemptId });

export const saveCbqResponse = (attemptId: string, taskId: string, response: any): Promise<{ ok: true }> =>
  callMockEngine('save_cbq', { attempt_id: attemptId, task_id: taskId, response });

export const submitExam = (attemptId: string): Promise<{ result: ExamResult }> =>
  callMockEngine('submit', { attempt_id: attemptId });

export const getResult = (attemptId: string): Promise<{ result: ExamResult; state: string; section: string }> =>
  callMockEngine('result', { attempt_id: attemptId });

export const getHistory = (): Promise<{ attempts: AttemptHistoryItem[] }> => callMockEngine('history', {});

export const abandonAttempt = (attemptId: string): Promise<{ ok: true }> =>
  callMockEngine('abandon', { attempt_id: attemptId });
