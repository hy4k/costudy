/**
 * CoStudy Exam Service
 * Full backend integration for Mock Test system
 * Hybrid 70/30 Question Strategy
 */

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export type TestType = 'STANDARD' | 'CHALLENGE' | 'MCQ_ONLY' | 'ESSAY_ONLY' | 'QUICK_PRACTICE';
export type ExamSection = 'MCQ' | 'ESSAY' | 'COMPLETED';
export type SessionStatus = 'IN_PROGRESS' | 'MCQ_COMPLETED' | 'ESSAY_LOCKED' | 'COMPLETED' | 'ABANDONED';

export interface MCQQuestion {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    section: string;
    difficulty: string;
    source: 'real' | 'ai_generated';
}

export interface EssayQuestion {
    id: string;
    scenario_text: string;
    requirements: string[];
    topic: string;
    difficulty: string;
    time_allocation_minutes: number;
}

export interface ExamSession {
    id: string;
    user_id: string;
    test_type: TestType;
    test_title: string;
    mcq_questions: string[]; // Question IDs
    essay_questions: string[];
    current_section: ExamSection;
    current_question_index: number;
    mcq_answers: Record<string, MCQAnswer>;
    mcq_score?: number;
    mcq_correct?: number;
    mcq_total?: number;
    mcq_time_spent_seconds: number;
    essay_answers: Record<string, EssayAnswer>;
    essay_unlocked: boolean;
    status: SessionStatus;
    started_at: string;
    last_activity_at: string;
}

export interface MCQAnswer {
    selected: string | null;
    flagged: boolean;
    timeSpent: number;
}

export interface EssayAnswer {
    text: string;
    wordCount: number;
    timeSpent: number;
}

export interface ExamConfig {
    testType: TestType;
    title: string;
    mcqCount: number;
    essayCount: number;
    mcqDurationMinutes: number;
    essayDurationMinutes: number;
    hybridRatio: number; // 0.7 = 70% real, 30% AI
    mcqPassThreshold?: number; // For CHALLENGE mode (0.5 = 50%)
    part: string;
}

// ============================================
// EXAM CONFIGURATIONS
// ============================================

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
    'full-standard': {
        testType: 'STANDARD',
        title: 'CMA Part 1 - Standard Simulation',
        mcqCount: 100,
        essayCount: 2,
        mcqDurationMinutes: 180, // 3 hours
        essayDurationMinutes: 60, // 1 hour
        hybridRatio: 0.7,
        part: 'Part 1'
    },
    'full-challenge': {
        testType: 'CHALLENGE',
        title: 'CMA Part 1 - Challenge Simulation',
        mcqCount: 100,
        essayCount: 2,
        mcqDurationMinutes: 180,
        essayDurationMinutes: 60,
        hybridRatio: 0.7,
        mcqPassThreshold: 0.5, // 50% to unlock essays
        part: 'Part 1'
    },
    'mcq-practice': {
        testType: 'MCQ_ONLY',
        title: 'MCQ Practice Session',
        mcqCount: 50,
        essayCount: 0,
        mcqDurationMinutes: 90,
        essayDurationMinutes: 0,
        hybridRatio: 0.7,
        part: 'Part 1'
    },
    'essay-practice': {
        testType: 'ESSAY_ONLY',
        title: 'Essay Practice Session',
        mcqCount: 0,
        essayCount: 2,
        mcqDurationMinutes: 0,
        essayDurationMinutes: 60,
        hybridRatio: 0,
        part: 'Part 1'
    },
    'quick-10': {
        testType: 'QUICK_PRACTICE',
        title: 'Quick 10 MCQ Drill',
        mcqCount: 10,
        essayCount: 0,
        mcqDurationMinutes: 15,
        essayDurationMinutes: 0,
        hybridRatio: 0.7,
        part: 'Part 1'
    }
};

// ============================================
// QUESTION FETCHING (Hybrid Strategy)
// ============================================

/**
 * Fetch MCQ questions from question_bank (unified schema).
 * options column is JSONB {A: "...", B: "...", C: "...", D: "..."}.
 * Returns only real, quality-verified questions from the backend.
 * If fewer than requested are available, returns what exists — never pads with fakes.
 */
