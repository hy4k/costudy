import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onReady: (needsOnboarding: boolean) => void;
}

/**
 * Mounted at /auth/callback. Supabase redirects here after:
 *   - Google OAuth sign-in
 *   - Email verification click
 *   - Password reset click
 *
 * The session tokens are in the URL hash — Supabase JS auto-extracts them.
 * We wait for the session, check onboarding state, and redirect.
 */
export function AuthCallbackPage({ onReady }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      // Supabase JS reads the hash automatically on getSession().
      // We just need to wait for it to settle.
      const {
        data: { session },
        error: err,
      } = await supabase.auth.getSession();

      if (err || !session) {
        setError(err?.message ?? "Authentication failed. Please try again.");
        return;
      }

      // Check if onboarding is done
      const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://api.costudy.in";
      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { profile } = await res.json();
          onReady(!profile.onboarding_completed);
        } else {
          // New user — profile may not exist yet (trigger creates it async).
          // Give the trigger 1s to fire, then redirect to onboarding.
          await new Promise((r) => setTimeout(r, 1000));
          onReady(true);
        }
      } catch {
        // Network issue — assume onboarding needed; the app will handle it
        onReady(true);
      }
    }

    handleCallback();
  }, [onReady]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg px-5">
        <div className="text-center max-w-md">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-red-400 mb-3">
            AUTH ERROR
          </div>
          <p className="text-sm text-ink">{error}</p>
          <a
            href="/login"
            className="inline-block mt-6 font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black px-6 py-3.5 hover:bg-white transition-colors"
          >
            Try Again →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim">
          COMPLETING AUTHENTICATION
        </span>
      </div>
    </div>
  );
}
