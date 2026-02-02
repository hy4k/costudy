
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
 * CoStudy Authentication Service
 */
export const authService = {
  signUp: async (email: string, pass: string, name: string, role: string) => {
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
      if (error.message.includes('Database error')) {
        throw new Error("Server synchronization issue. Please try signing in, or try again in a few moments.");
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
  },

  signIn: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
    return data;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return true;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        // Fix for "Invalid Refresh Token" loop:
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
           console.warn("Detected stale session token. Clearing auth state...");
           await supabase.auth.signOut();
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
        signal_level: 'ACTIVE_SOLVER',
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
        console.error("Profile Upsert Failed:", error);
        throw error;
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

// --- EXAM MOCK GENERATOR (PROMETRIC STYLE) ---
export const fetchExamQuestions = async (count: number) => {
    return new Promise<any[]>((resolve) => {
        setTimeout(() => {
            const questions = Array.from({ length: count }).map((_, i) => ({
                id: `q-${i + 1}`,
                type: 'MCQ', // Explicit Type
                question_text: `Sample CMA Question ${i + 1}: Which of the following best describes the strategic advantage of Activity Based Costing (ABC) over traditional volume-based costing in a diverse manufacturing environment?`,
                option_a: "It reduces the total overhead costs incurred by the production facility.",
                option_b: "It assigns costs based on resource consumption rather than just volume, providing more accurate product margins.",
                option_c: "It simplifies the accounting process by using a single plant-wide overhead rate.",
                option_d: "It eliminates the need for allocating fixed costs to individual products.",
                correct_answer: "B",
                part: "Part 1",
                section: i % 2 === 0 ? "Cost Management" : "Internal Controls"
            }));
            resolve(questions);
        }, 1500); // Simulate network latency
    });
};

// --- AUTO SAVE SIMULATION ---
export const saveExamProgress = async (userId: string, testId: string, progress: any) => {
    // This would typically be a Supabase upsert to an 'exam_sessions' table
    return new Promise((resolve) => {
        console.log(`[AutoSave] Saving progress for ${userId} on test ${testId}`, {
            answered: progress.answers.filter((a: any) => a[1].selected !== null).length,
            currentQuestion: progress.currentIndex
        });
        setTimeout(() => resolve(true), 600); // Simulate network delay
    });
};
