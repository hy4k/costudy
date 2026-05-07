/**
 * CoStudy Grading Service
 * MCQ grading, essay evaluation parsing, combined scoring
 */

// ============================================
// TYPES
// ============================================

export interface TopicBreakdown {
    topic: string;
    correct: number;
    total: number;
    percentage: number;
}

export interface QuestionResult {
    questionId: string;
    questionText: string;
    selected: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
    section: string;
    options?: { a: string; b: string; c: string; d: string };
}

export interface MCQGradingResult {
    correct: number;
    total: number;
    percentage: number;
    passed: boolean;
    topicBreakdown: TopicBreakdown[];
    perQuestion: QuestionResult[];
    avgTimePerQuestion: number;
}

export interface EssayEvaluation {
    questionId: string;
    overallScore: number;           // 0-100
    technicalAccuracy: number;      // 0-100
    strategicApplication: number;   // 0-100
    communicationQuality: number;   // 0-100
    executiveSummary: string;
    strengths: string[];
    criticalOmissions: string[];
    roadmapTo100: string[];
    rawResponse?: string;
}

export interface EssayScores {
    status: 'PENDING' | 'PARTIAL' | 'COMPLETE';
    gradedAt?: string;
    essays: Record<string, EssayEvaluation>;
    combinedEssayScore?: number;
}

export interface CombinedResult {
    mcq: MCQGradingResult;
    essayScores: EssayScores | null;
    combinedScore: number | null;    // null until essays graded
    overallPassed: boolean | null;
    weights: { mcq: number; essay: number };
}

// ============================================
// MCQ GRADING
// ============================================

interface MCQQuestion {
    id: string;
    question_text: string;
    correct_answer?: string;
    section: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
}

interface Answer {
    questionId: string;
    selected: string | null;
    essayText?: string;
    flagged: boolean;
    timeSpent: number;
}

/**
 * Grade MCQ answers with full breakdown by topic and per-question detail.
 */
export function gradeMCQs(
    questions: MCQQuestion[],
    answers: Map<string, Answer>,
    passThreshold: number = 72
): MCQGradingResult {
    const mcqs = questions.filter(q => q.correct_answer);
    let correct = 0;
    let totalTime = 0;
    const perQuestion: QuestionResult[] = [];

    // Per-topic accumulator
    const topicMap = new Map<string, { correct: number; total: number }>();

    for (const q of mcqs) {
        const ans = answers.get(q.id);
        const selected = ans?.selected || null;
        const correctAns = q.correct_answer || '';

        // Normalize: answers stored as "A"/"B"/"C"/"D" or "option_a" key format
        const normalizedSelected = normalizeAnswer(selected);
        const normalizedCorrect = normalizeAnswer(correctAns);
        const isCorrect = normalizedSelected === normalizedCorrect && normalizedSelected !== null;

        if (isCorrect) correct++;
        totalTime += ans?.timeSpent || 0;

        perQuestion.push({
            questionId: q.id,
            questionText: q.question_text,
            selected: normalizedSelected,
            correctAnswer: normalizedCorrect || correctAns,
            isCorrect,
            timeSpent: ans?.timeSpent || 0,
            section: q.section || 'General',
            options: q.option_a ? {
                a: q.option_a,
                b: q.option_b || '',
                c: q.option_c || '',
                d: q.option_d || '',
            } : undefined,
        });

        // Accumulate topic stats
        const topic = q.section || 'General';
        const existing = topicMap.get(topic) || { correct: 0, total: 0 };
        existing.total++;
        if (isCorrect) existing.correct++;
        topicMap.set(topic, existing);
    }

    const total = mcqs.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const topicBreakdown: TopicBreakdown[] = Array.from(topicMap.entries())
        .map(([topic, stats]) => ({
            topic,
            correct: stats.correct,
            total: stats.total,
            percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        }))
        .sort((a, b) => a.percentage - b.percentage); // Weakest topics first

    return {
        correct,
        total,
        percentage,
        passed: percentage >= passThreshold,
        topicBreakdown,
        perQuestion,
        avgTimePerQuestion: total > 0 ? Math.round(totalTime / total) : 0,
    };
}

/**
 * Normalize answer format: "option_a" -> "A", "A" -> "A", "a" -> "A"
 */
function normalizeAnswer(answer: string | null): string | null {
    if (!answer) return null;
    const trimmed = answer.trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(trimmed)) return trimmed;
    // Handle "option_a" format from handleSelectAnswer
    const match = trimmed.match(/OPTION_([ABCD])/);
    if (match) return match[1];
    return trimmed;
}

// ============================================
// ESSAY EVALUATION PARSING
// ============================================

/**
 * Parse LLM essay evaluation text into structured EssayEvaluation.
 * The LLM follows the ESSAY_EVALUATION_PROMPT format:
 *   1. Overall Score: X%
 *   2. Executive Summary: ...
 *   3. Technical Strengths: ...
 *   4. Critical Omissions: ...
 *   5. IMA Rubric Comparison: ...
 *   6. Roadmap to 100%: ...
 */
