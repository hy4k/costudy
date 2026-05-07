import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onNavigateLogin: () => void;
}

export function ForgotPasswordPage({ onNavigateLogin }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg px-5">
      <div className="w-full max-w-md text-center">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-5">
          COSTUDY / RESET
        </div>

        {sent ? (
          <>
            <h1 className="font-display text-[clamp(40px,9vw,72px)] leading-[0.88] tracking-tight">
              Check<em className="text-signal italic"> inbox.</em>
            </h1>
            <p className="text-sm text-ink-dim mt-5 leading-relaxed max-w-xs mx-auto">
              If an account exists for <span className="text-signal">{email}</span>,
              we've sent a password reset link. Follow it to set a new password.
            </p>
            <button
              onClick={onNavigateLogin}
              className="mt-8 font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black px-6 py-3.5 hover:bg-white transition-colors"
            >
              Back to Sign In →
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-[clamp(48px,10vw,80px)] leading-[0.88] tracking-tight">
              Reset<em className="text-signal italic"> password.</em>
            </h1>
            <p className="text-sm text-ink-dim mt-4 leading-relaxed max-w-xs mx-auto mb-8">
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
              <div>
                <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent border border-line-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal transition-colors"
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 font-mono bg-red-400/5 border border-red-400/20 p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black py-3.5 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>

            <button
              onClick={onNavigateLogin}
              className="mt-6 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-dim hover:text-signal transition-colors"
            >
              ← Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
