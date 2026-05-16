import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://api.costudy.in";

// ─── Types mirroring backend response shapes ──────────────────────

export interface MockSummary {
  id: string;
  slug: string;
  exam: string;
  title: string;
  description: string | null;
  total_minutes: number;
  mcq_count: number;
  essay_count: number;
  difficulty: string;
  is_paid: boolean;
  pass_threshold: number;
}

export interface MockChoice { key: string; text: string }
export interface MCQQuestion {
  id: string;
  section_id: string;
  topic: string | null;
  stem: string;
  choices: MockChoice[];
  position: number;
  difficulty: string;
}
export interface EssayPrompt {
  id: string;
  section_id: string;
  position: number;
  scenario: string;
  question: string;
  recommended_minutes: number;
}

export interface AttemptStartResponse {
  attempt_id: string;
  exam: { id: string; total_minutes: number; mcq_minutes?: number; essay_minutes?: number; pass_threshold: number };
  mcqs: MCQQuestion[];
  essays: EssayPrompt[];
}

export interface EssaySubmissionStatus {
  id: string;
  prompt_id: string;
  grading_state: "pending" | "grading" | "graded" | "failed";
  total_score: number | null;
  performance_band: string | null;
  concept_score: number | null;
  calc_score: number | null;
  comm_score: number | null;
  pass4_aggregate: unknown | null;
  graded_at: string | null;
}

export interface AttemptDetail {
  attempt: {
    id: string;
    exam_id: string;
    state: "in_progress" | "submitted" | "grading" | "completed" | "abandoned";
    started_at: string;
    submitted_at: string | null;
    completed_at: string | null;
    total_score: number | null;
    mcq_score: number | null;
    essay_score: number | null;
    pass_threshold: number;
    mock_exams: { slug: string; title: string; exam: string; mcq_count: number; essay_count: number };
  };
  essays: EssaySubmissionStatus[];
}

// ─── Standalone exam API (token-based, no auth) ─────────────────

export interface ExamApi {
  start: () => Promise<AttemptStartResponse>;
  saveMcqAnswer: (attemptId: string, body: {
    question_id: string;
    selected_key: string | null;
    flagged?: boolean;
    time_seconds?: number;
  }) => Promise<{ ok: true; is_correct: boolean | null }>;
  submitEssay: (attemptId: string, body: { prompt_id: string; content: string }) => Promise<{ submission_id: string; grading_state: string }>;
  finalize: (attemptId: string) => Promise<{
    state: string;
    mcq_score: number;
    total_score: number | null;
    correct: number;
    total: number;
  }>;
}

async function plainFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "request_failed" }));
    throw new ApiError(res.status, body.error ?? "request_failed", body);
  }
  return res.json() as Promise<T>;
}

export function createTokenApi(
  token: string,
  guestName?: string,
  guestEmail?: string,
  guestPhone?: string,
  guestInstitute?: string,
): ExamApi {
  return {
    start: () =>
      plainFetch<AttemptStartResponse>(`/api/exam/${token}/start`, {
        method: "POST",
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone || undefined,
          guest_institute: guestInstitute || undefined,
        }),
      }),
    saveMcqAnswer: (attemptId, body) =>
      plainFetch(`/api/exam/${token}/attempts/${attemptId}/mcq`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    submitEssay: (attemptId, body) =>
      plainFetch(`/api/exam/${token}/attempts/${attemptId}/essay`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    finalize: (attemptId) =>
      plainFetch(`/api/exam/${token}/attempts/${attemptId}/finalize`, { method: "POST" }),
  };
}

export function validateToken(token: string) {
  return plainFetch<{ ok: true; exam: { title: string; mcq_count: number; essay_count: number; total_minutes: number }; label: string | null }>(
    `/api/exam/${token}/validate`
  );
}

// ─── Internal helpers ────────────────────────────────────────────

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("not_authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "request_failed" }));
    throw new ApiError(res.status, body.error ?? "request_failed", body);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, public body: unknown) {
    super(`API ${status}: ${code}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────

export const api = {
  listMocks: () => authedFetch<{ mocks: MockSummary[] }>("/api/mocks"),

  getMock: (slug: string) => authedFetch<{ mock: MockSummary }>(`/api/mocks/${slug}`),

  startMock: (slug: string) =>
    authedFetch<AttemptStartResponse>(`/api/mocks/${slug}/start`, { method: "POST" }),

  getAttempt: (id: string) => authedFetch<AttemptDetail>(`/api/attempts/${id}`),

  saveMcqAnswer: (attemptId: string, body: {
    question_id: string;
    selected_key: string | null;
    flagged?: boolean;
    time_seconds?: number;
  }) =>
    authedFetch<{ ok: true; is_correct: boolean | null }>(
      `/api/attempts/${attemptId}/mcq`,
      { method: "PUT", body: JSON.stringify(body) }
    ),

  submitEssay: (attemptId: string, body: { prompt_id: string; content: string }) =>
    authedFetch<{ submission_id: string; grading_state: "pending" }>(
      `/api/attempts/${attemptId}/submit-essay`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  finalize: (attemptId: string) =>
    authedFetch<{
      state: string;
      mcq_score: number;
      essay_score: number | null;
      total_score: number | null;
      pending_essays: boolean;
    }>(`/api/attempts/${attemptId}/finalize`, { method: "POST" }),
};
