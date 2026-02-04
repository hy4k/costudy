
import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction, getEssayEvalInstruction, getTeacherSystemInstruction } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Production API endpoint for vector search (RAG)
const COSTUDY_API_URL = 'https://api.costudy.in';

// Real backend RAG retrieval using api.costudy.in
const performBackendVectorSearch = async (query: string): Promise<string> => {
    console.log(`[RAG] Searching CMA Databank for: "${query}"`);

    try {
        const response = await fetch(`${COSTUDY_API_URL}/api/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                topK: 8, // Fetch more context for better accuracy
                threshold: 0.7
            })
        });

        if (!response.ok) return "[VAULT: Databank connection jitter. Relying on master expertise.]";

        const data = await response.json();
        // The API returns 'hits' according to types, but we handle 'results' for legacy support
        const hits = data.hits || data.results || [];

        if (hits.length > 0) {
            const contextChunks = hits
                .map((r: any, i: number) => `[RELEVANT CMA MATERIAL - DOC: ${r.document_id || 'OFFICIAL_GUIDE'}]: ${r.content || r.text}`)
                .join('\n\n---\n\n');

            return `SOURCE MATERIAL FROM CMA US DATABANK:\n\n${contextChunks}`;
        }

        return "[VAULT: No specific document matches. Proceeding with core CMA logic.]";
    } catch (error) {
        console.error('[RAG] Vector search failed:', error);
        return "[VAULT: Databank offline. Using expert training data.]";
    }
};

// Alternative: Use the ask-cma endpoint for complete AI responses
export const askCMAExpert = async (message: string, history: { role: string, content: string }[] = []): Promise<string> => {
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

export const getChatResponse = async (history: { role: string, content: string }[], newMessage: string, subjectContext: string, additionalContext?: string) => {
    try {
        // Step 1: Query Expansion for better RAG retrieval
        let searchQuery = newMessage;
        if (history.length > 0) {
            const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
            if (lastUserMsg && (newMessage.length < 30 || /\b(it|that|they|he|she|this|those)\b/i.test(newMessage))) {
                searchQuery = `${lastUserMsg.content} ${newMessage}`;
            }
        }

        // Step 2: Fetch context from the backend CMA Databank (RAG)
        const retrievedContext = await performBackendVectorSearch(searchQuery);

        // Step 3: Use Gemini with Mastermind persona + Databank context
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
                systemInstruction: getSystemInstruction(subjectContext, additionalContext, retrievedContext)
            }
        });

        return response.text;
    } catch (error) {
        console.error("Mastermind Chat Error", error);

        // Final fallback to the basic backend ask-cma if Gemini fails
        try {
            const fallback = await askCMAExpert(newMessage, history);
            if (fallback) return fallback;
        } catch (e) { }

        return "I'm experiencing a brief strategic blackout. Please re-state your query, future CMA.";
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

export const evaluateEssay = async (essayContent: string, subject: string): Promise<string> => {
    try {
        // Step 1: Specifically search the databank for "Rubrics" related to the essay topic
        // We use the first 100 chars of the essay to guess the topic for the RAG search
        const topicClue = essayContent.substring(0, 150);
        const rubricContext = await performBackendVectorSearch(`IMA official essay rubric for ${topicClue}`);

        // Step 2: Generate evaluation using the specialized Essay Auditor instruction
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ role: 'user', parts: [{ text: `STUDENT ESSAY SUBMISSION:\n\n${essayContent}` }] }],
            config: {
                systemInstruction: getEssayEvalInstruction(subject, rubricContext)
            }
        });

        return response.text;
    } catch (error) {
        console.error("Essay Eval Error", error);
        return "The Mastermind Auditor is temporarily unavailable. Please preserve your essay and try again in a few minutes.";
    }
};

export const getTeacherResponse = async (history: { role: string, content: string }[], newMessage: string, subject: string, toolContext?: string) => {
    try {
        // Step 1: Fetch pedagogical context from the databank (RAG)
        const retrievedContext = await performBackendVectorSearch(newMessage);

        // Step 2: Use Gemini with Teacher Mastermind persona
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
                systemInstruction: getTeacherSystemInstruction(subject, toolContext, retrievedContext)
            }
        });

        return response.text;
    } catch (error) {
        console.error("Teacher Mastermind Error", error);
        return "The Teacher Mastermind is briefly off-line for a faculty meeting. Please retry your query.";
    }
}

export const generateTeachingResource = async (subject: string, type: 'LESSON_PLAN' | 'MCQ' | 'CASE_STUDY' | 'RUBRIC', topic: string): Promise<string> => {
    try {
        const prompt = `Generate a professional ${type} for the CMA US topic: "${topic}".`;
        const retrievedContext = await performBackendVectorSearch(topic);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: getTeacherSystemInstruction(subject, type, retrievedContext)
            }
        });

        return response.text;
    } catch (error) {
        console.error("Resource Generation Error", error);
        return "Failed to generate resource.";
    }
};

