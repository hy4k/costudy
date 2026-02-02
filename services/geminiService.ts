
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulate a backend RAG retrieval step
const performBackendVectorSearch = async (query: string): Promise<string> => {
    console.log(`[Backend Vector Search] Processing query: "${query}"`);
    // In a real app, this would query Supabase pgvector or Pinecone.
    // For simulation, we return relevant mock contexts.
    
    // Expanded Mock Vault for better context hit rate
    const mockVaultContexts: Record<string, string> = {
        'costing': "Joint costing involves allocating total costs incurred up to the split-off point. Common methods include Physical Measures, Sales Value at Split-off, and Net Realizable Value.",
        'abc': "Activity-Based Costing (ABC) assigns costs based on activities that drive costs rather than volume. It is more accurate for diverse product lines and helps identify non-value-added activities.",
        'ethics': "IMA Statement of Ethical Professional Practice includes: Competence, Confidentiality, Integrity, and Credibility. Resolution of ethical conflict involves following established policies and consulting with a supervisor.",
        'reporting': "External financial reporting must adhere to GAAP or IFRS. Key statements include Balance Sheet (Financial Position), Income Statement (Operations), and Statement of Cash Flows.",
        'variance': "Variance analysis compares actual results to budgeted (standard) performance. Favorable variances increase operating income; Unfavorable variances decrease it. Material variances must be investigated.",
        'internal': "Internal controls are processes designed to provide reasonable assurance regarding achievement of objectives in effectiveness/efficiency of operations, reliability of reporting, and compliance.",
        'risk': "COSO ERM Framework components: Governance & Culture, Strategy & Objective-Setting, Performance, Review & Revision, and Information, Communication, & Reporting."
    };

    const lowerQuery = query.toLowerCase();
    const key = Object.keys(mockVaultContexts).find(k => lowerQuery.includes(k));
    
    if (key) {
        return `[VAULT CONTEXT FOUND (${key.toUpperCase()}): ${mockVaultContexts[key]}]`;
    }

    return "[VAULT: No specific high-confidence match in 1GB index. Relying on general CMA expert knowledge.]";
};

export const getChatResponse = async (history: {role: string, content: string}[], newMessage: string, subjectContext: string, additionalContext?: string) => {
    try {
        // Step 1: Query Expansion (Context Awareness)
        // If the message is a short follow-up, append previous user context to the search query
        let searchQuery = newMessage;
        if (history.length > 0) {
             // Find last user message
             const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
             
             // Heuristic: If message is short (< 30 chars) or contains pronouns, likely a follow-up
             if (lastUserMsg && (newMessage.length < 30 || /\b(it|that|they|he|she|this|those)\b/i.test(newMessage))) {
                 searchQuery = `${lastUserMsg.content} ${newMessage}`;
                 console.log("[Context] Query Expanded for RAG:", searchQuery);
             }
        }

        // Step 2: Backend Retrieval (RAG)
        const retrievedContext = await performBackendVectorSearch(searchQuery);

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
    return generateStudyContent(
        `Summarize this study post into 3 short bullet points: ${postContent}`,
        "You are a helpful study assistant."
    );
}
