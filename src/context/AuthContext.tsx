import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  auth_provider: string;
  email_verified: boolean;
  tier: "free" | "pro" | "premium";
  role: "student" | "mentor" | "admin";
  onboarding_completed: boolean;
  onboarding_step: number;
  primary_exam: string | null;
  exam_window: string | null;
  study_hours_per_week: number | null;
  experience_level: string | null;
  streak_days: number;
  last_active_at: string | null;
  total_mocks: number;
  total_essays: number;
  city: string | null;
  country: string | null;
  timezone: string | null;
  created_at: string;
}

interface AuthState {
  /** null while loading, undefined if not authed */
  user: User | null | undefined;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: undefined,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// ─── Provider ───────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://api.costudy.in";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend (not directly from Supabase client)
  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const { profile: p } = await res.json();
        setProfile(p);
      }
    } catch (e) {
      console.warn("[auth] profile fetch failed:", e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    if (s?.access_token) await fetchProfile(s.access_token);
  }, [fetchProfile]);

  // Initial session + listener
  useEffect(() => {
    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        fetchProfile(s.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.access_token) {
        fetchProfile(s.access_token);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
