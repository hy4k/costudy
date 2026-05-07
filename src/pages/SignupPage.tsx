import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface Props {
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

export function SignupPage({ onNavigateLogin, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name || undefined,
        },
      },
    });
    setLoading(false);

    if (err) {
      if (err.message.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(err.message);
      }
      return;
    }

    // If email confirmation is required, show the confirmation message.
    // If your Supabase instance has "Confirm email" disabled, skip to onSuccess.
    setShowConfirmation(true);
  }

  async function handleGoogleSignup() {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (err) setError(err.message);
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg px-5">
        <div className="w-full max-w-md text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-5">
            COSTUDY / VERIFY
          </div>
          <h1 className="font-display text-[clamp(40px,9vw,72px)] leading-[0.88] tracking-tight">
            Check your<em className="text-signal italic"> inbox.</em>
          </h1>
          <p className="text-sm text-ink-dim mt-5 leading-relaxed max-w-xs mx-auto">
            We've sent a verification link to <span className="text-signal">{email}</span>.
            Click the link to activate your account, then come back here.
          </p>
          <button
            onClick={onNavigateLogin}
            className="mt-8 font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black px-6 py-3.5 hover:bg-white transition-colors"
          >
            Back to Sign In →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg px-5">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-5">
            COSTUDY / JOIN
          </div>
          <h1 className="font-display text-[clamp(48px,10vw,80px)] leading-[0.88] tracking-tight">
            Create<em className="text-signal italic"> account.</em>
          </h1>
          <p className="text-sm text-ink-dim mt-4 leading-relaxed max-w-xs mx-auto">
            Free forever. Upgrade when AI grading and premium mocks matter.
          </p>
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 border border-line-soft py-3.5 px-4 font-mono text-[11px] tracking-[0.15em] uppercase text-ink hover:border-signal hover:text-signal transition-colors mb-6"
        >
          <GoogleIcon className="w-5 h-5" />
          Sign up with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <span className="flex-1 h-px bg-line-soft" />
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-faint">
            or create with email
          </span>
          <span className="flex-1 h-px bg-line-soft" />
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <Field label="Your name" type="text" value={name} onChange={setName} placeholder="e.g. Midhun" autoComplete="name" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="6+ characters" autoComplete="new-password" />

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
            {loading ? "Creating…" : "Create Account →"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-faint">
            Already have an account?
          </span>
          <button
            onClick={onNavigateLogin}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-signal font-bold hover:text-white transition-colors"
          >
            Sign in →
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-2">
        {label}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full bg-transparent border border-line-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal transition-colors"
      />
    </div>
  );
}
