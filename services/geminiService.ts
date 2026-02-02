
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Production API endpoint for vector search (RAG)
const COSTUDY_API_URL = 'https://api.costudy.in';

// Real backend RAG retrieval using api.costudy.in
const performBackendVectorSearch = async (query: string): Promise<string> => {
    console.log(`[Backend Vector Search] Processing query: "${query}"`);
    
    try {
        const response = await fetch(`${COSTUDY_API_URL}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                topK: 5
            })
        });

        if (!response.ok) {
            console.warn(`[RAG] API returned ${response.status}, falling back to general knowledge`);
            return "[VAULT: API unavailable. Relying on general CMA expert knowledge.]";
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Format retrieved chunks for context injection
            const contextChunks = data.results
                .map((r: any, i: number) => `[${i + 1}] ${r.content || r.text}`)
                .join('\n\n');
            
            return `[VAULT CONTEXT RETRIEVED - ${data.results.length} chunks]:\n${contextChunks}`;
        }

        return "[VAULT: No high-confidence matches found. Relying on general CMA expert knowledge.]";
    } catch (error) {
        console.error('[RAG] Vector search failed:', error);
        return "[VAULT: Search service unavailable. Relying on general CMA expert knowledge.]";
    }
};

// Alternative: Use the ask-cma endpoint for complete AI responses
export const askCMAExpert = async (message: string, history: {role: string, content: string}[] = []): Promise<string> => {
    try {
        const response = await fetch(`${COSTUDY_API_URL}/api/ask-cma`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.content
                }))
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        return data.response || data.answer || "I couldn't process that request.";
    } catch (error) {
        console.error('[CMA Expert] API call failed:', error);
        // Fall back to Gemini
        return null as any;
    }
};

export const getChatResponse = async (history: {role: string, content: string}[], newMessage: string, subjectContext: string, additionalContext?: string) => {
    try {
        // Step 1: Try the dedicated CMA API first (full RAG pipeline)
        const cmaResponse = await askCMAExpert(newMessage, history);
        if (cmaResponse) {
            return cmaResponse;
        }

        // Step 2: Query Expansion (Context Awareness) for fallback
        let searchQuery = newMessage;
        if (history.length > 0) {
             const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
             
             if (lastUserMsg && (newMessage.length < 30 || /\b(it|that|they|he|she|this|those)\b/i.test(newMessage))) {
                 searchQuery = `${lastUserMsg.content} ${newMessage}`;
                 console.log("[Context] Query Expanded for RAG:", searchQuery);
             }
        }

        // Step 3: Backend Retrieval (RAG) via api.costudy.in
        const retrievedContext = await performBackendVectorSearch(searchQuery);

        // Step 4: Gemini fallback with retrieved context
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [
                ...history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }]
                })),
                { role: 'user', parts: [{ text: newMessage }] }
            ],
            config: {
                systemInstruction: `You are an expert AI Tutor in CoStudy. 
                Subject Area: ${subjectContext}.
                ${additionalContext ? `Additional Context: ${additionalContext}` : ''}
                
                KNOWLEDGE VAULT DATA (RAG):
                ${retrievedContext}
                
                INSTRUCTIONS:
                1. Prioritize the "KNOWLEDGE VAULT DATA" if relevant.
                2. If the vault data is not relevant (e.g., retrieval failed for a follow-up), rely heavily on the CONVERSATION HISTORY and your general CMA US expertise.
                3. Maintain a continuous conversation. Remember previous definitions and context.
                4. Keep answers concise, professional, and visually structured (use Markdown).
                5. Use emojis appropriately to keep the tone engaging.`
            }
        });

        return response.text;
    } catch (error) {
        console.error("Chat Error", error);
        return "Sorry, I'm experiencing a neural block. Try again in a moment.";
    }
}

export const generateStudyContent = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text || "No content generated.";
  } catch (error) {
    console.error("API Error:", error);
    return "Error generating content.";
  }
};

export const summarizePost = async (postContent: string): Promise<string> => {
    // Try api.costudy.in summarize endpoint first
    try {
        const response = await fetch(`${COSTUDY_API_URL}/api/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: postContent })
        });

        if (response.ok) {
            const data = await response.json();
            return data.summary || data.result;
        }
    } catch (error) {
        console.warn('[Summarize] API unavailable, falling back to Gemini');
    }

    // Fallback to Gemini
    return generateStudyContent(
        `Summarize this study post into 3 short bullet points: ${postContent}`,
        "You are a helpful study assistant."
    );
}
