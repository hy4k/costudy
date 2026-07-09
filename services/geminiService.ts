import { supabase } from "./supabaseClient";

/**
 * CoStudy AI client — single RAG path.
 * All chat/tutor calls go to /api/ask-cma (backend embeds + retrieves + answers).
 * Do NOT pre-call /api/search from the client for chat (that doubles OpenAI cost).
 */
const COSTUDY_API_URL =
  (import.meta as any).env?.VITE_COSTUDY_API_URL || "https://api.costudy.in";

type ChunkType = "mcq_question" | "mcq_answer" | "essay" | "other" | null;
type ChatMode = "STANDARD" | "FOLLOW_UP" | "VAULT_REF";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function friendlyAiError(status: number, body: any): string {
  const code = body?.error || "";
  if (code === "openai_quota" || status === 503) {
    return (
      body?.details ||
      "AI quota is exhausted on the server. The host needs an active OpenAI billing plan (or a working key)."
    );
  }
  if (code === "rate_limited" || status === 429) {
    return "Too many AI requests. Please wait a moment and try again.";
  }
  if (code === "openai_auth") {
    return "AI service configuration error (invalid API key). Contact support.";
  }
  return body?.details || body?.error || `AI request failed (${status}).`;
}

/** Library search only (Vault) — not used for chat */
export async function searchVault(
  query: string,
  options?: { topK?: number; threshold?: number; chunkType?: ChunkType }
): Promise<{ ok: boolean; hits?: any[]; error?: string }> {
  try {
    const response = await fetch(`${COSTUDY_API_URL}/api/search`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        query,
        topK: options?.topK ?? 10,
        threshold: options?.threshold ?? 0.55,
        chunkType: options?.chunkType ?? null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: friendlyAiError(response.status, data) };
    }
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Single-call CMA tutor with server-side RAG.
 */
export const askCMAExpert = async (
  message: string,
  history: { role: string; content: string }[] = [],
  options?: {
    subject?: string;
    mode?: ChatMode;
    activeContext?: string;
    filterDoc?: string;
    skipRag?: boolean;
  }
): Promise<string> => {
  try {
    const response = await fetch(`${COSTUDY_API_URL}/api/ask-cma`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        message,
        history: history.map((h) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content,
        })),
        subject: options?.subject,
        mode: options?.mode || "STANDARD",
        activeContext: options?.activeContext,
        filterDoc: options?.filterDoc,
        skipRag: options?.skipRag === true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return friendlyAiError(response.status, data);
    }
    return data.answer || data.response || "I couldn't process that request.";
  } catch (error) {
    console.error("[CMA Expert] API call failed:", error);
    return "The CoStudy AI backend is temporarily unavailable. Please try again.";
  }
};

/**
 * Mastermind chat — ONE network call (backend owns RAG).
 */
export const getChatResponse = async (
  history: { role: string; content: string }[],
  newMessage: string,
  subjectContext: string,
  additionalContext?: string
) => {
  try {
    let mode: ChatMode = "STANDARD";
    let activeContext: string | undefined;

    const extra = (additionalContext || "").trim();
    if (/VAULT|library sources|Knowledge Vault/i.test(extra)) {
      mode = "VAULT_REF";
    }
    const studyMatch = extra.match(/STUDY CONTEXT:\s*([\s\S]*)/i);
    if (studyMatch?.[1]?.trim()) {
      mode = "FOLLOW_UP";
      activeContext = studyMatch[1].trim().slice(0, 2000);
    }

    // Keep only recent turns for payload size (server also trims)
    const recent = history
      .filter((m) => m.role === "user" || m.role === "model" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    return await askCMAExpert(newMessage, recent, {
      subject: subjectContext,
      mode,
      activeContext,
    });
  } catch (error) {
    console.error("Mastermind Chat Error", error);
    return "I'm experiencing a brief strategic blackout. Please re-state your query.";
  }
};

export const generateStudyContent = async (
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  try {
    const composed = [systemInstruction, prompt].filter(Boolean).join("\n\n");
    // Generation tools still use RAG (materials-grounded notes/flashcards)
    return await askCMAExpert(composed, [], { mode: "STANDARD" });
  } catch (error) {
    console.error("API Error:", error);
    return "Error generating content.";
  }
};

export const summarizePost = async (postContent: string): Promise<string> => {
  try {
    const response = await fetch(`${COSTUDY_API_URL}/api/summarize`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text: postContent }),
    });
    const data = await response.json();
    if (response.ok) {
      return data.summary || data.result || "Summary unavailable.";
    }
    return friendlyAiError(response.status, data);
  } catch {
    return "Summary service is temporarily unavailable. Please retry.";
  }
};

export const evaluateEssay = async (
  essayContent: string,
  subject: string
): Promise<string> => {
  try {
    const backendResponse = await fetch(`${COSTUDY_API_URL}/api/essay/evaluate`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        essay: essayContent,
        topic: essayContent.substring(0, 150),
        subject,
      }),
    });

    const data = await backendResponse.json();
    if (backendResponse.ok && data.evaluation) {
      return data.evaluation;
    }
    return friendlyAiError(backendResponse.status, data);
  } catch (error) {
    console.error("Essay Eval Error", error);
    return "The essay auditor is temporarily unavailable. Please preserve your essay and try again.";
  }
};

export const fetchMCQPractice = async (
  topic: string,
  count: number = 5
): Promise<{
  questions: Array<{ id: string; content: string; question_no: string | null }>;
  answers: Array<{ content: string; question_no: string | null }>;
}> => {
  try {
    const response = await fetch(`${COSTUDY_API_URL}/api/mcq/practice`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ topic, count }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        questions: data.questions || [],
        answers: data.answers || [],
      };
    }
  } catch (error) {
    console.error("[MCQ] Practice fetch failed:", error);
  }

  return { questions: [], answers: [] };
};

export const getTeacherResponse = async (
  history: { role: string; content: string }[],
  newMessage: string,
  subject: string,
  toolContext?: string
) => {
  try {
    const teacherPrompt = [
      `You are responding as CoStudy teacher assistant for subject: ${subject}.`,
      toolContext ? `Tool context: ${toolContext}` : "",
      `Teacher message: ${newMessage}`,
    ]
      .filter(Boolean)
      .join("\n");
    const recent = history.slice(-10).map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    }));
    return await askCMAExpert(teacherPrompt, recent, { subject });
  } catch (error) {
    console.error("Teacher Mastermind Error", error);
    return "The Teacher Mastermind is briefly offline. Please retry.";
  }
};

export const generateTeachingResource = async (
  subject: string,
  type: "LESSON_PLAN" | "MCQ" | "CASE_STUDY" | "RUBRIC",
  topic: string
): Promise<string> => {
  try {
    const prompt = `Generate a professional ${type} for CMA US topic "${topic}" under subject "${subject}".`;
    return await askCMAExpert(prompt, [], { subject });
  } catch (error) {
    console.error("Resource Generation Error", error);
    return "Failed to generate resource.";
  }
};
