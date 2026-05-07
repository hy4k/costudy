import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: ReactNode;
  /** If true, skip the onboarding gate (for the onboarding page itself) */
  allowIncompleteOnboarding?: boolean;
  /** Called when user isn't authed — navigate to login */
  onRequireLogin: () => void;
  /** Called when user hasn't finished onboarding — navigate to onboarding */
  onRequireOnboarding: () => void;
}

/**
 * Gate component. Wrap any authenticated page with this.
 *
 * Usage in your router:
 *
 *   <ProtectedRoute
 *     onRequireLogin={() => nav('/login')}
 *     onRequireOnboarding={() => nav('/onboarding')}
 *   >
 *     <MockList ... />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowIncompleteOnboarding = false,
  onRequireLogin,
  onRequireOnboarding,
}: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    // Defer navigation to next tick to avoid rendering mid-redirect
    queueMicrotask(onRequireLogin);
    return <FullScreenLoader />;
  }

  if (!allowIncompleteOnboarding && profile && !profile.onboarding_completed) {
    queueMicrotask(onRequireOnboarding);
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="grid place-items-center h-screen bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-6 h-6 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim">
          AUTHENTICATING
        </span>
      </div>
    </div>
  );
}
