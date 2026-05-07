import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface Props {
  onNavigateSignup: () => void;
  onNavigateForgot: () => void;
  onSuccess: () => void;
}

/**
 * Login page — cinematic dark theme, supports:
 *   1. Email + password sign-in
 *   2. Google OAuth (one-tap style button)
 *   3. Magic link option (optional, wired but commented — uncomment to enable)
 *
 * Sits on the public route — no auth context needed to render.
 */
export function LoginPage({ onNavigateSignup, onNavigateForgot, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (err) {
      if (err.message.includes("Invalid login")) {
        setError("Invalid email or password. Try again or sign up.");
      } else if (err.message.includes("Email not confirmed")) {
        setError("Check your inbox — email confirmation required.");
      } else {
        setError(err.message);
      }
      return;
    }
    onSuccess();
  }

  async function handleGoogleLogin() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (err) setError(err.message);
    // OAuth redirects — no onSuccess() call here; callback page handles it
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg px-5">
      <div className="w-full max-w-md">
        {/* ─── Brand header ───────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-5">
            COSTUDY / AUTHENTICATE
          </div>
          <h1 className="font-display text-[clamp(48px,10vw,80px)] leading-[0.88] tracking-tight">
            Sign<em className="text-signal italic"> in.</em>
          </h1>
          <p className="text-sm text-ink-dim mt-4 leading-relaxed max-w-xs mx-auto">
            Access your study command center, mock exams, and AI grading.
          </p>
        </div>

        {/* ─── Google OAuth ───────────────────────────────── */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-line-soft py-3.5 px-4 font-mono text-[11px] tracking-[0.15em] uppercase text-ink hover:border-signal hover:text-signal transition-colors mb-6"
        >
          <GoogleIcon className="w-5 h-5" />
          Continue with Google
        </button>

        {/* ─── Divider ────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <span className="flex-1 h-px bg-line-soft" />
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-faint">
            or sign in with email
          </span>
          <span className="flex-1 h-px bg-line-soft" />
        </div>

        {/* ─── Email form ─────────────────────────────────── */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <div className="text-xs text-red-400 font-mono bg-red-400/5 border border-red-400/20 p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black py-3.5 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        {/* ─── Footer links ───────────────────────────────── */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onNavigateForgot}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-dim hover:text-signal transition-colors"
          >
            Forgot password?
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-faint">
              New here?
            </span>
            <button
              onClick={onNavigateSignup}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-signal font-bold hover:text-white transition-colors"
            >
              Create account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared input component ──────────────────────────────────

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-transparent border border-line-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal transition-colors"
      />
    </div>
  );
}
