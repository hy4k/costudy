
import { supabase } from './supabaseClient';
import { CoStudyCloudStatus, User, UserRole, UserLevel } from '../types';

export const COSTUDY_CONFIG = {
  apiBase: 'https://api.costudy.cloud/v1',
  socketUrl: 'wss://realtime.costudy.cloud',
  merchantId: 'MID_COSTUDY_2025'
};

export const getCoStudyCloudStatus = (): CoStudyCloudStatus => ({
  connected: true,
  latency: Math.floor(Math.random() * 15) + 5,
  lastSync: new Date().toISOString(),
  authSession: 'costudy-live-session',
  dataCore: 'IDLE'
});

/**
 * CoStudy Authentication Service with CORS fallback
 */
export const authService = {
  signUp: async (email: string, pass: string, name: string, role: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
            role: role // Critical: Pass role to metadata so the DB trigger can use it
          }
        }
      });

      if (error) {
        console.error("Supabase signup error:", error);
        if (error.message.includes('Database error')) {
          throw new Error("Server synchronization issue. Please try signing in, or try again in a few moments.");
        } else if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
          // Fallback to local auth service if CORS is blocking
          console.warn("Using local auth service due to CORS/network issues");
          return await localAuthService.signUp(email, pass, { full_name: name, role });
        }
        throw error;
      }

      if (data.user) {
        try {
          await createUserProfile(data.user.id, {
            full_name: name,
            role: role
          });
        } catch (e) {
          console.warn("Manual seeding failed, but App.tsx JIT logic will recover it on mount.");
        }
      }

      return data;
    } catch (networkError) {
      console.warn("Network error during signup, trying local auth service");
      return await localAuthService.signUp(email, pass, { full_name: name, role });
    }
  },

  signIn: async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
      });
      
      if (error) {
        console.error("Supabase signin error:", error);
        if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
          // Fallback to local auth service if CORS is blocking
          console.warn("Using local auth service due to CORS/network issues");
          return await localAuthService.signIn(email, pass);
        }
        throw error;
      }
      return data;
    } catch (networkError) {
      console.warn("Network error during signin, trying local auth service");
      return await localAuthService.signIn(email, pass);
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return true;
    } catch (networkError) {
      console.error("Reset password error:", networkError);
      throw networkError;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Supabase signout failed, clearing local session");
        // Even if supabase signout fails, clear local session
        localStorage.removeItem('costudy_session');
        return;
      }
      // Success, also clear local session
      localStorage.removeItem('costudy_session');
    } catch (networkError) {
      console.warn("Network error during signout, clearing local session");
      localStorage.removeItem('costudy_session');
    }
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session retrieval error:", error);
        // Fix for "Invalid Refresh Token" loop:
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token") || error.message.includes("Failed to fetch")) {
           console.warn("Detected stale session token or network issue. Clearing auth state...");
           try {
             await supabase.auth.signOut();
           } catch (signOutErr) {
             console.warn("Sign out also failed:", signOutErr);
           }
           return null;
        }
        return null;
      }
      return data.session;
    } catch (e) {
      console.error("Critical Auth Error:", e);
      return null;
    }
  }
};

