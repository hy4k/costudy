
import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";

// Lazily instantiated so importing this module never throws when no API key is
// configured at build/runtime — a synchronous throw here would blank-page the
// entire app. Each function grabs the client via getAi() inside its own try/catch.
let _ai: GoogleGenAI | null = null;
const getAi = (): GoogleGenAI => {
    if (!_ai) {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);
        if (!apiKey) throw new Error("AI features are not configured (missing API key).");
        _ai = new GoogleGenAI({ apiKey });
    }
    return _ai;
};

export const getChatResponse = async (
    history: {role: string, content: string}[],
    newMessage: string,
    subjectContext: string,
    additionalContext?: string,
    useThinking: boolean = false
) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: useThinking ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview',
            contents: [
                ...history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }]
                })),
                { role: 'user', parts: [{ text: newMessage }] }
            ],
            config: {
                thinkingConfig: useThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
                systemInstruction: `You are an expert AI Tutor in CoStudy.
                Subject Area: ${subjectContext}.
                ${additionalContext ? `Additional Context: ${additionalContext}` : ''}

                Keep answers concise, professional, and visually structured with markdown.
                Use emojis appropriately. Focus on helping the student understand the 'why' behind concepts.`
            }
        });

        return response.text;
    } catch (error) {
        console.error("Chat Error", error);
        return "Sorry, I'm experiencing a neural block. Try again in a moment.";
    }
}

export const getGroundedResponse = async (prompt: string) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return {
            text: response.text,
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) || []
        };
    } catch (error) {
        console.error("Grounded Search Error", error);
        return { text: "Search failed.", sources: [] };
    }
};

export const getMapsGroundedResponse = async (prompt: string, location?: {lat: number, lng: number}) => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined
                    }
                }
            },
        });
        return {
            text: response.text,
            places: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.maps).filter(Boolean) || []
        };
    } catch (error) {
        console.error("Maps Search Error", error);
        return { text: "Maps search failed.", places: [] };
    }
};

export const generateStudyImage = async (prompt: string): Promise<string | null> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Create a professional study diagram or visual aid for: ${prompt}. Clean, educational style.` }],
            },
            config: {
                imageConfig: { aspectRatio: "16:9" }
            }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Image Generation Error", error);
        return null;
    }
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAi();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Charon' },
                    },
                },
            },
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
        console.error("TTS Error", error);
        return null;
    }
};

export const generateStudyContent = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
        const ai = getAi();
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
    return generateStudyContent(
        `Summarize this study post into 3 short bullet points: ${postContent}`,
        "You are a helpful study assistant."
    );
}

/**
 * Lightweight AI study-tips helper for wrong MCQ answers from a completed mock
 * exam (replaces the old essay-grading `deepAnalyzeExam` — CBQ cases are scored
 * deterministically server-side by the mock-engine edge function, not by AI).
 * `wrongMcqs` should be the subset of `mcq_review` entries where correct === false.
 */
export const getMcqStudyTips = async (
  wrongMcqs: { id: string; selected: string; correct: boolean; explanation?: string; section?: string; topic?: string }[]
): Promise<string> => {
  if (!wrongMcqs || wrongMcqs.length === 0) {
    return "Great work — no incorrect MCQs to review!";
  }

  try {
    const ai = getAi();
    const prompt = `You are a CMA exam tutor. A student got the following MCQs wrong on a mock exam. For each, briefly explain the underlying concept they should revisit and one concrete way to study it. Keep it concise and encouraging.\n\n${wrongMcqs.map((q, i) => `${i + 1}. Section: ${q.section || 'N/A'} | Topic: ${q.topic || 'N/A'}\n   Explanation: ${q.explanation || 'N/A'}`).join('\n\n')}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a concise, encouraging CMA exam tutor. Respond in markdown with short, actionable study tips grouped by topic."
      }
    });

    return response.text || "Unable to generate study tips right now.";
  } catch (error) {
    console.error("MCQ Study Tips Error", error);
    return "AI study tips are unavailable right now. Please review the explanations above for each question.";
  }
};