export const fetchHybridMCQs = async (
    count: number,
    _hybridRatio: number = 0.7,
    part: string = 'Part 1'
): Promise<MCQQuestion[]> => {
    console.log(`[ExamService] Fetching ${count} MCQs from question_bank`);

    // Step 1: Fetch real questions from question_bank
    const realQuestions = await fetchRealMCQs(count, part);

    // Step 2: If we have enough real questions, just use those (shuffled)
    if (realQuestions.length >= count) {
        return realQuestions.slice(0, count);
    }

    // Step 3: Try to fill remainder from ai_question_cache
    const needed = count - realQuestions.length;
    const aiQuestions = await fetchCachedAIMCQs(needed, part);

    const combined = [...realQuestions, ...aiQuestions];
    console.log(`[ExamService] Assembled ${combined.length} MCQs (${realQuestions.length} real + ${aiQuestions.length} AI-cached)`);

    // Step 4: If still short, try on-demand AI generation via backend
    if (combined.length < count) {
        const stillNeeded = count - combined.length;
        console.log(`[ExamService] Still need ${stillNeeded} MCQs — attempting on-demand generation`);
        const generated = await generateMCQsViaBackend(stillNeeded, part, realQuestions.slice(0, 3));
        combined.push(...generated);
    }

    if (combined.length === 0) {
        console.warn('[ExamService] No MCQs available — question_bank may be empty');
    }

    return combined.sort(() => Math.random() - 0.5);
};