/**
 * CoStudy Profile Service
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); 

        if (error) {
          // Suppress 406/Not Acceptable errors which happen during race conditions or missing profiles
          if (!error.message.includes("JSON object requested") && !error.message.includes("0 rows")) {
             console.error("Profile Fetch Error:", error.message);
          }
          return null;
        }

        if (!data) return null;

        // Normalizing Role to Uppercase to match TypeScript Enums (DB often returns lowercase enum values)
        const normalizedRole = (data.role || 'STUDENT').toUpperCase() as UserRole;

        return {
            id: data.id,
            name: data.name,
            handle: data.handle || data.name?.toLowerCase().replace(/\s/g, '_') || 'aspirant',
            bio: data.bio || '',
            strategicMilestone: data.strategic_milestone || '',
            examFocus: data.exam_focus || 'CMA Part 1',
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
            role: normalizedRole,
            level: data.level as UserLevel,
            learningStyle: data.learning_style || 'Visual',
            timezone: data.timezone || 'UTC',
            performance: data.performance || [],
            reputation: data.reputation || {
                studyScore: { total: 0, consistencyWeight: 0, attemptWeight: 0, improvementWeight: 0 },
                consistencyScore: { streak: 0, status: 'Active' },
                helpfulnessScore: { total: 0, answersVerified: 0, resourcesShared: 0, groupsLed: 0 }
            },
            costudyStatus: data.costudy_status || {
                subscription: 'Basic',
                walletBalance: 0,
                isVerified: false,
                globalRank: 0
            },
            learningWith: 0,
            learningFrom: 0,
            availableHours: 'Evening',
            // Specialist fields
            specialties: data.specialties || [],
            yearsExperience: data.years_experience || 0,
            hourlyRate: data.hourly_rate || 0,
            specialistSlug: data.specialist_slug,
            signalLevel: data.signal_level || 'ACTIVE_SOLVER'
        };
    } catch (e) {
        // Silent fail to allow app to self-heal via createUserProfile
        return null;
    }
};

/**
 * Manual Profile Creation (Self-Healing Logic)
 */
export const createUserProfile = async (userId: string, metadata: any): Promise<User | null> => {
    const name = metadata?.full_name || metadata?.display_name || 'New Aspirant';
    // Ensure role matches DB enum case if necessary, but we normalize on read
    const role = metadata?.role || 'STUDENT'; 
    const handle = name.toLowerCase().replace(/\s/g, '_') + '_' + Math.floor(Math.random() * 1000);

    const newProfile = {
        id: userId,
        name: name,
        handle: handle,
        avatar: `https://i.pravatar.cc/150?u=${userId}`,
        role: role,
        level: 'STARTER',
        bio: 'Just started my CMA journey.',
        strategic_milestone: 'Preparing for Part 1 Mock Session.',
        exam_focus: 'CMA Part 1',
        // Note: signal_level exists in database.sql but not in production (supabase.fets.in) - omit to avoid 400
        costudy_status: {
            subscription: 'Basic',
            walletBalance: 0,
            isVerified: false,
            globalRank: Math.floor(Math.random() * 5000) + 1000
        },
        performance: [
            { topic: 'Financial Reporting', score: 45, attempts: 1, lastScore: 45, trend: 'Stable', style: 'Conceptual' },
            { topic: 'Cost Management', score: 32, attempts: 1, lastScore: 32, trend: 'Stable', style: 'Calculation' }
        ],
        // Ensure mentor fields are initialized to prevent update errors
        specialties: [],
        years_experience: 0,
        hourly_rate: 0
    };

    const { error } = await supabase
        .from('user_profiles')
        .upsert(newProfile, { onConflict: 'id' });

    if (error) {
        console.warn("Profile Upsert Failed (400 may indicate schema mismatch):", error.message);
        // Don't throw - a DB trigger may have created the profile, or we'll use minimal user
        const existing = await getUserProfile(userId);
        return existing;
    }

    return getUserProfile(userId);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    // Transform frontend fields to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
    if (updates.strategicMilestone !== undefined) dbUpdates.strategic_milestone = updates.strategicMilestone;
    if (updates.examFocus !== undefined) dbUpdates.exam_focus = updates.examFocus;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.signalLevel !== undefined) dbUpdates.signal_level = updates.signalLevel;
    if (updates.specialties !== undefined) dbUpdates.specialties = updates.specialties;
    if (updates.yearsExperience !== undefined) dbUpdates.years_experience = updates.yearsExperience;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.specialistSlug !== undefined) dbUpdates.specialist_slug = updates.specialistSlug;

    const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select();

    if (error) {
        console.error("Supabase Update Error:", error);
        
        // Handle session expiry explicitly
        if (error.message.includes("JWT") || error.message.includes("token")) {
             await authService.signOut();
             throw new Error("Session expired. Please log in again.");
        }

        // Handle missing column errors more gracefully
        if (error.message.includes("column") && error.message.includes("does not exist")) {
             throw new Error("Database schema out of sync. Please contact support or refresh schema.");
        }

        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
       // This happens if RLS blocks the update or ID doesn't exist
       throw new Error("Update failed: User record not found or permission denied.");
    }
    
    return true;
};

