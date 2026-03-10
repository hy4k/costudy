import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';
import { LampContainer } from '../ui/lamp';

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
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
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
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
              Join the Beta →
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg"
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
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Icons.ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
        </button>
      </section>

      {/* Features Section — Lamp + Liquid Glass */}
      <section ref={featuresRef}>
        <LampContainer compact className="bg-slate-900">
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-[0.15em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Never Study Alone Again
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-white/60 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-white/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
                >
                  <span className="block text-2xl sm:text-3xl font-black text-slate-900 mb-3 sm:mb-4 font-mono">
                    {i + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed font-medium">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </LampContainer>
      </section>

      {/* Teachers Section — Redesigned */}
      <section className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Dark background */}
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(16,185,129,0.2)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,_rgba(239,68,68,0.08)_0%,_transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/30">
              For Teachers
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-[0.12em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Teach globally. Earn fairly.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg font-medium">
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-14 sm:mb-16">
            {[
              { title: 'Verified Badge', desc: 'Build instant trust with students', icon: Icons.CheckBadge },
              { title: 'Flash Sessions', desc: 'Study rooms hire you, split fees', icon: Icons.Zap },
              { title: 'Set Your Rates', desc: 'You decide your worth', icon: Icons.DollarSign },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="group">
                  <div className="relative rounded-2xl p-8 sm:p-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{c.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="px-10 sm:px-12 py-4 sm:py-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm sm:text-base uppercase tracking-wider transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section — Same dark/glass style as Teachers, distinct accents */}
      <section className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Dark background — red/amber gradients (distinct from Teachers' emerald) */}
        <div className="absolute inset-0 bg-slate-900 dark:bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(239,68,68,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_100%,_rgba(251,191,36,0.06)_0%,_transparent_50%)]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-6 border border-red-500/30">
              Simple Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-[0.12em] uppercase leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Start free. Upgrade when ready.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg font-medium mb-8">
              No credit card required. Free tier available forever.
            </p>

            <div className="inline-flex bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 sm:px-7 py-2.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'MONTHLY' ? 'bg-white/20 text-white border border-white/20' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-5 sm:px-7 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
              >
                Yearly
                <span className="text-xs bg-red-500/80 px-1.5 py-0.5 rounded">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group">
              <div className="relative rounded-2xl p-8 sm:p-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-slate-400/20 transition-all duration-300 h-full flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Free</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹0</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-400 text-sm flex-1">
                  {['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onGetStarted}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-all border border-white/10"
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="group lg:-mt-4 lg:mb-4">
              <div className="relative rounded-2xl p-8 sm:p-10 bg-white/8 backdrop-blur-xl border-2 border-red-500/50 hover:border-red-500/80 transition-all duration-300 h-full flex flex-col shadow-lg shadow-red-500/10">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                  Popular
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Pro</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹333</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-400 text-sm flex-1">
                  {['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onGetStarted}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-red-500/25"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            <div className="group">
              <div className="relative rounded-2xl p-8 sm:p-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Mentor</h3>
                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹1,999</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-6 text-slate-400 text-sm flex-1">
                  {['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={onGetStarted}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all"
                >
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
          <p className="text-slate-400 mb-8 font-medium">
            Join 847+ candidates studying smarter together.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
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