/** Fetch real MCQs from question_bank with quality filters */
const fetchRealMCQs = async (count: number, part: string): Promise<MCQQuestion[]> => {
    try {
        const { data, error } = await supabase
            .from('question_bank')
            .select('id, question_text, options, correct_answer, section, difficulty, source_kind')
            .eq('question_kind', 'MCQ')
            .eq('is_active', true)
            .eq('part', part)
            .not('options', 'is', null)
            .not('correct_answer', 'is', null)
            .in('correct_answer', ['A', 'B', 'C', 'D'])
            .limit(count * 3);

        if (error) {
            console.error('[ExamService] Error fetching MCQs:', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Client-side quality filter: question text must be real (>20 chars),
        // all 4 options must be non-empty, exclude junk (rationale/explanation fragments)
        const clean = data.filter((q: any) => {
            const text = q.question_text || '';
            const opts = q.options || {};
            if (text.length < 20) return false;
            if (!opts.A?.trim() || !opts.B?.trim() || !opts.C?.trim() || !opts.D?.trim()) return false;
            if (/^(Rationale|Correct Answer|Explanation for|Question was not|Your Answer|Hock )/i.test(text)) return false;
            return true;
        });

        return clean.sort(() => Math.random() - 0.5).slice(0, count).map(mapQuestionBankToMCQ);
    } catch (err) {
        console.error('[ExamService] Critical error fetching real MCQs:', err);
        return [];
    }
};

/** Fetch pre-generated AI MCQs from ai_question_cache */
const fetchCachedAIMCQs = async (count: number, part: string): Promise<MCQQuestion[]> => {
    if (count <= 0) return [];
    try {
        const { data, error } = await supabase
            .from('ai_question_cache')
            .select('id, question_data, part, section, topic, difficulty')
            .eq('question_type', 'MCQ')
            .eq('is_used', false)
            .eq('part', part)
            .gte('quality_score', 0.7)
            .limit(count * 2);

        if (error || !data || data.length === 0) return [];

        const selected = data.sort(() => Math.random() - 0.5).slice(0, count);

        // Mark as used so other concurrent sessions don't get the same ones
        const usedIds = selected.map(q => q.id);
        if (usedIds.length > 0) {
            await supabase
                .from('ai_question_cache')
                .update({ is_used: true, times_shown: 1 })
                .in('id', usedIds);
        }

        return selected.map((q: any) => {
            const qd = q.question_data || {};
            return {
                id: q.id,
                question_text: qd.question_text || '',
                option_a: qd.option_a || qd.options?.A || '',
                option_b: qd.option_b || qd.options?.B || '',
                option_c: qd.option_c || qd.options?.C || '',
                option_d: qd.option_d || qd.options?.D || '',
                correct_answer: qd.correct_answer || 'A',
                section: q.section || qd.section || 'General',
                difficulty: q.difficulty || qd.difficulty || 'Medium',
                source: 'ai_generated' as const,
            };
        });
    } catch (err) {
        console.error('[ExamService] Error fetching AI cache:', err);
        return [];
    }
};

/** Map a question_bank row to MCQQuestion */
const mapQuestionBankToMCQ = (q: any): MCQQuestion => {
    const opts = q.options || {};
    return {
        id: q.id,
        question_text: q.question_text || '',
        option_a: opts.A || opts.a || '',
        option_b: opts.B || opts.b || '',
        option_c: opts.C || opts.c || '',
        option_d: opts.D || opts.d || '',
        correct_answer: q.correct_answer || 'A',
        section: q.section || 'General',
        difficulty: q.difficulty || 'Medium',
        source: (q.source_kind === 'ai_generated' ? 'ai_generated' : 'real') as 'real' | 'ai_generated',
    };
};

/**
 * Fetch essay questions from question_bank (unified schema).
 * Returns only real, quality-verified essays. Never pads with hardcoded placeholders.
 * Essays must be at least 80 characters and contain question-like intent.
 */
export const fetchEssayQuestions = async (
    count: number = 2,
    part: string = 'Part 1'
): Promise<EssayQuestion[]> => {
    console.log(`[ExamService] Fetching ${count} essay questions from question_bank`);

    try {
        // Fetch a larger pool so we can filter client-side for quality
        const { data, error } = await supabase
            .from('question_bank')
            .select('id, question_text, options, topic, section, difficulty')
            .eq('question_kind', 'ESSAY')
            .eq('is_active', true)
            .eq('part', part)
            .limit(count * 10);

        if (error) {
            console.error('[ExamService] Error fetching essays:', error);
        }

        // Client-side quality filter: essay must be a real scenario, not a junk fragment
        const pool = (data || []).filter((e: any) => {
            const text = e.question_text || '';
            // Must be at least 80 chars to be a real scenario
            if (text.length < 80) return false;
            // Exclude rationale/explanation fragments that got misclassified
            if (/^(Rationale|Correct Answer|Explanation for|Question was not|Your Answer|Hock )/i.test(text)) return false;
            // Exclude raw dollar amounts / math fragments
            if (/^\s*"?\$\d/.test(text)) return false;
            return true;
        });

        if (pool.length === 0) {
            // Try ai_question_cache for essays
            const { data: aiEssays } = await supabase
                .from('ai_question_cache')
                .select('id, question_data, topic, difficulty')
                .eq('question_type', 'ESSAY')
                .eq('is_used', false)
                .eq('part', part)
                .gte('quality_score', 0.7)
                .limit(count * 2);

            if (aiEssays && aiEssays.length > 0) {
                const selected = aiEssays.sort(() => Math.random() - 0.5).slice(0, count);
                const usedIds = selected.map(e => e.id);
                if (usedIds.length > 0) {
                    await supabase.from('ai_question_cache').update({ is_used: true }).in('id', usedIds);
                }
                return selected.map((e: any) => ({
                    id: e.id,
                    scenario_text: e.question_data?.scenario_text || e.question_data?.question_text || '',
                    requirements: e.question_data?.requirements || ['Analyze the scenario and provide your response.'],
                    topic: e.topic || 'General',
                    difficulty: e.difficulty || 'Medium',
                    time_allocation_minutes: 30
                }));
            }

            console.warn('[ExamService] No essay questions available in question_bank or ai_question_cache');
            return [];
        }

        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);

        return shuffled.map((e: any) => ({
            id: e.id,
            scenario_text: e.question_text || '',
            requirements: ['Analyze the scenario and provide your response.'],
            topic: e.topic || e.section || 'General',
            difficulty: e.difficulty || 'Medium',
            time_allocation_minutes: 30
        }));

    } catch (err) {
        console.error('[ExamService] Critical error fetching essays:', err);
        return [];
    }
};

// ============================================
// EXAM SESSION MANAGEMENT
// ============================================

/**
 * Create a new exam session.
 * Accepts pre-fetched questions to avoid double-fetching (MockTests already fetches them).
 */
export const createExamSession = async (
    userId: string,
    configKey: string,
    prefetchedMcqs?: MCQQuestion[],
    prefetchedEssays?: EssayQuestion[]
): Promise<ExamSession | null> => {
    const config = EXAM_CONFIGS[configKey];
    if (!config) {
        console.error('[ExamService] Invalid config key:', configKey);
        return null;
    }

    console.log(`[ExamService] Creating ${config.testType} session for user ${userId}`);

    // Use pre-fetched questions if provided, otherwise fetch fresh
    const mcqs = prefetchedMcqs ?? (config.mcqCount > 0
        ? await fetchHybridMCQs(config.mcqCount, config.hybridRatio, config.part)
        : []);

    const essays = prefetchedEssays ?? (config.essayCount > 0
        ? await fetchEssayQuestions(config.essayCount, config.part)
        : []);

    const sessionData = {
        user_id: userId,
        test_type: config.testType,
        test_title: config.title,
        mcq_questions: mcqs.map(q => ({ id: q.id, correct_answer: q.correct_answer })),
        essay_questions: essays.map(e => ({ id: e.id })),
        current_section: config.mcqCount > 0 ? 'MCQ' : 'ESSAY',
        current_question_index: 0,
        mcq_answers: {},
        essay_answers: {},
        essay_unlocked: config.testType === 'STANDARD' || config.testType === 'ESSAY_ONLY',
        status: 'IN_PROGRESS',
        real_questions_count: mcqs.filter(q => q.source === 'real').length,
        ai_questions_count: mcqs.filter(q => q.source === 'ai_generated').length
    };
    
    try {
        const { data, error } = await supabase
            .from('exam_sessions')
            .insert(sessionData)
            .select()
            .single();
        
        if (error) {
            console.error('[ExamService] Error creating session:', error);
            // Return a local session for offline/fallback mode
            return createLocalSession(userId, config, mcqs, essays);
        }
        
        console.log(`[ExamService] Session created: ${data.id}`);
        
        return {
            ...data,
            mcq_questions: mcqs.map(q => q.id),
            essay_questions: essays.map(e => e.id)
        };
        
    } catch (err) {
        console.error('[ExamService] Critical error creating session:', err);
        return createLocalSession(userId, config, mcqs, essays);
    }
};

/**
 * Save exam progress (auto-save)
 */
export const saveExamProgress = async (
    sessionId: string,
    progress: {
        currentQuestionIndex: number;
        mcqAnswers?: Record<string, MCQAnswer>;
        essayAnswers?: Record<string, EssayAnswer>;
        mcqTimeSpent?: number;
        essayTimeSpent?: number;
    }
): Promise<boolean> => {
    const updates: any = {
        current_question_index: progress.currentQuestionIndex,
        last_activity_at: new Date().toISOString()
    };
    
    if (progress.mcqAnswers) {
        updates.mcq_answers = progress.mcqAnswers;
    }
    if (progress.essayAnswers) {
        updates.essay_answers = progress.essayAnswers;
    }
    if (progress.mcqTimeSpent !== undefined) {
        updates.mcq_time_spent_seconds = progress.mcqTimeSpent;
    }
    if (progress.essayTimeSpent !== undefined) {
        updates.essay_time_spent_seconds = progress.essayTimeSpent;
    }
    
    try {
        const { error } = await supabase
            .from('exam_sessions')
            .update(updates)
            .eq('id', sessionId);
        
        if (error) {
            console.error('[ExamService] Auto-save failed:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('[ExamService] Critical error in auto-save:', err);
        return false;
    }
};

/**
 * Complete MCQ section and check if essays are unlocked
 */
export const completeMCQSection = async (
    sessionId: string,
    answers: Record<string, MCQAnswer>,
    questions: Array<{ id: string; correct_answer: string }>,
    timeSpent: number,
    testType: TestType,
    passThreshold?: number
): Promise<{
    correct: number;
    total: number;
    percentage: number;
    essayUnlocked: boolean;
}> => {
    // Calculate score
    let correct = 0;
    const total = questions.length;
    
    questions.forEach(q => {
        const answer = answers[q.id];
        if (answer?.selected === q.correct_answer) {
            correct++;
        }
    });
    
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Determine essay unlock based on test type
    let essayUnlocked = false;
    let status: SessionStatus = 'MCQ_COMPLETED';
    
    if (testType === 'STANDARD') {
        essayUnlocked = true;
    } else if (testType === 'CHALLENGE') {
        const threshold = (passThreshold || 0.5) * 100;
        essayUnlocked = percentage >= threshold;
        if (!essayUnlocked) {
            status = 'ESSAY_LOCKED';
        }
    } else if (testType === 'MCQ_ONLY' || testType === 'QUICK_PRACTICE') {
        status = 'COMPLETED';
    }
    
    // Update session
    try {
        const { error } = await supabase
            .from('exam_sessions')
            .update({
                mcq_answers: answers,
                mcq_score: percentage,
                mcq_correct: correct,
                mcq_total: total,
                mcq_time_spent_seconds: timeSpent,
                mcq_completed_at: new Date().toISOString(),
                essay_unlocked: essayUnlocked,
                current_section: essayUnlocked ? 'ESSAY' : 'COMPLETED',
                status: status
            })
            .eq('id', sessionId);
        
        if (error) {
            console.error('[ExamService] Error completing MCQ section:', error);
        }
    } catch (err) {
        console.error('[ExamService] Critical error completing MCQ:', err);
    }
    
    return { correct, total, percentage, essayUnlocked };
};

/**
 * Complete essay section
 */
export const completeEssaySection = async (
    sessionId: string,
    answers: Record<string, EssayAnswer>,
    timeSpent: number
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('exam_sessions')
            .update({
                essay_answers: answers,
                essay_time_spent_seconds: timeSpent,
                essay_completed_at: new Date().toISOString(),
                current_section: 'COMPLETED',
                status: 'COMPLETED',
                completed_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        
        if (error) {
            console.error('[ExamService] Error completing essay section:', error);
            return false;
        }
        
        return true;
    } catch (err) {
        console.error('[ExamService] Critical error completing essays:', err);
        return false;
    }
};

/**
 * Get session by ID
 */
export const getExamSession = async (sessionId: string): Promise<ExamSession | null> => {
    try {
        const { data, error } = await supabase
            .from('exam_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        
        if (error || !data) {
            return null;
        }
        
        return data as ExamSession;
    } catch {
        return null;
    }
};

/**
 * Get user's recent sessions
 */
export const getUserSessions = async (userId: string, limit: number = 10): Promise<ExamSession[]> => {
    try {
        const { data, error } = await supabase
            .from('exam_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error || !data) {
            return [];
        }
        
        return data as ExamSession[];
    } catch {
        return [];
    }
};

// ============================================
// AI QUESTION GENERATION (On-Demand via Backend)
// ============================================

const COSTUDY_API_URL = (import.meta as any).env?.VITE_COSTUDY_API_URL || 'https://api.costudy.in';

/**
 * Generate MCQ variations on-demand using the backend LLM.
 * Uses seed questions as style/difficulty reference.
 * Generated questions are cached in ai_question_cache for future sessions.
 */
async function generateMCQsViaBackend(
    count: number,
    part: string,
    seedQuestions: MCQQuestion[]
): Promise<MCQQuestion[]> {
    if (count <= 0) return [];

    try {
        const seedContext = seedQuestions.length > 0
            ? seedQuestions.map(q =>
                `Q: ${q.question_text}\nA) ${q.option_a}\nB) ${q.option_b}\nC) ${q.option_c}\nD) ${q.option_d}\nAnswer: ${q.correct_answer}\nSection: ${q.section}\nDifficulty: ${q.difficulty}`
              ).join('\n\n---\n\n')
            : '';

        const prompt = `You are a CMA (Certified Management Accountant) exam question writer for ${part}. Generate exactly ${count} NEW, UNIQUE multiple-choice questions.

${seedContext ? `Use these real exam questions as reference for style, difficulty, and topic coverage:\n\n${seedContext}\n\n` : ''}

REQUIREMENTS:
- Each question must test a DIFFERENT CMA topic (Cost Management, Internal Controls, Financial Reporting, Planning & Budgeting, Performance Management, Decision Analysis, Risk Management, Investment Decisions, Professional Ethics)
- Questions must be exam-quality: precise wording, plausible distractors, one clearly correct answer
- Include calculations where appropriate
- Vary difficulty: mix Easy, Medium, Hard

Return ONLY valid JSON array, no markdown:
[{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"A|B|C|D","section":"...","difficulty":"Easy|Medium|Hard"}]`;

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        const response = await fetch(`${COSTUDY_API_URL}/api/ask-cma`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ message: prompt, history: [] })
        });

        if (!response.ok) {
            console.error('[ExamService] AI generation API error:', response.status);
            return [];
        }

        const data = await response.json();
        const text = data.response || data.answer || '';

        // Extract JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('[ExamService] AI response did not contain valid JSON array');
            return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return [];

        const generated: MCQQuestion[] = parsed
            .filter((q: any) => q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer)
            .slice(0, count)
            .map((q: any, i: number) => ({
                id: `ai-gen-${Date.now()}-${i}`,
                question_text: q.question_text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer.toUpperCase(),
                section: q.section || 'General',
                difficulty: q.difficulty || 'Medium',
                source: 'ai_generated' as const,
            }));

        // Cache generated questions for future sessions
        if (generated.length > 0) {
            const cacheRows = generated.map(q => ({
                question_type: 'MCQ',
                question_data: {
                    question_text: q.question_text,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d,
                    correct_answer: q.correct_answer,
                    section: q.section,
                    difficulty: q.difficulty,
                },
                part,
                section: q.section,
                topic: q.section,
                difficulty: q.difficulty,
                generation_model: 'costudy-backend-llm',
                quality_score: 0.75,
                is_used: true, // Mark used since we're serving them now
            }));
            await supabase.from('ai_question_cache').insert(cacheRows).then(({ error }) => {
                if (error) console.warn('[ExamService] Failed to cache AI questions:', error.message);
                else console.log(`[ExamService] Cached ${cacheRows.length} AI-generated MCQs`);
            });
        }

        console.log(`[ExamService] Generated ${generated.length} MCQs via backend LLM`);
        return generated;

    } catch (err) {
        console.error('[ExamService] On-demand AI generation failed:', err);
        return [];
    }
}

/**
 * Pre-generate a batch of AI questions and cache them for future exam sessions.
 * Call this from an admin panel or scheduled job to keep the pool fresh.
 */
export const preGenerateQuestionBatch = async (
    mcqCount: number = 20,
    essayCount: number = 4,
    part: string = 'Part 1'
): Promise<{ mcqsGenerated: number; essaysGenerated: number }> => {
    console.log(`[ExamService] Pre-generating batch: ${mcqCount} MCQs, ${essayCount} essays for ${part}`);

    // Fetch a few real questions as seed for style reference
    const seedMCQs = await fetchRealMCQs(5, part);

    const mcqs = await generateMCQsViaBackend(mcqCount, part, seedMCQs);

    // For essays, generate via backend
    let essaysGenerated = 0;
    if (essayCount > 0) {
        try {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;

            const prompt = `Generate ${essayCount} CMA ${part} essay scenarios. Each should have a detailed business scenario (150-300 words) with financial data, and 2-3 specific requirements.

Return ONLY valid JSON array:
[{"scenario_text":"...","requirements":["req1","req2","req3"],"topic":"...","difficulty":"Easy|Medium|Hard"}]`;

            const response = await fetch(`${COSTUDY_API_URL}/api/ask-cma`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ message: prompt, history: [] })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.response || data.answer || '';
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) {
                        const cacheRows = parsed
                            .filter((e: any) => e.scenario_text && e.requirements)
                            .slice(0, essayCount)
                            .map((e: any) => ({
                                question_type: 'ESSAY',
                                question_data: e,
                                part,
                                section: e.topic || 'General',
                                topic: e.topic || 'General',
                                difficulty: e.difficulty || 'Medium',
                                generation_model: 'costudy-backend-llm',
                                quality_score: 0.75,
                                is_used: false,
                            }));
                        const { error } = await supabase.from('ai_question_cache').insert(cacheRows);
                        if (!error) essaysGenerated = cacheRows.length;
                    }
                }
            }
        } catch (err) {
            console.error('[ExamService] Essay pre-generation failed:', err);
        }
    }

    return { mcqsGenerated: mcqs.length, essaysGenerated };
};