export function parseEssayEvaluation(rawText: string, questionId: string): EssayEvaluation {
    const defaultEval: EssayEvaluation = {
        questionId,
        overallScore: 0,
        technicalAccuracy: 0,
        strategicApplication: 0,
        communicationQuality: 0,
        executiveSummary: '',
        strengths: [],
        criticalOmissions: [],
        roadmapTo100: [],
        rawResponse: rawText,
    };

    if (!rawText || rawText.length < 20) return defaultEval;

    try {
        // Try JSON parse first (if backend returns structured JSON)
        const parsed = JSON.parse(rawText);
        if (parsed.overallScore !== undefined) {
            return { ...defaultEval, ...parsed, questionId };
        }
    } catch {
        // Not JSON, parse from text format
    }

    // Extract Overall Score
    const scoreMatch = rawText.match(/overall\s*score[:\s]*(\d+)/i);
    if (scoreMatch) defaultEval.overallScore = parseInt(scoreMatch[1]);

    // Extract sub-scores if present
    const techMatch = rawText.match(/technical\s*accuracy[:\s]*(\d+)/i);
    if (techMatch) defaultEval.technicalAccuracy = parseInt(techMatch[1]);

    const stratMatch = rawText.match(/strategic\s*application[:\s]*(\d+)/i);
    if (stratMatch) defaultEval.strategicApplication = parseInt(stratMatch[1]);

    const commMatch = rawText.match(/communication\s*quality[:\s]*(\d+)/i);
    if (commMatch) defaultEval.communicationQuality = parseInt(commMatch[1]);

    // If sub-scores not found, derive from overall
    if (!techMatch && defaultEval.overallScore > 0) {
        defaultEval.technicalAccuracy = defaultEval.overallScore;
        defaultEval.strategicApplication = defaultEval.overallScore;
        defaultEval.communicationQuality = defaultEval.overallScore;
    }

    // Extract Executive Summary (text after "Executive Summary:" until next numbered section)
    const summaryMatch = rawText.match(/executive\s*summary[:\s]*([\s\S]*?)(?=\n\s*\d\.|technical\s*strength|$)/i);
    if (summaryMatch) defaultEval.executiveSummary = summaryMatch[1].trim().substring(0, 500);

    // Extract strengths as bullet points
    const strengthSection = rawText.match(/(?:technical\s*)?strengths?[:\s]*([\s\S]*?)(?=\n\s*\d\.|critical\s*omission|$)/i);
    if (strengthSection) {
        defaultEval.strengths = extractBulletPoints(strengthSection[1]);
    }

    // Extract omissions
    const omissionsSection = rawText.match(/critical\s*omissions?[:\s]*([\s\S]*?)(?=\n\s*\d\.|ima\s*rubric|roadmap|$)/i);
    if (omissionsSection) {
        defaultEval.criticalOmissions = extractBulletPoints(omissionsSection[1]);
    }

    // Extract roadmap
    const roadmapSection = rawText.match(/roadmap\s*to\s*100[%]?[:\s]*([\s\S]*?)$/i);
    if (roadmapSection) {
        defaultEval.roadmapTo100 = extractBulletPoints(roadmapSection[1]);
    }

    return defaultEval;
}

/**
 * Extract bullet points from a text section.
 */
function extractBulletPoints(text: string): string[] {
    return text
        .split(/\n/)
        .map(line => line.replace(/^[\s\-\*\u2022\d.]+/, '').trim())
        .filter(line => line.length > 5);
}

// ============================================
// COMBINED SCORING
// ============================================

/**
 * Calculate combined exam score (MCQ 75% + Essay 25%).
 * Returns null for combinedScore until all essays are graded.
 */
export function calculateCombinedResult(
    mcqResult: MCQGradingResult,
    essayScores: EssayScores | null,
    weights = { mcq: 0.75, essay: 0.25 }
): CombinedResult {
    if (!essayScores || essayScores.status !== 'COMPLETE') {
        return {
            mcq: mcqResult,
            essayScores,
            combinedScore: null,
            overallPassed: null,
            weights,
        };
    }

    // Average all essay scores
    const essayEntries = Object.values(essayScores.essays);
    const avgEssayScore = essayEntries.length > 0
        ? Math.round(essayEntries.reduce((sum, e) => sum + e.overallScore, 0) / essayEntries.length)
        : 0;

    const combinedScore = Math.round(
        mcqResult.percentage * weights.mcq + avgEssayScore * weights.essay
    );

    // CMA passing: combined >= 72, with minimum 50% on each section
    const overallPassed = combinedScore >= 72
        && mcqResult.percentage >= 50
        && avgEssayScore >= 50;

    return {
        mcq: mcqResult,
        essayScores: { ...essayScores, combinedEssayScore: avgEssayScore },
        combinedScore,
        overallPassed,
        weights,
    };
}
