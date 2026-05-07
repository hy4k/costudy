/**
 * Example App.tsx — shows how to wire auth into the cinematic CoStudy frontend.
 *
 * This file is a REFERENCE — adapt the routing to match your actual setup.
 * If you're using ViewState instead of react-router, translate the concepts
 * (same auth gates, same page components, different navigation mechanism).
 *
 * Dependencies:
 *   npm install react-router-dom
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { OnboardingPage } from "@/pages/OnboardingPage";

// From the cinematic landing (Phase 1):
// import { HeroSection } from "@/components/Hero/HeroSection";

// From the mock engine (Phase 2):
// import { MockList } from "@/pages/MockList";
// import { MockAttempt } from "@/pages/MockAttempt";
// import { MockResults } from "@/pages/MockResults";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  // While auth state is resolving, show nothing (prevents flash)
  if (loading) return null;

  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────── */}

      {/* Landing page — the cinematic hero from Phase 1 */}
      <Route path="/" element={<LandingOrDashboard />} />

      {/* Auth pages — redirect to /app if already logged in */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage
              onNavigateSignup={() => nav("/signup")}
              onNavigateForgot={() => nav("/forgot-password")}
              onSuccess={() => nav("/app")}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/app" replace />
          ) : (
            <SignupPage
              onNavigateLogin={() => nav("/login")}
              onSuccess={() => nav("/auth/callback")}
            />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage onNavigateLogin={() => nav("/login")} />}
      />

      {/* OAuth + email verification callback */}
      <Route
        path="/auth/callback"
        element={
          <AuthCallbackPage
            onReady={(needsOnboarding) =>
              nav(needsOnboarding ? "/onboarding" : "/app", { replace: true })
            }
          />
        }
      />

      {/* ── Onboarding (authed but incomplete) ────────── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute
            allowIncompleteOnboarding
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => {}} // already here
          >
            <OnboardingPage onComplete={() => nav("/app", { replace: true })} />
          </ProtectedRoute>
        }
      />

      {/* ── App routes (authed + onboarded) ───────────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => nav("/onboarding")}
          >
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />

      {/*
      <Route path="/mocks" element={
        <ProtectedRoute ...>
          <MockList onStart={(slug) => nav(`/mocks/${slug}/run`)} />
        </ProtectedRoute>
      } />
      <Route path="/mocks/:slug/run" element={...} />
      <Route path="/results/:id" element={...} />
      */}

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Landing page logic:
 *   - Not logged in → cinematic landing
 *   - Logged in → redirect to /app (the Command Deck)
 */
function LandingOrDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  if (user) return <Navigate to="/app" replace />;

  // Replace this with your actual cinematic landing from Phase 1
  return (
    <div className="min-h-screen bg-bg grid place-items-center px-5">
      <div className="text-center max-w-2xl">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-5">
          COSTUDY / COMMAND CENTER
        </div>
        <h1 className="font-display text-[clamp(48px,12vw,120px)] leading-[0.88] tracking-tight">
          Study smarter.<br />
          <em className="text-signal italic">Pass the CMA.</em>
        </h1>
        <p className="text-sm text-ink-dim mt-5 leading-relaxed max-w-lg mx-auto">
          AI-graded mock exams, study rooms, mentor matching, and a drill engine
          that knows your weak spots. Built by FETS — the test center that
          delivers the actual exam.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <button
            onClick={() => nav("/signup")}
            className="font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black px-7 py-3.5 hover:bg-white transition-colors"
          >
            Get Started — Free →
          </button>
          <button
            onClick={() => nav("/login")}
            className="font-mono text-[11px] tracking-[0.25em] uppercase border border-line-soft px-7 py-3.5 text-ink-dim hover:border-signal hover:text-signal transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-bg px-5 md:px-10 py-16">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal">
            COMMAND DECK / {profile?.primary_exam?.replace("_", " ").toUpperCase()}
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1">
            Welcome back, <span className="text-signal">{profile?.display_name}</span>
          </h1>
        </div>
        <button
          onClick={signOut}
          className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim hover:text-signal transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line-soft border border-line-soft">
        <DashCard title="Mock Engine" desc="Full CMA mocks with AI essay grading" action="Start Mock →" onClick={() => nav("/mocks")} />
        <DashCard title="AI Mastermind" desc="RAG-powered tutoring from 26k+ CMA chunks" action="Coming soon" disabled />
        <DashCard title="Study Rooms" desc="Join rooms, match with partners" action="Coming soon" disabled />
        <DashCard title="StudyWall" desc="Community feed with vouching" action="Coming soon" disabled />
        <DashCard title="Mentor Booking" desc="Connect with CMA-certified mentors" action="Coming soon" disabled />
        <DashCard title="Profile" desc={`${profile?.tier?.toUpperCase()} · ${profile?.streak_days}d streak`} action="Settings →" onClick={() => {}} />
      </div>
    </div>
  );
}

function DashCard({ title, desc, action, onClick, disabled }: {
  title: string; desc: string; action: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <div className="bg-bg p-6 md:p-8 flex flex-col gap-3 min-h-[180px]">
      <h3 className="font-display text-2xl tracking-tight">{title}</h3>
      <p className="text-sm text-ink-dim leading-relaxed flex-1">{desc}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`self-start font-mono text-[10px] tracking-[0.25em] uppercase font-bold ${
          disabled
            ? "text-ink-faint cursor-not-allowed"
            : "text-signal hover:text-white transition-colors"
        }`}
      >
        {action}
      </button>
    </div>
  );
}
