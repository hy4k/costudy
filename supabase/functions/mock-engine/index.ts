// CoStudy mock-engine — server-owned CMA mock exam (100 MCQ → 50% gate → 2 CBQ cases).
// The browser never sees an answer key; the clock lives here; marking happens here.
//
// POST { action, ...payload }  (Authorization: Bearer <user jwt>)
//   start       { exam_id }                       → { attempt, questions, ends_at }
//   resume      { attempt_id }                    → full state for the current section
//   save_mcq    { attempt_id, question_id, selected_key?, flagged? }
//   finish_mcq  { attempt_id }                    → grades section 1, applies gate, opens section 2
//   save_cbq    { attempt_id, task_id, response }
//   submit      { attempt_id }                    → marks section 2, final result
//   result      { attempt_id }                    → stored result
//   history     {}                                → this user's attempts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { scoreCase, scaledScore, GATE_PCT, type CbqTask } from "./score.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS } });

const GRACE_MS = 15_000; // network grace after a section clock expires

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: authHeader } } });
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return json(401, { error: "Not authenticated" });

  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }
  const action = body?.action;

  const loadAttempt = async (id: string) => {
    const { data, error } = await db.from("mock_attempts").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error || !data) throw new Error("Attempt not found");
    return data;
  };

  const questionsFor = async (ids: string[]) => {
    if (!ids.length) return [];
    const { data, error } = await db.from("question_bank").select("id, question_text, options, section, topic, difficulty").in("id", ids);
    if (error) throw error;
    const order = new Map(ids.map((id, i) => [id, i]));
    return (data ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  };

  const casesFor = async (ids: string[]) => {
    if (!ids.length) return [];
    const { data: cases } = await db.from("cbq_cases").select("id, part, section, title, narrative, exhibits, difficulty").in("id", ids);
    const { data: tasks } = await db.from("cbq_tasks").select("id, case_id, seq, type, marks, prompt, hint, payload").in("case_id", ids).order("seq");
    const order = new Map(ids.map((id, i) => [id, i]));
    return (cases ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map(c => ({ ...c, tasks: (tasks ?? []).filter(t => t.case_id === c.id) })); // no answer/explanation columns selected
  };

  const mcqState = async (attemptId: string) => {
    const { data } = await db.from("mcq_responses").select("question_id, selected_key, flagged").eq("attempt_id", attemptId);
    return data ?? [];
  };
  const cbqState = async (attemptId: string) => {
    const { data } = await db.from("cbq_responses").select("task_id, response").eq("attempt_id", attemptId);
    return data ?? [];
  };

  try {
    switch (action) {
      case "start": {
        const { data: exam, error: exErr } = await db.from("mock_exams").select("*").eq("id", body.exam_id).eq("is_published", true).maybeSingle();
        if (exErr || !exam) return json(404, { error: "Exam not found" });

        // Resume an unfinished attempt only if it still has a question set.
        // Zombie rows (empty question_ids from older clients) must not blank the UI.
        const { data: existing } = await db.from("mock_attempts").select("id, question_ids").eq("user_id", userId).eq("exam_id", exam.id)
          .in("state", ["in_progress"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (existing && Array.isArray(existing.question_ids) && existing.question_ids.length > 0) {
          body.attempt_id = existing.id; /* fallthrough to resume */
        } else {
          if (existing) {
            await db.from("mock_attempts").update({ state: "abandoned", section: "completed" }).eq("id", existing.id);
          }
          const part = exam.exam === "cma_p2" ? "Part 2" : "Part 1";
          const want = exam.mcq_count || 100;
          const { data: qs, error: qErr } = await db.rpc("pick_mock_mcqs", { p_part: part, p_count: want });
          if (qErr) throw qErr;
          const questionIds = shuffle((qs ?? []).map((q: any) => q.id));
          const minNeeded = Math.min(want, 10);
          if (questionIds.length < minNeeded) return json(409, { error: `Not enough verified ${part} questions in the bank yet.` });

          const { data: cs } = await db.from("cbq_cases").select("id").eq("part", part).eq("active", true).eq("verified", true);
          const caseIds = shuffle((cs ?? []).map((c: any) => c.id)).slice(0, exam.cbq_count ?? 2);

          const ends = new Date(Date.now() + (exam.mcq_minutes || 180) * 60_000).toISOString();
          const { data: att, error: aErr } = await db.from("mock_attempts").insert({
            user_id: userId, exam_id: exam.id, state: "in_progress", section: "mcq",
            section1_ends_at: ends, question_ids: questionIds, case_ids: caseIds,
            mcq_total: questionIds.length, pass_threshold: exam.pass_threshold ?? 360,
            metadata: { source: "costudy", part, mcq_minutes: exam.mcq_minutes, cbq_minutes: exam.cbq_minutes, gate_pct: exam.gate_pct ?? GATE_PCT },
          }).select().single();
          if (aErr) throw aErr;
          body.attempt_id = att.id;
        }
        // fallthrough
      }
      // deno-lint-ignore no-fallthrough
      case "resume": {
        const att = await loadAttempt(body.attempt_id);
        const { data: exam } = await db.from("mock_exams").select("id, title, exam, mcq_minutes, cbq_minutes, cbq_count, gate_pct, pass_threshold").eq("id", att.exam_id).single();
        const base = { attempt: { id: att.id, section: att.section, state: att.state, section1_ends_at: att.section1_ends_at, section2_ends_at: att.section2_ends_at, mcq_score: att.mcq_score, mcq_correct: att.mcq_correct, mcq_total: att.mcq_total }, exam, server_now: new Date().toISOString() };
        if (att.section === "mcq") {
          const qids = att.question_ids ?? [];
          if (!qids.length) {
            await db.from("mock_attempts").update({ state: "abandoned", section: "completed" }).eq("id", att.id);
            return json(409, { error: "This attempt has no questions. Please start the exam again." });
          }
          return json(200, { ...base, questions: await questionsFor(qids), responses: await mcqState(att.id) });
        }
        if (att.section === "cbq") {
          return json(200, { ...base, cases: await casesFor(att.case_ids ?? []), responses: await cbqState(att.id) });
        }
        return json(200, { ...base, result: att.result });
      }

      case "save_mcq": {
        const att = await loadAttempt(body.attempt_id);
        if (att.section !== "mcq") return json(409, { error: "Section 1 is closed" });
        if (att.section1_ends_at && Date.now() > new Date(att.section1_ends_at).getTime() + GRACE_MS) return json(409, { error: "Time is up for section 1", expired: true });
        if (!(att.question_ids ?? []).includes(body.question_id)) return json(400, { error: "Question not in this attempt" });
        const row: any = { attempt_id: att.id, question_id: body.question_id, answered_at: new Date().toISOString() };
        if (body.selected_key !== undefined) row.selected_key = body.selected_key;
        if (body.flagged !== undefined) row.flagged = !!body.flagged;
        const { error } = await db.from("mcq_responses").upsert(row, { onConflict: "attempt_id,question_id" });
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "finish_mcq": {
        const att = await loadAttempt(body.attempt_id);
        if (att.section !== "mcq") return json(409, { error: "Section 1 already finished" });
        const ids: string[] = att.question_ids ?? [];
        const { data: keyRows } = await db.from("question_bank").select("id, correct_answer, explanation, section, topic").in("id", ids);
        const keys = new Map((keyRows ?? []).map((k: any) => [k.id, k]));
        const responses = await mcqState(att.id);
        const sel = new Map(responses.map((r: any) => [r.question_id, r.selected_key]));
        let correct = 0;
        const bySection: Record<string, { correct: number; total: number }> = {};
        for (const id of ids) {
          const k = keys.get(id); const s = k?.section || "General";
          bySection[s] ??= { correct: 0, total: 0 }; bySection[s].total++;
          const isCorrect = !!k && sel.get(id) != null && String(sel.get(id)).toUpperCase() === String(k.correct_answer).toUpperCase();
          if (isCorrect) { correct++; bySection[s].correct++; }
          await db.from("mcq_responses").upsert({ attempt_id: att.id, question_id: id, is_correct: isCorrect, selected_key: sel.get(id) ?? null }, { onConflict: "attempt_id,question_id" });
        }
        const total = ids.length || 1;
        const pct = Math.round((correct / total) * 1000) / 10;
        const gate = att.metadata?.gate_pct ?? GATE_PCT;
        const passedGate = pct >= gate;
        const cbqMinutes = att.metadata?.cbq_minutes ?? 60;
        const review = ids.map(id => ({ id, selected: sel.get(id) ?? null, correct: keys.get(id)?.correct_answer ?? null, explanation: keys.get(id)?.explanation ?? null, section: keys.get(id)?.section ?? null, topic: keys.get(id)?.topic ?? null }));

        if (passedGate) {
          const ends = new Date(Date.now() + cbqMinutes * 60_000).toISOString();
          await db.from("mock_attempts").update({ section: "cbq", mcq_score: pct, mcq_correct: correct, mcq_total: total, section2_ends_at: ends, metadata: { ...att.metadata, mcq_by_section: bySection, mcq_review: review } }).eq("id", att.id);
          return json(200, { gate_passed: true, mcq_pct: pct, mcq_correct: correct, mcq_total: total, section2_ends_at: ends, cases: await casesFor(att.case_ids ?? []), responses: [] });
        }
        const scaled = scaledScore(pct, 0);
        const result = { mcq_pct: pct, mcq_correct: correct, mcq_total: total, gate_passed: false, gate_pct: gate, cbq_pct: 0, cbq_cases: [], scaled, passed: false, pass_threshold: att.pass_threshold ?? 360, by_section: bySection, mcq_review: review, completed_at: new Date().toISOString() };
        await db.from("mock_attempts").update({ section: "completed", state: "completed", mcq_score: pct, mcq_correct: correct, mcq_total: total, cbq_score: 0, total_score: scaled, scaled_score: scaled, passed: false, submitted_at: new Date().toISOString(), completed_at: new Date().toISOString(), result }).eq("id", att.id);
        await db.rpc("increment_profile_counter", { p_user: userId, p_col: "total_mocks" }).then(() => {}, () => {});
        return json(200, { gate_passed: false, result });
      }

      case "save_cbq": {
        const att = await loadAttempt(body.attempt_id);
        if (att.section !== "cbq") return json(409, { error: "Section 2 is not open" });
        if (att.section2_ends_at && Date.now() > new Date(att.section2_ends_at).getTime() + GRACE_MS) return json(409, { error: "Time is up for section 2", expired: true });
        const { data: task } = await db.from("cbq_tasks").select("id, case_id").eq("id", body.task_id).maybeSingle();
        if (!task || !(att.case_ids ?? []).includes(task.case_id)) return json(400, { error: "Task not in this attempt" });
        const { error } = await db.from("cbq_responses").upsert({ user_id: userId, attempt_id: att.id, task_id: task.id, response: body.response ?? null, updated_at: new Date().toISOString() }, { onConflict: "attempt_id,task_id" });
        if (error) throw error;
        return json(200, { ok: true });
      }

      case "submit": {
        const att = await loadAttempt(body.attempt_id);
        if (att.section !== "cbq") return json(409, { error: "Nothing to submit" });
        const caseIds: string[] = att.case_ids ?? [];
        const { data: cases } = await db.from("cbq_cases").select("id, title, section, part").in("id", caseIds);
        const { data: tasks } = await db.from("cbq_tasks").select("*").in("case_id", caseIds).order("seq");
        const responses = Object.fromEntries((await cbqState(att.id)).map((r: any) => [r.task_id, r.response]));
        const caseResults = (cases ?? []).map((c: any) => {
          const r = scoreCase(((tasks ?? []) as CbqTask[]).filter(t => t.case_id === c.id), responses);
          return { case_id: c.id, title: c.title, section: c.section, ...r };
        });
        const totalMarks = caseResults.reduce((s, c) => s + c.marks, 0);
        const totalAvail = caseResults.reduce((s, c) => s + c.available, 0) || 1;
        const cbqPct = Math.round((totalMarks / totalAvail) * 1000) / 10;
        const mcqPct = Number(att.mcq_score ?? 0);
        const scaled = scaledScore(mcqPct, cbqPct);
        const threshold = att.pass_threshold ?? 360;
        const passed = scaled >= threshold;
        const result = { mcq_pct: mcqPct, mcq_correct: att.mcq_correct, mcq_total: att.mcq_total, gate_passed: true, gate_pct: att.metadata?.gate_pct ?? GATE_PCT, cbq_pct: cbqPct, cbq_marks: totalMarks, cbq_available: totalAvail, cbq_cases: caseResults, scaled, passed, pass_threshold: threshold, by_section: att.metadata?.mcq_by_section ?? {}, mcq_review: att.metadata?.mcq_review ?? [], completed_at: new Date().toISOString() };
        await db.from("mock_attempts").update({ section: "completed", state: "completed", cbq_score: cbqPct, total_score: scaled, scaled_score: scaled, passed, submitted_at: new Date().toISOString(), completed_at: new Date().toISOString(), result }).eq("id", att.id);
        await db.rpc("increment_profile_counter", { p_user: userId, p_col: "total_mocks" }).then(() => {}, () => {});
        return json(200, { result });
      }

      case "result": {
        const att = await loadAttempt(body.attempt_id);
        return json(200, { result: att.result, state: att.state, section: att.section });
      }

      case "history": {
        const { data } = await db.from("mock_attempts").select("id, exam_id, state, section, started_at, completed_at, mcq_score, cbq_score, scaled_score, passed, mock_exams(title, exam)")
          .eq("user_id", userId).order("started_at", { ascending: false }).limit(25);
        return json(200, { attempts: data ?? [] });
      }

      case "abandon": {
        const att = await loadAttempt(body.attempt_id);
        await db.from("mock_attempts").update({ state: "abandoned", section: "completed" }).eq("id", att.id);
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: `Unknown action "${action}"` });
    }
  } catch (e) {
    console.error(e);
    return json(500, { error: String((e as any)?.message ?? e).slice(0, 300) });
  }
});
