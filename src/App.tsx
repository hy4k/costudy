import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Cinematic landing components
import { AmbientBackground } from "@/components/AmbientBackground";
import { BootLoader } from "@/components/BootLoader";
import { CTA } from "@/components/CTA";
import { CustomCursor } from "@/components/CustomCursor";
import { ExamsGrid } from "@/components/ExamsGrid";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { MobileStickyCTA } from "@/components/MobileStickyCTA";
import { Navigation } from "@/components/Navigation";
import { Testimonials } from "@/components/Testimonials";

// Auth pages
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { OnboardingPage } from "@/pages/OnboardingPage";

// Mock engine pages
import { MockList } from "@/pages/MockList";
import { MockAttempt } from "@/pages/MockAttempt";
import { MockResults } from "@/pages/MockResults";
import { StandaloneExam } from "@/pages/StandaloneExam";
import { AdminResults } from "@/pages/AdminResults";
import { CandidateResults } from "@/pages/CandidateResults";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return <div className="fixed inset-0 bg-white" />;

  return (
    <Routes>
      {/* ── Public: cinematic landing ─────────────────── */}
      <Route
        path="/"
        element={user ? <Navigate to="/app" replace /> : <LandingPage />}
      />

      {/* ── Auth pages ────────────────────────────────── */}
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

      {/* ── Onboarding (authed, incomplete) ───────────── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute
            allowIncompleteOnboarding
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => {}}
          >
            <OnboardingPage onComplete={() => nav("/app", { replace: true })} />
          </ProtectedRoute>
        }
      />

      {/* ── App: dashboard (authed + onboarded) ──────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => nav("/onboarding")}
          >
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ── Mock engine routes ────────────────────────── */}
      <Route
        path="/mocks"
        element={
          <ProtectedRoute
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => nav("/onboarding")}
          >
            <MockList onStart={(slug) => nav(`/mocks/${slug}/run`)} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mocks/:slug/run"
        element={
          <ProtectedRoute
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => nav("/onboarding")}
          >
            <MockAttemptWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:id"
        element={
          <ProtectedRoute
            onRequireLogin={() => nav("/login")}
            onRequireOnboarding={() => nav("/onboarding")}
          >
            <MockResultsWrapper />
          </ProtectedRoute>
        }
      />

      {/* ── Standalone exam (token-based, no auth) ──── */}
      <Route path="/exam/:token" element={<StandaloneExamWrapper />} />

      {/* ── Candidate results (token-scoped, no auth) ── */}
      <Route path="/exam/:token/results/:attemptId" element={<CandidateResultsWrapper />} />

      {/* ── Admin results (token-scoped, no auth) ───── */}
      <Route path="/admin/results/:token" element={<AdminResultsWrapper />} />

      {/* ── 404 ───────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Cinematic landing page ──────────────────────────────────────

function LandingPage() {
  useEffect(() => {
    document.body.classList.add("fx-grain", "fx-scanlines");
    return () => {
      document.body.classList.remove("fx-grain", "fx-scanlines");
    };
  }, []);

  return (
    <>
      <BootLoader />
      <CustomCursor />
      <AmbientBackground />
      <Navigation />
      <main className="relative z-[1]">
        <Hero />
        <Manifesto />
        <FeatureShowcase />
        <ExamsGrid />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
      <MobileStickyCTA />
    </>
  );
}

// ─── Dashboard (post-auth landing) ───────────────────────────────

function Dashboard() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-bg px-5 md:px-10 py-16">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal">
            COMMAND DECK / {profile?.primary_exam?.replace("_", " ").toUpperCase()}
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight mt-1 text-ink">
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
        <DashCard
          title="Mock Engine"
          desc="Full CMA mocks with AI essay grading"
          action="Start Mock →"
          onClick={() => nav("/mocks")}
        />
        <DashCard title="AI Mastermind" desc="RAG-powered tutoring from 26k+ CMA chunks" action="Coming soon" disabled />
        <DashCard title="Study Rooms" desc="Join rooms, match with partners" action="Coming soon" disabled />
        <DashCard title="StudyWall" desc="Community feed with vouching" action="Coming soon" disabled />
        <DashCard title="Mentor Booking" desc="Connect with CMA-certified mentors" action="Coming soon" disabled />
        <DashCard
          title="Profile"
          desc={`${profile?.tier?.toUpperCase() ?? "FREE"} · ${profile?.streak_days ?? 0}d streak`}
          action="Settings →"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

function DashCard({
  title,
  desc,
  action,
  onClick,
  disabled,
}: {
  title: string;
  desc: string;
  action: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-bg p-6 md:p-8 flex flex-col gap-3 min-h-[180px]">
      <h3 className="font-display text-2xl tracking-tight text-ink">{title}</h3>
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

// ─── Route param wrappers ────────────────────────────────────────

function StandaloneExamWrapper() {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/" replace />;
  return <StandaloneExam token={token} />;
}

function MockAttemptWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  if (!slug) return <Navigate to="/mocks" replace />;
  return <MockAttempt slug={slug} onComplete={(id) => nav(`/results/${id}`)} />;
}

function MockResultsWrapper() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/mocks" replace />;
  return <MockResults attemptId={id} />;
}

function CandidateResultsWrapper() {
  const { token, attemptId } = useParams<{ token: string; attemptId: string }>();
  if (!token || !attemptId) return <Navigate to="/" replace />;
  return <CandidateResults token={token} attemptId={attemptId} />;
}

function AdminResultsWrapper() {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/" replace />;
  return <AdminResults token={token} />;
}