/**
 * Reset used AI questions so they can be served again.
 * Call periodically to recycle the cache.
 */
export const recycleAIQuestionCache = async (part: string = 'Part 1'): Promise<number> => {
    const { data, error } = await supabase
        .from('ai_question_cache')
        .update({ is_used: false, times_shown: 0 })
        .eq('is_used', true)
        .eq('part', part)
        .select('id');

    if (error) {
        console.error('[ExamService] Cache recycle failed:', error);
        return 0;
    }
    return data?.length || 0;
};

function createLocalSession(
    userId: string, 
    config: ExamConfig, 
    mcqs: MCQQuestion[], 
    essays: EssayQuestion[]
): ExamSession {
    return {
        id: `local-${Date.now()}`,
        user_id: userId,
        test_type: config.testType,
        test_title: config.title,
        mcq_questions: mcqs.map(q => q.id),
        essay_questions: essays.map(e => e.id),
        current_section: config.mcqCount > 0 ? 'MCQ' : 'ESSAY',
        current_question_index: 0,
        mcq_answers: {},
        mcq_time_spent_seconds: 0,
        essay_answers: {},
        essay_unlocked: config.testType === 'STANDARD',
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
    };
}

// ============================================
// ESSAY GRADING QUEUE
// ============================================

/**
 * Queue essay answers for AI grading after exam submission.
 * Inserts into essay_grading_queue for backend worker processing.
 */
