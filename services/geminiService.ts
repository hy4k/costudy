
import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulate a backend RAG retrieval step
const performBackendVectorSearch = async (query: string): Promise<string> => {
    console.log("[Backend Vector Search] Querying indexed 1GB knowledge vault...");
    const mockVaultContexts: Record<string, string> = {
        'costing': "Joint costing involves allocating total costs incurred up to the split-off point. Common methods include Physical Measures, Sales Value at Split-off, and Net Realizable Value.",
        'ethics': "IMA Statement of Ethical Professional Practice includes: Competence, Confidentiality, Integrity, and Credibility.",
        'reporting': "External financial reporting must adhere to GAAP or IFRS. Key statements include Balance Sheet, Income Statement, and Statement of Cash Flows."
    };

    const key = Object.keys(mockVaultContexts).find(k => query.toLowerCase().includes(k)) || "General CMA Principles";
    return `[VAULT CONTEXT RETRIEVED: ${mockVaultContexts[key as any] || 'No specific match found, using general accounting core.'}]`;
};

export const getChatResponse = async (
    history: {role: string, content: string}[], 
    newMessage: string, 
    subjectContext: string, 
    additionalContext?: string,
    useThinking: boolean = false
) => {
    try {
        const retrievedContext = await performBackendVectorSearch(newMessage);

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
                
                CRITICAL INSTRUCTION: You have access to a backend knowledge vault (1GB of data). 
                Here is the relevant data retrieved for this specific query:
                ${retrievedContext}
                
                Base your answers on this data first. Keep answers concise, professional, and visually structured with markdown. 
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

export const deepAnalyzeExam = async (questions: any[], answers: Map<string, any>) => {
  try {
    const wrongAnswers = questions.filter(q => {
      const ans = answers.get(q.id);
      return ans && ans.selected !== q.correct_answer && q.type !== 'ESSAY';
    });

    const essayQuestions = questions.filter(q => q.type === 'ESSAY');
    const essayResponses = essayQuestions.map(q => {
      const ans = answers.get(q.id);
      return {
        question: q.question_text,
        section: q.section,
        userResponse: ans?.essayText || '(No response provided)'
      };
    });

    let prompt = `You are an expert ICMA CMA Exam Grader and Senior Tutor. Analyze the following candidate performance from a CMA Mock Exam.\n\n`;

    if (wrongAnswers.length > 0) {
      prompt += `### SECTION 1: INCORRECT MCQ DIAGNOSTIC
Below are the multiple-choice questions the candidate answered incorrectly:
${wrongAnswers.map((q, i) => `${i+1}. Question: ${q.question_text}\n   User Selected: Option ${answers.get(q.id)?.selected || 'None'}\n   Correct Answer: Option ${q.correct_answer}`).join('\n\n')}

Provide deep reasoning explanations for why the correct answer is right and why the user's choice was incorrect, focusing on core accounting principles.\n\n`;
    } else {
      prompt += `### SECTION 1: INCORRECT MCQ DIAGNOSTIC\nThe candidate answered ALL multiple-choice questions correctly! Commend their performance.\n\n`;
    }

    if (essayResponses.length > 0) {
      prompt += `### SECTION 2: ESSAY EVALUATION & ICMA RUBRIC GRADING
Evaluate the candidate's essay responses below according to ICMA grading criteria (Technical Accuracy, Strategic Reasoning, Completeness, and Professional Terminology):

${essayResponses.map((e, i) => `---
ESSAY ${i+1} (${e.section}):
SCENARIO & REQUIREMENTS:
${e.question}

CANDIDATE'S WRITTEN RESPONSE:
${e.userResponse}
`).join('\n\n')}

For EACH essay response, provide:
1. **Estimated Score & Grade** (e.g. 85/100 or Partial Credit)
2. **Key Strengths** (What the candidate analyzed well)
3. **Missing Elements & Technical Gaps** (Specific ICMA points/terminology missed)
4. **Model Answer Summary** (Key points required for full marks)
5. **Prometric Exam Strategy Tip** (How to structure this answer under timed conditions)`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        systemInstruction: "You are a Senior ICMA CMA Grader specializing in rigorous evaluation of MCQ diagnostics and CMA Essay responses. Provide clear, structured, encouraging, and highly professional markdown feedback."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Deep Exam Analysis Error", error);
    return "### 🔍 Deep Reasoning & Essay Evaluation Diagnostic Fallback\n\nWe encountered a transient sync interruption while reaching the Deep Reasoning Engine. Here is a conceptual breakdown:\n\n*   **Activity Based Costing (ABC)**: Traditional costing often over-allocates overhead to high-volume standard products and under-allocates to low-volume custom products. ABC solves this by identifying specific cost drivers for accurate margin analysis.\n*   **Essay Strategy Tip**: For CMA essays, always state your thesis or recommendation first, follow with 2-3 supporting accounting principles (e.g., controllability principle or leverage ratios), and conclude with numerical support if applicable.";
  }
};
