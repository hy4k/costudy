import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';

const DARK_STORAGE_KEY = 'costudy-dark-mode';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FEATURES = [
  { icon: '🏠', title: 'Study Room', description: 'Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability.' },
  { icon: '👥', title: 'Study with a Buddy', description: 'Find your accountability partner. Study along with CMA US students from outside India preparing for the same exam window. Align goals, track progress together, and push each other to pass.' },
  { icon: '📝', title: 'Mock Exam in Real Platform', description: 'Full 4-hour simulations on the exact Prometric interface. Time pressure included. No surprises on exam day.' },
  { icon: '🎓', title: 'Hire Mentors', description: 'Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone.' },
  { icon: '✍️', title: 'Essay Grading', description: 'Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect.' },
  { icon: '🤖', title: 'AI Tutor', description: 'Ask anything about CMA. Get instant answers from your actual study materials — Gleim, Wiley, Hock. Real knowledge, not generic AI.' },
];

const FREE_FEATURES = ['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'];
const PRO_FEATURES = ['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'];
const MENTOR_FEATURES = ['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'];

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_STORAGE_KEY) === 'true';
  });
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(DARK_STORAGE_KEY, String(isDark));
  }, [isDark]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.anim-timeline, .anim-pricing').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setShowStickyCTA(heroRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafbfc] dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">

      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/15 bg-white/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 dark:border-slate-700/10 dark:bg-slate-900/80 dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            THE CMA-US SOCIAL LEARNING UNIVERSE
          </div>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:scale-105 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {isDark ? <Icons.Sun className="h-5 w-5" /> : <Icons.Moon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="hero-enhanced relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24"
      >
        <h1
          className="font-display relative z-10 mb-8 text-center font-black leading-[0.9] tracking-[-0.04em]"
          style={{
            fontSize: 'clamp(5rem, 18vw, 14rem)',
            textShadow: '0 4px 0 rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.06), 0 2px 0 rgba(255,255,255,0.6)',
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.08))',
            animation: 'scaleIn 0.8s ease-out',
          }}
        >
          <span style={{ color: '#ff1a1a' }}>CO</span>
          <span className="text-[#0a0a0a] dark:text-white">STUDY</span>
        </h1>

        <p
          className="relative z-10 text-center font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400"
          style={{ fontSize: 'clamp(0.875rem, 2vw, 1.25rem)', animation: 'fadeIn 0.8s ease-out 0.2s both' }}
        >
          THE EXAM-READY PLATFORM
        </p>

        <div
          className="relative z-10 mt-12 flex flex-wrap justify-center gap-4"
          style={{ animation: 'fadeIn 0.8s ease-out 0.4s both' }}
        >
          <button
            onClick={onGetStarted}
            className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,_#ff1a1a_0%,_#ed0000_100%)] px-10 py-[1.125rem] text-sm font-bold uppercase tracking-[0.1em] text-white shadow-[0_6px_20px_-4px_rgba(239,68,68,0.5),_inset_0_1px_0_rgba(255,255,255,0.25),_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-10px_rgba(239,68,68,0.6),_0_0_40px_rgba(239,68,68,0.3)]"
          >
            Join the Beta →
          </button>
          <button
            onClick={onLogin}
            className="rounded-2xl border border-white/60 bg-white/80 px-10 py-[1.125rem] text-sm font-bold uppercase tracking-[0.1em] text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)] dark:border-white/5 dark:bg-slate-800/80 dark:text-white"
            style={{ boxShadow: '4px 4px 16px rgba(15,23,42,0.06), -2px -2px 10px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.8)' }}
          >
            Sign In
          </button>
        </div>

        <div
          className="relative z-10 mt-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 dark:bg-slate-800"
          style={{ animation: 'fadeIn 0.8s ease-out 0.6s both' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Invite-only Beta</span>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="animate-bounce p-2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Icons.ChevronDown className="h-6 w-6" />
          </button>
        </div>
      </section>

      {/* Features Timeline */}
      <section
        id="features"
        className="relative px-6 py-32 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_50%,_#f8fafc_100%)] dark:bg-[linear-gradient(180deg,_#0f172a_0%,_#1e293b_50%,_#0f172a_100%)]"
      >

        <div className="mx-auto mb-24 max-w-2xl text-center">
          <div className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-brand">
            Never Study Alone Again
          </div>
          <h2
            className="font-display mb-6 font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0a0a0a] dark:text-white"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            Built for CMA Success
          </h2>
          <p className="text-xl leading-[1.8] text-slate-500 dark:text-slate-400">
            Six powerful features working together to transform how you prepare for the CMA exam.
          </p>
        </div>

        <div className="timeline-enhanced relative mx-auto max-w-5xl">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={`anim-timeline relative mb-24 flex gap-16 max-md:flex-col max-md:gap-6 max-md:pl-20 ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
              style={{ transitionDelay: `${index * 0.08}s` }}
            >
              <div className="timeline-number">{index + 1}</div>

              <div
                className="timeline-card flex-1 rounded-3xl border border-white/60 bg-white/85 p-12 dark:border-white/5 dark:bg-slate-800/80"
                style={{ boxShadow: '8px 8px 24px rgba(15,23,42,0.08), -4px -4px 16px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.8)' }}
              >
                <div
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(6,182,212,0.1))' }}
                >
                  {feature.icon}
                </div>
                <h3 className="font-display mb-4 text-3xl font-extrabold tracking-[-0.01em] text-[#0a0a0a] dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-lg leading-[1.8] text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>

              <div className="flex-1 max-md:hidden" />
            </div>
          ))}
        </div>
      </section>

      {/* Teachers Section */}
      <section className="relative overflow-hidden px-6 py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-cyan-950/40 opacity-0 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(16,185,129,0.3),transparent_50%)] opacity-0 dark:opacity-100" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="mb-6 inline-block rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">
              For Teachers
            </span>
            <h2 className="font-display mb-4 text-3xl font-semibold uppercase leading-tight tracking-[0.12em] text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
              Teach globally. Earn fairly.
            </h2>
            <p className="mx-auto max-w-xl text-base font-medium leading-[1.65] text-slate-600 dark:text-slate-400">
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="mb-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              { title: 'Verified Badge', desc: 'Build instant trust with students', icon: Icons.CheckBadge },
              { title: 'Flash Sessions', desc: 'Study rooms hire you, split fees', icon: Icons.Zap },
              { title: 'Set Your Rates', desc: 'You decide your worth', icon: Icons.DollarSign },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-emerald-200/80 bg-white/90 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-400/80 hover:bg-white hover:shadow-neon-emerald dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30 dark:hover:bg-white/10 sm:p-7"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  </div>
                  <p className="text-sm leading-[1.65] text-slate-600 dark:text-slate-400">{c.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="rounded-xl bg-brand px-10 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-600 hover:shadow-neon-red sm:px-12 sm:py-5"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative overflow-hidden px-6 py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-amber-50/80 dark:opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#450a0a] to-[#451a03] opacity-0 dark:opacity-100" />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.15), transparent)' }} />

        <div className="relative mx-auto max-w-6xl">
          <div className="relative mx-auto mb-20 max-w-2xl text-center">
            <div className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-brand">
              Simple Pricing
            </div>
            <h2
              className="font-display mb-6 font-extrabold leading-[1.1] tracking-[-0.02em] text-[#0a0a0a] dark:text-white"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              Start Free. Upgrade When Ready.
            </h2>
            <p className="mb-8 text-xl leading-[1.8] text-slate-500 dark:text-slate-400">
              No credit card required. Free tier available forever.
            </p>

            <div className="inline-flex rounded-xl border border-rose-200/70 bg-white/80 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all sm:px-7 ${billingCycle === 'MONTHLY' ? 'border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/20 dark:bg-white/20 dark:text-white' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all sm:px-7 ${billingCycle === 'YEARLY' ? 'bg-brand text-white shadow-lg shadow-brand/25 hover:shadow-neon-red' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                Yearly
                <span className="rounded bg-red-500/80 px-1.5 py-0.5 text-xs">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Free */}
            <div
              className="anim-pricing pricing-card-3d flex flex-col rounded-3xl border border-white/60 bg-white/85 p-12 dark:border-slate-700 dark:bg-slate-800"
              style={{ boxShadow: '8px 8px 24px rgba(15,23,42,0.08), -4px -4px 16px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.8)' }}
            >
              <h3 className="font-display mb-4 text-2xl font-extrabold text-[#0a0a0a] dark:text-white">Free</h3>
              <div className="mb-2 text-[3.5rem] font-black leading-none text-[#0a0a0a] dark:text-white">₹0</div>
              <ul className="my-8 flex-1 space-y-3">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Icons.CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-4 text-sm font-bold uppercase tracking-[0.1em] text-slate-800 transition-all hover:bg-slate-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Get Started
              </button>
            </div>

            {/* Pro — featured */}
            <div
              className="anim-pricing pricing-card-3d featured relative flex flex-col rounded-3xl border-2 border-brand bg-white/85 p-12 dark:bg-slate-800 lg:-mt-6 lg:mb-6"
              style={{ boxShadow: '0 20px 60px -20px rgba(239,68,68,0.3)' }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-white">
                Popular
              </div>
              <h3 className="font-display mb-4 text-2xl font-extrabold text-[#0a0a0a] dark:text-white">Pro</h3>
              <div className="mb-2 leading-none">
                <span className="text-[3.5rem] font-black text-[#0a0a0a] dark:text-white">₹333</span>
                <span className="ml-1 text-xl text-slate-500">/mo</span>
              </div>
              <ul className="my-8 flex-1 space-y-3">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Icons.CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:shadow-neon-red"
                style={{ background: 'linear-gradient(135deg, #ff1a1a 0%, #ed0000 100%)', boxShadow: '0 6px 20px -4px rgba(239,68,68,0.5)' }}
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Mentor */}
            <div
              className="anim-pricing pricing-card-3d flex flex-col rounded-3xl border border-white/60 bg-white/85 p-12 dark:border-slate-700 dark:bg-slate-800"
              style={{ transitionDelay: '0.2s', boxShadow: '8px 8px 24px rgba(15,23,42,0.08), -4px -4px 16px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.8)' }}
            >
              <h3 className="font-display mb-4 text-2xl font-extrabold text-[#0a0a0a] dark:text-white">Mentor</h3>
              <div className="mb-2 leading-none">
                <span className="text-[3.5rem] font-black text-[#0a0a0a] dark:text-white">₹1,999</span>
                <span className="ml-1 text-xl text-slate-500">/mo</span>
              </div>
              <ul className="my-8 flex-1 space-y-3">
                {MENTOR_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Icons.CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-emerald-500 hover:shadow-neon-emerald"
              >
                Become Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#1a1c29] px-6 py-32 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(239,68,68,0.2), transparent)' }} />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2
            className="font-display mb-6 font-extrabold tracking-[-0.02em] text-white"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            Ready to pass the CMA?
          </h2>
          <p className="mb-12 text-xl leading-[1.8] text-slate-300">
            Join 847+ candidates studying smarter together.
          </p>
          <button
            onClick={onGetStarted}
            className="rounded-2xl px-10 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #ff1a1a 0%, #ed0000 100%)',
              boxShadow: '0 6px 20px -4px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.3)',
            }}
          >
            Get Started Free →
          </button>
          <p className="mt-8 text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-[#10121a] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 text-slate-400 sm:flex-row">
            <div className="flex items-center gap-2">
              <strong className="text-white">COSTUDY</strong>
              <span className="text-slate-500">CMA Success Universe</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="transition-colors hover:text-white">About</a>
              <a href="#" className="transition-colors hover:text-white">Privacy</a>
              <a href="#" className="transition-colors hover:text-white">Terms</a>
              <a href="mailto:hello@costudy.in" className="transition-colors hover:text-white">Contact</a>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            © 2026 CoStudy. Built for CMA candidates worldwide.
          </p>
        </div>
      </footer>

      {/* Sticky CTA */}
      <div
        className={`fixed bottom-8 right-8 z-[999] transition-all duration-300 max-sm:bottom-4 max-sm:left-4 max-sm:right-4 ${showStickyCTA ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-5 scale-95 opacity-0'}`}
      >
        <button
          onClick={onGetStarted}
          className="w-full rounded-2xl px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 sm:w-auto"
          style={{
            background: 'linear-gradient(135deg, #ff1a1a 0%, #ed0000 100%)',
            boxShadow: '0 20px 60px -10px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.4)',
          }}
        >
          Join the Beta →
        </button>
      </div>

    </div>
  );
};
