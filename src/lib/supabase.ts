import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client. Uses the ANON key — RLS enforces access.
 * Used for: auth, realtime subscriptions on essay_submissions, mastery_topics reads.
 *
 * IMPORTANT: never use this for delivering MCQ correct keys or essay rubrics —
 * those are gated by the backend (api.costudy.in).
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
