
import { supabase } from './supabaseClient';
import { CoStudyCloudStatus, User, UserRole, UserLevel } from '../types';


/**
 * Resilient Supabase Operation Wrapper
 * Implements exponential backoff, retry logic, and connection verification.
 */
const withRetry = async <T = any>(operation: () => PromiseLike<T> | Promise<T> | any, maxRetries = 3, baseDelay = 1000): Promise<T> => {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        throw new Error("Network offline. Please check your connection.");
      }

      const result: any = await operation();
      
      // Treat specific Supabase errors as exceptions to trigger retry logic
      if (result && result.error) {
        const status = result.error.status || result.error.code;
        const msg = result.error.message || '';
        if (status == 404 || status >= 500 || msg.includes('FetchError') || msg.includes('Database error') || msg.includes('network') || msg.includes('Failed to fetch')) {
            throw result.error;
        }
      }
      
      return result;
    } catch (error: any) {
      attempt++;
      lastError = error;
      
      const status = error.status || error.code;
      const msg = error.message || '';
      
      const isRetryable = 
        msg.includes('FetchError') ||
        msg.includes('NetworkError') ||
        msg.includes('network') ||
        msg.includes('Failed to fetch') ||
        msg.includes('Database error') ||
        status == 404 ||
        status >= 500 ||
        status === 'PGRST116' ||
        status == 502 ||
        status == 503;

      if (!isRetryable || attempt >= maxRetries) {
        return { data: null, error: lastError } as any;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
      console.warn(`[CoStudy Network Guard] Query failed (${status || msg}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  
  return { data: null, error: lastError || new Error("Operation failed after maximum retries") } as any;
};

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
    const { data, error } = await withRetry(() => supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          role: role // Critical: Pass role to metadata so the DB trigger can use it
        }
      }
    }));

    if (error) {
      if (error.message.includes('Database error')) {
        throw new Error("Server synchronization issue. Please try signing in, or try again in a few moments.");
      }
      throw error;
    }

    if (data?.user) {
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
    const { data, error } = await withRetry(() => supabase.auth.signInWithPassword({
      email,
      password: pass
    }));
    if (error) throw error;
    return data;
  },

  resetPassword: async (email: string) => {
    const { error } = await withRetry(() => supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    }));
    if (error) throw error;
    return true;
  },

  signOut: async () => {
    const { error } = await withRetry(() => supabase.auth.signOut());
    if (error) throw error;
  },

  getSession: async () => {
    try {
      const { data, error } = await withRetry(() => supabase.auth.getSession());
      
      if (error) {
        // Fix for "Invalid Refresh Token" loop:
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
           console.warn("Detected stale session token. Clearing auth state...");
           await withRetry(() => supabase.auth.signOut());
           return null;
        }
        return null;
      }
      return data?.session;
    } catch (e) {
      console.error("Critical Auth Error:", e);
      return null;
    }
  }
};

/**
 * Normalizes raw database/storage profile objects into strong User structures
 */
export const normalizeDbProfile = (data: any): User => {
    const normalizedRole = ((data.role || 'STUDENT') + '').toUpperCase() as UserRole;
    return {
        id: data.id,
        name: data.name || 'CMA Aspirant',
        handle: data.handle || (data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'aspirant'),
        bio: data.bio || '',
        strategicMilestone: data.strategic_milestone || data.strategicMilestone || 'Preparing for CMA Examination.',
        examFocus: data.exam_focus || data.examFocus || 'CMA Part 1',
        avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
        role: normalizedRole,
        level: (data.level || 'STARTER') as UserLevel,
        learningStyle: data.learning_style || data.learningStyle || 'Visual',
        timezone: data.timezone || 'UTC',
        performance: data.performance || [
            { topic: 'Financial Reporting', score: 45, attempts: 1, lastScore: 45, trend: 'Stable', style: 'Conceptual' },
            { topic: 'Cost Management', score: 32, attempts: 1, lastScore: 32, trend: 'Stable', style: 'Calculation' }
        ],
        reputation: data.reputation || {
            studyScore: { total: 100, consistencyWeight: 30, attemptWeight: 40, improvementWeight: 30 },
            consistencyScore: { streak: 1, status: 'Active' },
            helpfulnessScore: { total: 0, answersVerified: 0, resourcesShared: 0, groupsLed: 0 }
        },
        costudyStatus: data.costudy_status || data.costudyStatus || {
            subscription: 'Basic',
            walletBalance: 1000,
            isVerified: false,
            globalRank: 1240
        },
        learningWith: data.learningWith || 0,
        learningFrom: data.learningFrom || 0,
        availableHours: data.availableHours || 'Evening',
        specialties: data.specialties || [],
        yearsExperience: data.years_experience || data.yearsExperience || 0,
        hourlyRate: data.hourly_rate || data.hourlyRate || 0,
        specialistSlug: data.specialist_slug || data.specialistSlug,
        signalLevel: data.signal_level || data.signalLevel || 'ACTIVE_SOLVER'
    };
};

/**
 * CoStudy Profile Service
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    try {
        const { data, error } = await withRetry(() => supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle()); 

        if (data) {
          // Keep local cache fresh
          if (typeof window !== 'undefined') {
            const profiles = JSON.parse(localStorage.getItem('cs_user_profiles') || '[]');
            const idx = profiles.findIndex((p: any) => p.id === userId);
            if (idx >= 0) {
              profiles[idx] = { ...profiles[idx], ...data };
            } else {
              profiles.push(data);
            }
            localStorage.setItem('cs_user_profiles', JSON.stringify(profiles));
          }
          return normalizeDbProfile(data);
        }

        if (error) {
          console.warn("Supabase profile fetch error, checking local store:", error.message);
        }

        // Tier 2: Check local storage
        if (typeof window !== 'undefined') {
          const profiles = JSON.parse(localStorage.getItem('cs_user_profiles') || '[]');
          const localProfile = profiles.find((p: any) => p.id === userId);
          if (localProfile) {
            return normalizeDbProfile(localProfile);
          }
        }

        // Tier 3: Auto-create default profile for authenticated user
        return await createUserProfile(userId, { full_name: 'CMA Aspirant' });
    } catch (e) {
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          const profiles = JSON.parse(localStorage.getItem('cs_user_profiles') || '[]');
          const localProfile = profiles.find((p: any) => p.id === userId);
          if (localProfile) {
            return normalizeDbProfile(localProfile);
          }
        }
        return await createUserProfile(userId, { full_name: 'CMA Aspirant' });
    }
};

/**
 * Manual Profile Creation (Self-Healing Logic)
 */
export const createUserProfile = async (userId: string, metadata: any): Promise<User | null> => {
    if (!userId) return null;

    const name = metadata?.full_name || metadata?.display_name || metadata?.name || (metadata?.email ? metadata.email.split('@')[0] : 'CMA Aspirant');
    const role = (metadata?.role || 'STUDENT').toUpperCase(); 
    const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000);

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
            walletBalance: 1000,
            isVerified: false,
            globalRank: Math.floor(Math.random() * 5000) + 1000
        },
        performance: [
            { topic: 'Financial Reporting', score: 45, attempts: 1, lastScore: 45, trend: 'Stable', style: 'Conceptual' },
            { topic: 'Cost Management', score: 32, attempts: 1, lastScore: 32, trend: 'Stable', style: 'Calculation' }
        ],
        reputation: {
            studyScore: { total: 100, consistencyWeight: 30, attemptWeight: 40, improvementWeight: 30 },
            consistencyScore: { streak: 1, status: 'Active' },
            helpfulnessScore: { total: 0, answersVerified: 0, resourcesShared: 0, groupsLed: 0 }
        },
        specialties: [],
        years_experience: 0,
        hourly_rate: 0
    };

    // Save to local storage cache immediately
    if (typeof window !== 'undefined') {
      const profiles = JSON.parse(localStorage.getItem('cs_user_profiles') || '[]');
      const idx = profiles.findIndex((p: any) => p.id === userId);
      if (idx >= 0) {
        profiles[idx] = { ...profiles[idx], ...newProfile };
      } else {
        profiles.push(newProfile);
      }
      localStorage.setItem('cs_user_profiles', JSON.stringify(profiles));
    }

    try {
      await withRetry(() => supabase.from('user_profiles').upsert(newProfile, { onConflict: 'id' }));
    } catch (err) {
      console.warn("Supabase upsert warning (stored locally):", err);
    }

    return normalizeDbProfile(newProfile);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    if (!userId) return false;

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

    // Always update local storage first so changes are immediately persisted
    if (typeof window !== 'undefined') {
      const profiles = JSON.parse(localStorage.getItem('cs_user_profiles') || '[]');
      const idx = profiles.findIndex((p: any) => p.id === userId);
      if (idx >= 0) {
        profiles[idx] = { ...profiles[idx], ...dbUpdates, ...updates };
      } else {
        profiles.push({ id: userId, ...dbUpdates, ...updates });
      }
      localStorage.setItem('cs_user_profiles', JSON.stringify(profiles));
    }

    try {
      await withRetry(() => supabase.from('user_profiles').update(dbUpdates).eq('id', userId).select());
    } catch (error: any) {
      console.warn("Supabase update error (persisted to local cache):", error?.message);
    }
    
    return true;
};

export const syncStudyTelemetry = (data: any) => {
  console.log('[CoStudy Telemetry]', data);
};

