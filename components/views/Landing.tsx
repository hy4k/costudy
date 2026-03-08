import React, { useState, useRef } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FEATURES = [
  { title: 'Study Room', description: 'Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability.' },
  { title: 'Study with a Buddy', description: 'Find your accountability partner. Align goals, track progress together, and push each other to pass.' },
  { title: 'Mock Exam in Real Platform', description: 'Full 4-hour simulations on the exact Prometric interface. Time pressure included. No surprises on exam day.' },
  { title: 'Hire Mentors', description: 'Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone.' },
  { title: 'Essay Grading', description: 'Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect.' },
  { title: 'AI Tutor', description: 'Ask anything about CMA. Get instant answers from your actual study materials — Gleim, Wiley, Hock. Real knowledge, not generic AI.' },
];

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <CoStudyLogo size="sm" variant="light" />
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-[12vw] sm:text-[10vw] md:text-[8vw] lg:text-[140px] font-black leading-[0.9] tracking-tighter text-[#0a0a0a]">
            COSTUDY
          </h1>
          <p className="mt-8 text-base sm:text-lg md:text-xl font-semibold text-slate-500 tracking-[0.25em] uppercase">
            The CMA-US Social Learning Universe
          </p>
          <p className="mt-1 text-base sm:text-lg md:text-xl font-semibold text-slate-500 tracking-[0.25em] uppercase">
            The Exam-Ready Platform
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
              Join the Beta →
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg"
            >
              Sign In
            </button>
          </div>

          <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-sm font-medium text-slate-600">Invite-only Beta</span>
          </div>
        </div>

        <button
          onClick={() => scrollToSection(featuresRef)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Icons.ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 sm:py-28 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-red-600 tracking-[0.3em] uppercase mb-3">Your Mission</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Six Pillars.
              <br />
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">One Clear Path.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-red-200/60 transition-all duration-300"
              >
                <div className="absolute left-0 top-8 bottom-8 w-1 bg-red-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="block text-3xl font-black text-slate-900/90 mb-4 font-mono">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="py-20 sm:py-28 px-6 bg-gradient-to-b from-white to-emerald-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              For Teachers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Teach globally. Earn fairly.
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { title: 'Verified Badge', desc: 'Build instant trust with students' },
              { title: 'Flash Sessions', desc: 'Study rooms hire you, split fees' },
              { title: 'Set Your Rates', desc: 'You decide your worth' },
            ].map((c, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">{c.title}</h3>
                <p className="text-slate-600 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 sm:py-28 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
              Simple Pricing
            </h2>
            <p className="text-slate-500">Start free. Upgrade when ready.</p>

            <div className="mt-6 inline-flex bg-slate-200 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'MONTHLY' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'bg-red-600 text-white shadow' : 'text-slate-600'}`}
              >
                Yearly
                <span className="text-xs bg-red-500/80 px-1.5 py-0.5 rounded">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Free</h3>
              <div className="mb-6">
                <span className="text-3xl font-black text-slate-900">₹0</span>
              </div>
              <ul className="space-y-3 mb-6 text-slate-600 text-sm">
                {['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all"
              >
                Get Started
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-red-500 shadow-lg relative -mt-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                Popular
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pro</h3>
              <div className="mb-6">
                <span className="text-3xl font-black text-slate-900">₹333</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
              <ul className="space-y-3 mb-6 text-slate-600 text-sm">
                {['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Upgrade to Pro
              </button>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Mentor</h3>
              <div className="mb-6">
                <span className="text-3xl font-black text-slate-900">₹1,999</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
              <ul className="space-y-3 mb-6 text-slate-600 text-sm">
                {['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Become Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 px-6 bg-[#1a1c29]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Ready to pass the CMA?
          </h2>
          <p className="text-slate-400 mb-8">
            Join 847+ candidates studying smarter together.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
          >
            Get Started Free →
          </button>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-[#10121a] text-slate-400 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">COSTUDY</span>
              <span className="text-slate-600">•</span>
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
