/**
 * CoStudy API Service
 * Connects to the backend RAG API at api.costudy.in
 */

const API_BASE = (import.meta as any).env?.VITE_COSTUDY_API_URL || 'https://api.costudy.in';

interface SearchHit {
  document_id: string;
  page_number: number;
  chunk_index: number;
  similarity: number;
  content: string;
}

interface SearchResponse {
  ok: boolean;
  hits?: SearchHit[];
  error?: string;
}

interface AskResponse {
  ok: boolean;
  answer?: string;
  sources?: {
    document_id: string;
    page_number: number;
    chunk_index: number;
    similarity: number;
  }[];
  error?: string;
}

interface SummarizeResponse {
  ok: boolean;
  summary?: string;
  error?: string;
}

/**
 * Search the RAG vector database
 */
export async function ragSearch(
  query: string,
  options?: {
    topK?: number;
    threshold?: number;
    filterDoc?: string;
  }
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        topK: options?.topK || 10,
        threshold: options?.threshold || 0.75,
        filterDoc: options?.filterDoc || null,
      }),
    });

    const data = await response.json();
    return data;
  } catch (e) {
    console.error('RAG search error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Ask the CMA tutor with RAG context
 */
export async function askCMA(
  message: string,
  options?: {
    subject?: string;
    mode?: 'STANDARD' | 'FOLLOW_UP' | 'VAULT_REF';
    history?: { role: string; content: string }[];
    activeContext?: string;
    filterDoc?: string;
  }
): Promise<AskResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/ask-cma`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        subject: options?.subject,
        mode: options?.mode || 'STANDARD',
        history: options?.history || [],
        activeContext: options?.activeContext,
        filterDoc: options?.filterDoc,
      }),
    });

    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Ask CMA error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Summarize text using the API
 */
export async function summarizeText(text: string): Promise<SummarizeResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Summarize error:', e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<{ ok: boolean; env?: string }> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (e) {
    return { ok: false };
  }
}

export const costudyAPI = {
  search: ragSearch,
  askCMA,
  summarize: summarizeText,
  health: checkAPIHealth,
};
