import { createClient } from '@supabase/supabase-js';

// Connected to Supabase Cloud (via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isDev = import.meta.env.DEV;
const missing = !SUPABASE_URL || !SUPABASE_KEY;

if (missing) {
  if (isDev) {
    console.warn(
      '[CoStudy] Supabase config missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example). Auth and data features will fail.'
    );
  } else {
    throw new Error(
      'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).'
    );
  }
}

const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
