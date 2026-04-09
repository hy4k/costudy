/**
 * Exam portal auth (/exam) — same Supabase project as the main app so JWTs
 * work with examService RLS, but sign-in never falls back to api.costudy.in
 * (avoids HTML error pages parsed as JSON).
 *
 * Proctors/candidates use the same auth.users table; roles (ADMIN / STUDENT)
 * distinguish access. For a fully separate session from costudy.in main app,
 * use a different browser profile or incognito for the exam console.
 */

import { supabase } from './supabaseClient';

export const examPortalAuth = {
  async signIn(email: string, password: string) {
    try {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        /* ignore */
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('CORS') ||
        msg.includes('NetworkError') ||
        (e instanceof TypeError && msg.includes('fetch'))
      ) {
        throw new Error(
          'Cannot reach authentication servers. Check your connection and Supabase configuration (VITE_SUPABASE_URL).'
        );
      }
      throw e instanceof Error ? e : new Error(msg);
    }
  },

  async signUp(email: string, password: string, name: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error('[exam-portal] getSession', error);
      return null;
    }
    return session;
  },

  async signOut() {
    await supabase.auth.signOut({ scope: 'local' });
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/exam.html`,
    });
    if (error) throw new Error(error.message);
  },
};

/** Same client as the rest of the app — required for DB + RLS after login */
export { supabase as examPortalSupabase } from './supabaseClient';