export const fetchMockTestData = async () => {
  return [
    { id: 't1', title: 'CMA Part 1 Full Mock', questions: 100, duration: '3h 45m', difficulty: 'Hard' }, // Updated Duration
    { id: 't2', title: 'Ethics Section Quiz', questions: 25, duration: '30m', difficulty: 'Medium' },
    { id: 't3', title: 'Costing Strategy Diagnostic', questions: 50, duration: '1h 30m', difficulty: 'Hard' }
  ];
};

export const fetchGlobalPerformance = async (userId: string) => {
  return {
    globalRank: 124,
    averageMockScore: 82,
    percentile: 94,
    weakTopics: ['Internal Controls', 'Ethics'],
    lastAttempt: new Date().toISOString()
  };
};

export const processUnifiedPayment = async (amount: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        costudyTransactionId: `CS_TXN_${Date.now()}`,
        gateway: 'Stripe',
        amount,
        status: 'success'
      });
    }, 1500);
  });
};

export const syncStudyTelemetry = (data: any) => {
  console.log('[CoStudy Telemetry]', data);
};

// --- EXAM QUESTION FETCHER (REAL DATA from question_bank; mirrors examService.fetchHybridMCQs / fetchEssayQuestions) ---
export const fetchExamQuestions = async (
    mcqCount: number,
    essayCount: number = 2,
    part: string = 'Part 1'
) => {
    try {
        const { data: mcqData } = await supabase
            .from('question_bank')
            .select('id, question_text, options, correct_answer, part, section, difficulty, source_kind')
            .eq('question_kind', 'MCQ')
            .eq('is_active', true)
            .eq('part', part)
            .not('options', 'is', null)
            .not('correct_answer', 'is', null)
            .limit(mcqCount * 3);
        
        let mcqs = (mcqData || []).sort(() => Math.random() - 0.5).slice(0, mcqCount);
        
        if (mcqs.length < mcqCount) {
            const sampleMcqs = Array.from({ length: mcqCount - mcqs.length }).map((_, i) => ({
                id: `mcq-sample-${i + 1}`,
                type: 'MCQ',
                question_text: `Sample CMA Question ${i + 1}: Which of the following best describes the strategic advantage of Activity Based Costing (ABC)?`,
                option_a: "It reduces total overhead costs.",
                option_b: "It assigns costs based on resource consumption, providing more accurate margins.",
                option_c: "It simplifies accounting by using a single overhead rate.",
                option_d: "It eliminates the need for allocating fixed costs.",
                correct_answer: "B",
                part,
                section: i % 2 === 0 ? "Cost Management" : "Internal Controls",
                source: 'real' as const
            }));
            mcqs = [...mcqs, ...sampleMcqs];
        }
        
        const formattedMcqs = mcqs.map((q: any) => {
            const opts = q.options || {};
            return {
                id: q.id,
                type: 'MCQ',
                question_text: q.question_text || '',
                option_a: opts.A || opts.a || '',
                option_b: opts.B || opts.b || '',
                option_c: opts.C || opts.c || '',
                option_d: opts.D || opts.d || '',
                correct_answer: q.correct_answer || 'A',
                part: q.part || part,
                section: q.section || 'General',
                source: (q.source_kind === 'ai_generated' ? 'ai_generated' : 'real') as 'real' | 'ai_generated'
            };
        });
        
        const { data: essayData } = await supabase
            .from('question_bank')
            .select('id, question_text, options, topic, section, part, difficulty')
            .eq('question_kind', 'ESSAY')
            .eq('is_active', true)
            .eq('part', part)
            .limit(essayCount * 3);
        
        let essays = (essayData || []).sort(() => Math.random() - 0.5).slice(0, essayCount);
        
        if (essays.length < essayCount) {
            const fallbackEssays = [
                {
                    id: 'essay-fallback-1', type: 'ESSAY',
                    question_text: 'SCENARIO:\n\nOmega Corp is considering expansion into the European market. The CFO is concerned about foreign currency exchange risk.\n\nREQUIRED:\n\n1. Identify the three types of foreign currency risk exposure.\n2. Recommend a hedging strategy using financial derivatives.',
                    part, section: 'Essay Section - Financial Risk',
                    option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
                },
                {
                    id: 'essay-fallback-2', type: 'ESSAY',
                    question_text: 'SCENARIO:\n\nTechSolutions Inc. uses volume-based costing. Competitors undercut on high-volume products.\n\nREQUIRED:\n\n1. Analyze why the current system distorts costs.\n2. Explain how ABC could improve pricing decisions.',
                    part, section: 'Essay Section - Cost Management',
                    option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
                }
            ];
            essays = [...essays, ...fallbackEssays.slice(0, essayCount - essays.length)];
        }
        
        const formattedEssays = essays.map((e: any) => ({
            id: e.id,
            type: 'ESSAY',
            question_text: e.question_text || 'Essay question content not available.',
            part: e.part || 'Part 1',
            section: `Essay Section - ${e.topic || e.section || 'General'}`,
            option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
        }));
        
        return [...formattedMcqs.sort(() => Math.random() - 0.5), ...formattedEssays];
        
    } catch (error) {
        console.error('Error fetching exam questions:', error);
        return Array.from({ length: mcqCount }).map((_, i) => ({
            id: `q-fallback-${i + 1}`,
            type: 'MCQ',
            question_text: `Fallback Question ${i + 1}: Error loading questions. Please check your connection.`,
            option_a: "Option A",
            option_b: "Option B", 
            option_c: "Option C",
            option_d: "Option D",
            correct_answer: "A",
            part: "Part 1",
            section: "General"
        }));
    }
};