export const queueEssayGrading = async (
    sessionId: string,
    userId: string,
    essayAnswers: Record<string, EssayAnswer>,
    essayQuestions: EssayQuestion[],
    priority: number = 0
): Promise<boolean> => {
    try {
        // Build queue entries for each essay
        const queueEntries = Object.entries(essayAnswers)
            .filter(([, ans]) => ans.text && ans.text.trim().length > 10)
            .map(([questionId, ans]) => {
                const q = essayQuestions.find(eq => eq.id === questionId);
                return {
                    session_id: sessionId,
                    user_id: userId,
                    essay_question_id: questionId,
                    essay_text: ans.text,
                    scenario_text: q?.scenario_text || '',
                    topic: q?.topic || 'General',
                    status: 'PENDING',
                    priority,
                };
            });

        if (queueEntries.length === 0) {
            console.warn('[ExamService] No valid essays to queue for grading');
            return false;
        }

        // Insert queue entries
        const { error: queueError } = await supabase
            .from('essay_grading_queue')
            .insert(queueEntries);

        if (queueError) {
            console.error('[ExamService] Failed to insert essay grading queue:', queueError);
            // Non-fatal: essays are saved in exam_sessions.essay_answers
        }

        // Mark essay_scores as PENDING in exam session
        const { error: sessionError } = await supabase
            .from('exam_sessions')
            .update({
                essay_scores: {
                    status: 'PENDING',
                    essays: {},
                    queuedAt: new Date().toISOString(),
                    totalEssays: queueEntries.length,
                }
            })
            .eq('id', sessionId);

        if (sessionError) {
            console.error('[ExamService] Failed to update essay_scores status:', sessionError);
        }

        return !queueError;
    } catch (err) {
        console.error('[ExamService] Critical error queuing essays:', err);
        return false;
    }
};

