import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://api.costudy.in";

interface Props {
  onComplete: () => void;
}

type StepNumber = 1 | 2 | 3 | 4;

/**
 * Onboarding flow — runs once after first signup.
 *
 * Step 1 — Identity: display name + optional avatar
 * Step 2 — Exam target: which CMA part, exam window, experience level
 * Step 3 — Study plan: weekly hours, location
 * Step 4 — Welcome screen (marks onboarding complete)
 *
 * Each step auto-saves to the backend so the user can resume if they
 * close the tab. The ProtectedRoute component gates every app page
 * behind onboarding_completed.
 */
export function OnboardingPage({ onComplete }: Props) {
  const { user, profile, session, refreshProfile } = useAuth();
  const startStep = Math.max(1, Math.min(4, (profile?.onboarding_step ?? 0) + 1)) as StepNumber;
  const [step, setStep] = useState<StepNumber>(startStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [displayName, setDisplayName] = useState(profile?.display_name ?? user?.user_metadata?.full_name ?? "");

  // Step 2 state
  const [primaryExam, setPrimaryExam] = useState(profile?.primary_exam ?? "cma_p1");
  const [examWindow, setExamWindow] = useState(profile?.exam_window ?? "");
  const [experience, setExperience] = useState(profile?.experience_level ?? "beginner");

  // Step 3 state
  const [hours, setHours] = useState(String(profile?.study_hours_per_week ?? "10"));
  const [city, setCity] = useState(profile?.city ?? "");

  const saveStep = useCallback(
    async (stepNum: StepNumber, data: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/profile/onboarding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ step: stepNum, data }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Save failed");
        }
        await refreshProfile();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session, refreshProfile]
  );

  async function handleNext() {
    let ok = false;
    switch (step) {
      case 1:
        ok = await saveStep(1, { display_name: displayName.trim() || undefined });
        break;
      case 2:
        ok = await saveStep(2, { primary_exam: primaryExam, exam_window: examWindow || undefined, experience_level: experience });
        break;
      case 3:
        ok = await saveStep(3, { study_hours_per_week: parseInt(hours) || 10, city: city.trim() || undefined });
        break;
      case 4:
        ok = await saveStep(4, {});
        if (ok) { onComplete(); return; }
        break;
    }
    if (ok && step < 4) setStep((s) => Math.min(4, s + 1) as StepNumber);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ─── Progress bar ─────────────────────────── */}
      <div className="h-1 bg-line-soft">
        <div
          className="h-full bg-signal transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 grid place-items-center px-5 py-10">
        <div className="w-full max-w-lg">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-signal mb-6">
            ONBOARDING · STEP {step} / 4
          </div>

          {step === 1 && <Step1 name={displayName} onNameChange={setDisplayName} />}
          {step === 2 && (
            <Step2
              exam={primaryExam} onExamChange={setPrimaryExam}
              window={examWindow} onWindowChange={setExamWindow}
              experience={experience} onExperienceChange={setExperience}
            />
          )}
          {step === 3 && (
            <Step3
              hours={hours} onHoursChange={setHours}
              city={city} onCityChange={setCity}
            />
          )}
          {step === 4 && <Step4 name={displayName} exam={primaryExam} />}

          {error && (
            <div className="text-xs text-red-400 font-mono bg-red-400/5 border border-red-400/20 p-3 mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1) as StepNumber)}
                disabled={saving}
                className="flex-1 font-mono text-[11px] tracking-[0.25em] uppercase border border-line-soft py-3.5 text-ink-dim hover:border-signal hover:text-signal transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex-[2] font-mono text-[11px] tracking-[0.25em] uppercase font-bold bg-signal text-black py-3.5 hover:bg-white transition-colors disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : step === 4
                ? "Enter CoStudy →"
                : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────

function Step1({ name, onNameChange }: { name: string; onNameChange: (v: string) => void }) {
  return (
    <>
      <h1 className="font-display text-[clamp(40px,9vw,72px)] leading-[0.88] tracking-tight mb-3">
        Welcome to<em className="text-signal italic"> CoStudy.</em>
      </h1>
      <p className="text-sm text-ink-dim leading-relaxed mb-8 max-w-md">
        Let's set up your profile so your study partners and mentors know who you are.
      </p>
      <div>
        <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-2">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="How should we call you?"
          autoComplete="name"
          className="w-full bg-transparent border border-line-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal transition-colors"
          autoFocus
        />
        <p className="text-[10px] text-ink-faint font-mono mt-2 tracking-wide">
          Visible to other CoStudy users. You can change it later.
        </p>
      </div>
    </>
  );
}

function Step2(props: {
  exam: string; onExamChange: (v: string) => void;
  window: string; onWindowChange: (v: string) => void;
  experience: string; onExperienceChange: (v: string) => void;
}) {
  const exams = [
    { value: "cma_p1", label: "CMA Part 1", desc: "Financial Planning, Performance & Analytics" },
    { value: "cma_p2", label: "CMA Part 2", desc: "Strategic Financial Management" },
    { value: "ielts", label: "IELTS", desc: "Academic or General Training" },
    { value: "toefl", label: "TOEFL iBT", desc: "Test of English as a Foreign Language" },
    { value: "gre", label: "GRE", desc: "Graduate Record Examination" },
  ];

  const windows = [
    { value: "jan_feb_2026", label: "Jan–Feb 2026" },
    { value: "may_jun_2026", label: "May–Jun 2026" },
    { value: "sep_oct_2026", label: "Sep–Oct 2026" },
    { value: "undecided", label: "Not decided yet" },
  ];

  const levels = [
    { value: "beginner", label: "First attempt", desc: "Starting fresh" },
    { value: "intermediate", label: "Some prep done", desc: "Studied 1–3 months" },
    { value: "retaker", label: "Retaking", desc: "Attempted before, leveling up" },
  ];

  return (
    <>
      <h1 className="font-display text-[clamp(36px,8vw,64px)] leading-[0.88] tracking-tight mb-3">
        What are you<em className="text-signal italic"> preparing for?</em>
      </h1>
      <p className="text-sm text-ink-dim leading-relaxed mb-8">
        This shapes your mock engine, AI tutoring, and study room matching.
      </p>

      {/* Exam selection */}
      <div className="mb-6">
        <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-3">
          Target exam
        </label>
        <div className="grid gap-2">
          {exams.map((ex) => (
            <button
              key={ex.value}
              onClick={() => props.onExamChange(ex.value)}
              className={`text-left p-3.5 border transition-colors ${
                props.exam === ex.value
                  ? "border-signal bg-signal/10 text-ink"
                  : "border-line-soft text-ink-dim hover:border-signal/50"
              }`}
            >
              <div className="text-sm font-medium">{ex.label}</div>
              <div className="text-[10px] font-mono text-ink-dim mt-0.5">{ex.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Exam window */}
      {(props.exam === "cma_p1" || props.exam === "cma_p2") && (
        <div className="mb-6">
          <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-3">
            Exam window
          </label>
          <div className="grid grid-cols-2 gap-2">
            {windows.map((w) => (
              <button
                key={w.value}
                onClick={() => props.onWindowChange(w.value)}
                className={`p-3 border text-sm transition-colors ${
                  props.window === w.value
                    ? "border-signal bg-signal/10 text-ink"
                    : "border-line-soft text-ink-dim hover:border-signal/50"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Experience level */}
      <div>
        <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-3">
          Where are you at?
        </label>
        <div className="grid gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => props.onExperienceChange(l.value)}
              className={`text-left p-3.5 border transition-colors ${
                props.experience === l.value
                  ? "border-signal bg-signal/10 text-ink"
                  : "border-line-soft text-ink-dim hover:border-signal/50"
              }`}
            >
              <div className="text-sm font-medium">{l.label}</div>
              <div className="text-[10px] font-mono text-ink-dim mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Step3(props: {
  hours: string; onHoursChange: (v: string) => void;
  city: string; onCityChange: (v: string) => void;
}) {
  const hourOptions = ["5", "10", "15", "20", "25", "30+"];

  return (
    <>
      <h1 className="font-display text-[clamp(36px,8vw,64px)] leading-[0.88] tracking-tight mb-3">
        Your study<em className="text-signal italic"> rhythm.</em>
      </h1>
      <p className="text-sm text-ink-dim leading-relaxed mb-8">
        Helps us pace your mock schedule and match you with study partners on a similar timeline.
      </p>

      <div className="mb-6">
        <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-3">
          Hours per week you can dedicate
        </label>
        <div className="grid grid-cols-3 gap-2">
          {hourOptions.map((h) => (
            <button
              key={h}
              onClick={() => props.onHoursChange(h.replace("+", ""))}
              className={`p-3 border text-sm transition-colors ${
                props.hours === h.replace("+", "")
                  ? "border-signal bg-signal/10 text-ink"
                  : "border-line-soft text-ink-dim hover:border-signal/50"
              }`}
            >
              {h} hrs
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-dim block mb-2">
          City (optional — for partner matching)
        </label>
        <input
          type="text"
          value={props.city}
          onChange={(e) => props.onCityChange(e.target.value)}
          placeholder="e.g. Calicut, Kerala"
          className="w-full bg-transparent border border-line-soft px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-signal transition-colors"
        />
      </div>
    </>
  );
}

function Step4({ name, exam }: { name: string; exam: string }) {
  const examLabel: Record<string, string> = {
    cma_p1: "CMA Part 1",
    cma_p2: "CMA Part 2",
    ielts: "IELTS",
    toefl: "TOEFL iBT",
    gre: "GRE",
  };

  return (
    <div className="text-center py-8">
      <h1 className="font-display text-[clamp(48px,10vw,96px)] leading-[0.88] tracking-tight">
        You're<em className="text-signal italic"> in.</em>
      </h1>
      <p className="text-sm text-ink-dim mt-6 leading-relaxed max-w-md mx-auto">
        <span className="text-ink font-medium">{name || "You"}</span> — targeting{" "}
        <span className="text-signal">{examLabel[exam] ?? exam}</span>. Your mock engine, AI grading,
        study rooms, and mentor network are ready.
      </p>
      <div className="mt-10 grid grid-cols-3 gap-px bg-line-soft border border-line-soft max-w-sm mx-auto">
        <ReadyItem label="Mocks" icon="📝" />
        <ReadyItem label="AI Grading" icon="🧠" />
        <ReadyItem label="Study Rooms" icon="🎯" />
      </div>
    </div>
  );
}

function ReadyItem({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="bg-bg py-5 px-3 text-center">
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-dim">{label}</div>
    </div>
  );
}
