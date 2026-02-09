import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.fets.in';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MzU3MTY2MCwiZXhwIjo0OTE5MjQ1MjYwLCJyb2xlIjoiYW5vbiJ9.ApJ13y26_hrkcVO-XhLwHiSt1j6tg_h74WrPc93iPCg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to handle manually
    persistSession: true,
    detectSessionInUrl: true
  }
});
