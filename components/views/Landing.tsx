import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';

const DARK_STORAGE_KEY = 'costudy-dark-mode';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FEATURES = [
  { title: 'Study Room', description: 'Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability.' },
  { title: 'Study with a Buddy', description: 'Find your accountability partner. Study along with CMA US students from outside India preparing for the same exam window. Align goals, track progress together, and push each other to pass.' },
  { title: 'Mock Exam in Real Platform', description: 'Full 4-hour simulations on the exact Prometric interface. Time pressure included. No surprises on exam day.' },
  { title: 'Hire Mentors', description: 'Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone.' },
  { title: 'Essay Grading', description: 'Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect.' },
  { title: 'AI Tutor', description: 'Ask anything about CMA. Get instant answers from your actual study materials — Gleim, Wiley, Hock. Real knowledge, not generic AI.' },
];

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_STORAGE_KEY) === 'true';
  });
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(DARK_STORAGE_KEY, String(isDark));
  }, [isDark]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden transition-colors">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <CoStudyLogo size="sm" variant={isDark ? 'dark' : 'light'} />
          <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDark((d) => !d)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:shadow-[0_0_20px_rgba(148,163,184,0.4)] dark:hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
          </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-14 sm:pt-16 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-[11vw] sm:text-[9vw] md:text-[7vw] lg:text-[120px] xl:text-[140px] font-extrabold leading-[0.9] tracking-tighter text-[#0a0a0a] dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            COSTUDY
          </h1>
          <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg lg:text-xl font-medium text-slate-500 dark:text-slate-400 tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            THE CMA-US SOCIAL LEARNING UNIVERSE
          </p>
          <p className="mt-1 text-sm sm:text-base md:text-lg lg:text-xl font-medium text-slate-500 dark:text-slate-400 tracking-[0.2em] sm:tracking-[0.25em] uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            THE EXAM-READY PLATFORM
          </p>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/30 hover:shadow-neon-red"
            >
              Join the Beta →
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-[0_0_20px_rgba(15,23,42,0.4)] dark:hover:shadow-[0_0_20px_rgba(248,250,252,0.3)]"
            >
              Sign In
            </button>
          </div>

          <div className="mt-8 sm:mt-10 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Invite-only Beta</span>
          </div>
        </div>

        <button
          onClick={() => scrollToSection(featuresRef)}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]"
        >
          <Icons.ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
        </button>
      </section>

      {/* Features Section — Same bright design for light & dark */}
      <section ref={featuresRef} className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Light: cyan/sky/emerald gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-100 dark:opacity-0" />
        {/* Dark: same gradient feel — dark base + vibrant cyan/emerald glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-cyan-950/50 to-emerald-950/50 opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(6,182,212,0.25)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,_rgba(16,185,129,0.2)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-[0.15em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Never Study Alone Again
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 sm:p-7 border transition-all duration-300
                  bg-white/90 dark:bg-white/5 backdrop-blur-xl
                  border-cyan-200/70 dark:border-cyan-500/30
                  hover:bg-white dark:hover:bg-white/10 hover:border-cyan-400/80 dark:hover:border-cyan-400/60
                  shadow-lg shadow-cyan-200/30 dark:shadow-cyan-500/10 hover:shadow-neon-cyan"
              >
                <span className="block text-xl font-bold text-cyan-600 dark:text-cyan-400 mb-3 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>{i + 1}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-display" style={{ fontFamily: "'Syne', sans-serif" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section — Same bright design for light & dark */}
      <section className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Light: bright emerald gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:opacity-0" />
        {/* Dark: same gradient feel — dark base + vibrant emerald/cyan glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-cyan-950/40 opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(16,185,129,0.3)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,_rgba(6,182,212,0.15)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/40 dark:border-emerald-500/30">
              For Teachers
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[0.12em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Teach globally. Earn fairly.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base font-medium font-display" style={{ fontFamily: "'Syne', sans-serif" }}>
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-14">
            {[
              { title: 'Verified Badge', desc: 'Build instant trust with students', icon: Icons.CheckBadge },
              { title: 'Flash Sessions', desc: 'Study rooms hire you, split fees', icon: Icons.Zap },
              { title: 'Set Your Rates', desc: 'You decide your worth', icon: Icons.DollarSign },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="group">
                  <div className="rounded-2xl p-6 sm:p-7 border transition-all duration-300
                    bg-white/90 dark:bg-white/5 backdrop-blur-xl
                    border-emerald-200/80 dark:border-white/10
                    hover:bg-white dark:hover:bg-white/10 hover:border-emerald-400/80 dark:hover:border-emerald-500/30
                    hover:shadow-neon-emerald">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-display" style={{ fontFamily: "'Syne', sans-serif" }}>{c.title}</h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-display" style={{ fontFamily: "'Syne', sans-serif" }}>{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="px-10 sm:px-12 py-4 sm:py-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/30 hover:shadow-neon-red"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section — Same bright design for light & dark */}
      <section className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Light: bright red/amber gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-amber-50 to-orange-100 dark:opacity-0" />
        {/* Dark: same gradient feel — dark base + vibrant red/amber glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-rose-950/40 to-amber-950/30 opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(239,68,68,0.25)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_100%,_rgba(251,191,36,0.15)_0%,_transparent_50%)] opacity-0 dark:opacity-100" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-6 border border-red-500/40 dark:border-red-500/30">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-[0.12em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Start free. Upgrade when ready.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base font-medium mb-8 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>
              No credit card required. Free tier available forever.
            </p>

            <div className="inline-flex backdrop-blur-sm rounded-xl p-1 border
              bg-white/80 border-rose-200/70 dark:bg-white/5 dark:border-white/10">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 sm:px-7 py-2.5 rounded-lg text-sm font-medium transition-all font-display ${billingCycle === 'MONTHLY' ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-5 sm:px-7 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 font-display ${billingCycle === 'YEARLY' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-neon-red' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Yearly
                <span className="text-xs bg-red-500/80 px-1.5 py-0.5 rounded">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group">
              <div className="rounded-2xl p-8 sm:p-10 border transition-all duration-300 h-full flex flex-col
                bg-white/90 dark:bg-white/5 backdrop-blur-xl
                border-red-200/60 dark:border-red-500/20
                hover:bg-white dark:hover:bg-white/10 hover:border-red-300/80 dark:hover:border-red-500/40
                hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.05)]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>Free</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display" style={{ fontFamily: "'Syne', sans-serif" }}>₹0</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-400 text-sm sm:text-base font-display leading-relaxed flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold rounded-xl text-sm transition-all border border-slate-200 dark:border-white/10 hover:shadow-neon-amber">
                  Get Started
                </button>
              </div>
            </div>

            <div className="group lg:-mt-4 lg:mb-4">
              <div className="relative rounded-2xl p-8 sm:p-10 border-2 transition-all duration-300 h-full flex flex-col
                bg-white/95 dark:bg-white/8 backdrop-blur-xl
                border-red-400/70 dark:border-red-500/50
                hover:border-red-500 dark:hover:border-red-500/80
                shadow-lg shadow-red-200/40 dark:shadow-red-500/10 hover:shadow-neon-red">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                  Popular
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>Pro</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display" style={{ fontFamily: "'Syne', sans-serif" }}>₹333</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-400 text-sm sm:text-base font-display leading-relaxed flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-red-500/30 hover:shadow-neon-red">
                  Upgrade to Pro
                </button>
              </div>
            </div>

            <div className="group">
              <div className="rounded-2xl p-8 sm:p-10 border transition-all duration-300 h-full flex flex-col
                bg-white/90 dark:bg-white/5 backdrop-blur-xl
                border-emerald-200/60 dark:border-emerald-500/30
                hover:bg-white dark:hover:bg-white/10 hover:border-emerald-400/80 dark:hover:border-emerald-500/50
                hover:shadow-neon-emerald">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 font-display" style={{ fontFamily: "'Syne', sans-serif" }}>Mentor</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display" style={{ fontFamily: "'Syne', sans-serif" }}>₹1,999</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-1">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-600 dark:text-slate-400 text-sm sm:text-base font-display leading-relaxed flex-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all hover:shadow-neon-emerald">
                  Become Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-[#1a1c29]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-[0.15em] uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ready to pass the CMA?
          </h2>
          <p className="text-slate-400 mb-8 font-medium font-display" style={{ fontFamily: "'Syne', sans-serif" }}>
            Join 847+ candidates studying smarter together.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/30 hover:shadow-neon-red"
          >
            Get Started Free →
          </button>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 bg-[#10121a] text-slate-400 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">COSTUDY</span>
              <span className="text-slate-500">CMA Success Universe</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:hello@costudy.in" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <p className="text-center mt-6 text-sm text-slate-500">
            © 2026 CoStudy. Built for CMA candidates worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
};