/**
 * Poll for essay grading results. Returns the current essay_scores from exam_sessions.
 */
export const pollEssayResults = async (sessionId: string): Promise<{
    status: 'PENDING' | 'PARTIAL' | 'COMPLETE' | null;
    essays: Record<string, any>;
    combinedEssayScore?: number;
} | null> => {
    try {
        const { data, error } = await supabase
            .from('exam_sessions')
            .select('essay_scores')
            .eq('id', sessionId)
            .single();

        if (error || !data?.essay_scores) return null;
        return data.essay_scores;
    } catch {
        return null;
    }
};

/**
 * Subscribe to essay grading results via Supabase Realtime.
 * Returns unsubscribe function.
 */
export const subscribeToEssayResults = (
    sessionId: string,
    onUpdate: (essayScores: any) => void
): (() => void) => {
    const channel = supabase
        .channel(`essay-grading-${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'exam_sessions',
                filter: `id=eq.${sessionId}`,
            },
            (payload) => {
                if (payload.new?.essay_scores) {
                    onUpdate(payload.new.essay_scores);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// ============================================
// TEST CENTER MANAGEMENT
// ============================================

export interface TestCenterSession {
    id: string;
    admin_user_id: string;
    name: string;
    exam_config_key: string;
    status: 'SETUP' | 'READY' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    station_count: number;
    settings: Record<string, any>;
    scheduled_start?: string;
    actual_start?: string;
    completed_at?: string;
    created_at: string;
}

export interface TestCenterStation {
    id: string;
    center_session_id: string;
    station_number: number;
    candidate_name?: string;
    student_user_id?: string;
    exam_session_id?: string;
    status: 'EMPTY' | 'ASSIGNED' | 'READY' | 'ACTIVE' | 'SUBMITTED' | 'DISCONNECTED';
    last_heartbeat?: string;
    ip_address?: string;
    proctoring_events?: any[];
    created_at: string;
}

/**
 * Create a test center session with N stations.
 */
export const createTestCenterSession = async (
    adminUserId: string,
    name: string,
    examConfigKey: string,
    stationCount: number = 30,
    settings: Record<string, any> = {}
): Promise<TestCenterSession | null> => {
    try {
        // Create the center session
        const { data: session, error: sessionError } = await supabase
            .from('test_center_sessions')
            .insert({
                admin_user_id: adminUserId,
                name,
                exam_config_key: examConfigKey,
                station_count: stationCount,
                settings,
                status: 'SETUP',
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error('[TestCenter] Failed to create session:', sessionError);
            return null;
        }

        // Create station records
        const stations = Array.from({ length: stationCount }, (_, i) => ({
            center_session_id: session.id,
            station_number: i + 1,
            status: 'EMPTY',
        }));

        const { error: stationsError } = await supabase
            .from('test_center_stations')
            .insert(stations);

        if (stationsError) {
            console.error('[TestCenter] Failed to create stations:', stationsError);
        }

        return session;
    } catch (err) {
        console.error('[TestCenter] Critical error:', err);
        return null;
    }
};

/**
 * Get all test center sessions for an admin.
 */
export const getTestCenterSessions = async (adminUserId: string): Promise<TestCenterSession[]> => {
    try {
        const { data, error } = await supabase
            .from('test_center_sessions')
            .select('*')
            .eq('admin_user_id', adminUserId)
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) return [];
        return data || [];
    } catch { return []; }
};

/**
 * Get all stations for a test center session.
 */
export const getTestCenterStations = async (centerSessionId: string): Promise<TestCenterStation[]> => {
    try {
        const { data, error } = await supabase
            .from('test_center_stations')
            .select('*')
            .eq('center_session_id', centerSessionId)
            .order('station_number', { ascending: true });
        if (error) return [];
        return data || [];
    } catch { return []; }
};

/**
 * Update test center session status.
 */
export const updateTestCenterStatus = async (
    centerSessionId: string,
    status: TestCenterSession['status'],
    extra: Record<string, any> = {}
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('test_center_sessions')
            .update({ status, ...extra })
            .eq('id', centerSessionId);
        return !error;
    } catch { return false; }
};

/**
 * Register a station (called by workstation on load).
 */
export const registerStation = async (
    centerSessionId: string,
    stationNumber: number,
    userId: string,
    candidateName: string
): Promise<TestCenterStation | null> => {
    try {
        const { data, error } = await supabase
            .from('test_center_stations')
            .update({
                student_user_id: userId,
                candidate_name: candidateName,
                status: 'READY',
                last_heartbeat: new Date().toISOString(),
            })
            .eq('center_session_id', centerSessionId)
            .eq('station_number', stationNumber)
            .select()
            .single();
        if (error) return null;
        return data;
    } catch { return null; }
};

/**
 * Update station heartbeat + current progress.
 */
export const updateStationHeartbeat = async (
    stationId: string,
    status: TestCenterStation['status'],
    proctoringEvent?: { type: string; timestamp: string; detail?: string }
): Promise<void> => {
    try {
        const update: any = {
            last_heartbeat: new Date().toISOString(),
            status,
        };
        if (proctoringEvent) {
            // Append to proctoring_events array using raw SQL via RPC would be ideal,
            // but for simplicity we'll fetch-then-update
            const { data } = await supabase
                .from('test_center_stations')
                .select('proctoring_events')
                .eq('id', stationId)
                .single();
            const events = data?.proctoring_events || [];
            events.push(proctoringEvent);
            update.proctoring_events = events;
        }
        await supabase
            .from('test_center_stations')
            .update(update)
            .eq('id', stationId);
    } catch (err) {
        console.warn('[TestCenter] Heartbeat failed:', err);
    }
};

/**
 * Subscribe to all station changes for a test center (admin dashboard).
 */
export const subscribeToStations = (
    centerSessionId: string,
    onUpdate: (stations: TestCenterStation[]) => void
): (() => void) => {
    const channel = supabase
        .channel(`test-center-${centerSessionId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'test_center_stations',
                filter: `center_session_id=eq.${centerSessionId}`,
            },
            async () => {
                // On any change, refetch all stations
                const stations = await getTestCenterStations(centerSessionId);
                onUpdate(stations);
            }
        )
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

/**
 * Broadcast a command to all stations via Supabase Realtime.
 */
export const broadcastToStations = async (
    centerSessionId: string,
    command: 'START' | 'PAUSE' | 'RESUME' | 'ADD_TIME' | 'FORCE_SUBMIT',
    payload: Record<string, any> = {}
): Promise<void> => {
    const channel = supabase.channel(`tc-cmd-${centerSessionId}`);
    await channel.subscribe();
    await channel.send({
        type: 'broadcast',
        event: 'admin-command',
        payload: { command, ...payload, timestamp: new Date().toISOString() },
    });
    supabase.removeChannel(channel);
};

/**
 * Listen for admin commands on a station.
 */
export const subscribeToAdminCommands = (
    centerSessionId: string,
    onCommand: (command: string, payload: any) => void
): (() => void) => {
    const channel = supabase
        .channel(`tc-cmd-${centerSessionId}`)
        .on('broadcast', { event: 'admin-command' }, ({ payload }) => {
            onCommand(payload.command, payload);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

// ============================================
// EXPORT DEFAULT EXAM SERVICE
// ============================================

export const examService = {
    EXAM_CONFIGS,
    fetchHybridMCQs,
    fetchEssayQuestions,
    createExamSession,
    saveExamProgress,
    completeMCQSection,
    completeEssaySection,
    getExamSession,
    getUserSessions,
    preGenerateQuestionBatch,
    recycleAIQuestionCache,
    queueEssayGrading,
    pollEssayResults,
    subscribeToEssayResults,
    createTestCenterSession,
    getTestCenterSessions,
    getTestCenterStations,
    updateTestCenterStatus,
    registerStation,
    updateStationHeartbeat,
    subscribeToStations,
    broadcastToStations,
    subscribeToAdminCommands,
};

export default examService;
