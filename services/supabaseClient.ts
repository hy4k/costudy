import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://avtjxcdcjbwmggdimkgh.supabase.co';
// Legacy JWT-style anon key (universally compatible with the installed supabase-js version).
// A proper .env on the VPS (VITE_SUPABASE_ANON_KEY) overrides this fallback.
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dGp4Y2RjamJ3bWdnZGlta2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDUwNDksImV4cCI6MjA4OTY4MTA0OX0.rwZ7mV2KYU_5glsqxL1otqmo6ZxYnocu8WOXdYM1JC4';

// Real Supabase client — configured with an in-memory/direct async lock handler to
// prevent Navigator LockManager timeouts in iframes. This is the ONLY client used
// by the app: there is no mock/offline fallback. Real errors must surface as real
// errors (console + user-facing "couldn't load, try again" states in components),
// never be papered over with fabricated data — this app serves real paying students.
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        return await fn();
      }
    }
  }
);

// Opt-in only, OFF by default. If some component genuinely needs an offline/demo
// mode in the future, gate it behind this flag explicitly — never silently.
export const DEMO_MODE = (import.meta as any).env.VITE_DEMO_MODE === 'true';