// Fetch only essay questions (for essay-only tests) from question_bank
export const fetchEssayQuestions = async (count: number = 2, part: string = 'Part 1') => {
    try {
        const { data, error } = await supabase
            .from('question_bank')
            .select('id, question_text, topic, section, part, difficulty')
            .eq('question_kind', 'ESSAY')
            .eq('is_active', true)
            .eq('part', part)
            .limit(count * 3);
        
        if (error) throw error;
        
        let essays = (data || []).sort(() => Math.random() - 0.5).slice(0, count);
        
        return essays.map((e: any) => ({
            id: e.id,
            type: 'ESSAY',
            topic: e.topic || e.section || 'General',
            question_text: e.question_text || 'Essay question content not available.',
            part: e.part || 'Part 1'
        }));
    } catch (error) {
        console.error('Error fetching essays:', error);
        return [];
    }
};

// --- EXAM SESSION SAVE (REAL) ---
export const saveExamProgress = async (userId: string, testId: string, progress: any) => {
    try {
        const { data: existingSession } = await supabase
            .from('exam_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('test_id', testId)
            .eq('status', 'in_progress')
            .maybeSingle();
        
        const sessionData = {
            user_id: userId,
            test_id: testId,
            answers: progress.answers,
            current_index: progress.currentIndex,
            time_remaining: progress.timeRemaining,
            last_saved_at: new Date().toISOString(),
            status: 'in_progress'
        };
        
        if (existingSession) {
            // Update existing session
            const { error } = await supabase
                .from('exam_sessions')
                .update(sessionData)
                .eq('id', existingSession.id);
            
            if (error) throw error;
        } else {
            // Create new session
            const { error } = await supabase
                .from('exam_sessions')
                .insert({
                    ...sessionData,
                    started_at: new Date().toISOString()
                });
            
            if (error) throw error;
        }
        
        console.log(`[AutoSave] Saved progress for ${userId} on test ${testId}`);
        return true;
    } catch (error) {
        console.error('[AutoSave] Error saving progress:', error);
        // Don't throw - auto-save failures shouldn't crash the exam
        return false;
    }
};

// Complete exam session and record results
export const completeExamSession = async (
    userId: string, 
    testId: string, 
    scoreMcq: number, 
    scoreEssay?: number
) => {
    try {
        const { error } = await supabase
            .from('exam_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                score_mcq: scoreMcq,
                score_essay: scoreEssay
            })
            .eq('user_id', userId)
            .eq('test_id', testId)
            .eq('status', 'in_progress');
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[CompleteExam] Error completing session:', error);
        return false;
    }
};
