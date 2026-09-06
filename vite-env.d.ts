/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_AI_PROXY_URL?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_COSTUDY_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
