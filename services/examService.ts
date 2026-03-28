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
 * Fetch MCQ questions from question_bank (new unified schema).
 * options column is JSONB {A: "...", B: "...", C: "...", D: "..."}.
 */
export const fetchHybridMCQs = async (
    count: number,
    _hybridRatio: number = 0.7,
    part: string = 'Part 1'
): Promise<MCQQuestion[]> => {
    console.log(`[ExamService] Fetching ${count} MCQs from question_bank`);
    
    try {
        const { data, error } = await supabase
            .from('question_bank')
            .select('id, question_text, options, correct_answer, section, difficulty, source_kind')
            .eq('question_kind', 'MCQ')
            .eq('is_active', true)
            .eq('part', part)
            .not('options', 'is', null)
            .not('correct_answer', 'is', null)
            .limit(count * 3);

        if (error) {
            console.error('[ExamService] Error fetching MCQs:', error);
        }

        if (data && data.length > 0) {
            const shuffled = data.sort(() => Math.random() - 0.5).slice(0, count);
            console.log(`[ExamService] Got ${shuffled.length} MCQs from question_bank`);

            const mapped: MCQQuestion[] = shuffled.map((q: any) => {
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
            });

            while (mapped.length < count) {
                mapped.push(generateMockMCQ(mapped.length));
            }

            return mapped;
        }
        
        console.log('[ExamService] No MCQs matched, using mock data');
        return Array.from({ length: count }, (_, i) => generateMockMCQ(i));
        
    } catch (err) {
        console.error('[ExamService] Critical error in fetchHybridMCQs:', err);
        return Array.from({ length: count }, (_, i) => generateMockMCQ(i));
    }
};

/**
 * Fetch essay questions from question_bank (new unified schema).
 */
export const fetchEssayQuestions = async (
    count: number = 2,
    part: string = 'Part 1'
): Promise<EssayQuestion[]> => {
    console.log(`[ExamService] Fetching ${count} essay questions from question_bank`);
    
    try {
        const { data, error } = await supabase
            .from('question_bank')
            .select('id, question_text, options, topic, section, difficulty')
            .eq('question_kind', 'ESSAY')
            .eq('is_active', true)
            .eq('part', part)
            .limit(count * 3);
        
        if (error) {
            console.error('[ExamService] Error fetching essays:', error);
            return generateMockEssays(count);
        }
        
        if (!data || data.length === 0) {
            console.log('[ExamService] No essays in DB, using mock data');
            return generateMockEssays(count);
        }

        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, count);

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
        return generateMockEssays(count);
    }
};

// ============================================
// EXAM SESSION MANAGEMENT
// ============================================

/**
 * Create a new exam session
 */
export const createExamSession = async (
    userId: string,
    configKey: string
): Promise<ExamSession | null> => {
    const config = EXAM_CONFIGS[configKey];
    if (!config) {
        console.error('[ExamService] Invalid config key:', configKey);
        return null;
    }
    
    console.log(`[ExamService] Creating ${config.testType} session for user ${userId}`);
    
    // Fetch questions
    const mcqs = config.mcqCount > 0 
        ? await fetchHybridMCQs(config.mcqCount, config.hybridRatio, config.part)
        : [];
    
    const essays = config.essayCount > 0
        ? await fetchEssayQuestions(config.essayCount, config.part)
        : [];
    
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
// FALLBACK/MOCK DATA GENERATORS
// ============================================

function generateMockMCQ(index: number): MCQQuestion {
    const sections = ['Cost Management', 'Internal Controls', 'Financial Reporting', 'Planning & Budgeting'];
    return {
        id: `mock-mcq-${index + 1}`,
        question_text: `Sample CMA Question ${index + 1}: Which of the following best describes the strategic advantage of Activity Based Costing (ABC) over traditional volume-based costing?`,
        option_a: 'It reduces total overhead costs incurred',
        option_b: 'It assigns costs based on resource consumption, providing accurate product margins',
        option_c: 'It uses a single plantwide overhead rate for simplicity',
        option_d: 'It eliminates the need for allocating fixed costs',
        correct_answer: 'B',
        section: sections[index % sections.length],
        difficulty: index % 3 === 0 ? 'Hard' : index % 2 === 0 ? 'Medium' : 'Easy',
        source: 'real'
    };
}

function generateMockEssays(count: number): EssayQuestion[] {
    return [
        {
            id: 'mock-essay-1',
            scenario_text: `SCENARIO:

Omega Corp is a US-based manufacturer considering expansion into the European market. The CFO is concerned about foreign currency exchange risk as the Euro has been volatile against the USD.

Current exchange rate: 1 EUR = 1.08 USD
Forward rate (1 year): 1 EUR = 1.05 USD
Expected EUR revenue: €5 million annually`,
            requirements: [
                'Identify and explain the three types of foreign currency risk exposure (Transaction, Translation, Economic).',
                'Calculate the potential gain or loss if Omega enters a forward contract to hedge its expected €5 million revenue.',
                'Recommend a comprehensive hedging strategy using financial derivatives.'
            ],
            topic: 'Foreign Currency Risk',
            difficulty: 'Hard',
            time_allocation_minutes: 30
        },
        {
            id: 'mock-essay-2',
            scenario_text: `SCENARIO:

You are the Controller of TechSolutions Inc. The company uses a volume-based costing system (direct labor hours) to allocate overhead. Competitors have been undercutting prices on high-volume products while TechSolutions remains cheap on low-volume specialty items.

Overhead pool: $2,400,000
Total DLH: 80,000
Product A (high volume): 60,000 DLH, 200 setups
Product B (low volume): 20,000 DLH, 800 setups`,
            requirements: [
                'Calculate product costs under the traditional volume-based system.',
                'Calculate product costs using Activity-Based Costing with setups as the cost driver ($1,200 per setup).',
                'Explain why traditional costing distorts product costs and how ABC provides better strategic pricing information.'
            ],
            topic: 'Activity-Based Costing',
            difficulty: 'Hard',
            time_allocation_minutes: 30
        }
    ].slice(0, count);
}

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
    getUserSessions
};

export default examService;
