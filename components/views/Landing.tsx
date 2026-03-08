import React, { useState, useRef } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';
import { LampContainer } from '../ui/lamp';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Liquid glass feature box - no icons, numbers 1-6
const FeatureBox: React.FC<{
  number: number;
  title: string;
  description: string;
  delay?: number;
}> = ({ number, title, description, delay = 0 }) => {
  return (
    <div
      className="group relative rounded-3xl p-8 sm:p-10 overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-shadow" />
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
      
      <div className="relative">
        <span className="inline-block font-mono text-4xl font-black text-slate-900/90 mb-4 tracking-tighter">
          {number}
        </span>
        <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed text-[15px] font-medium">
          {description}
        </p>
      </div>
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const featuresRef = useRef<HTMLDivElement>(null);
  const teachersRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation - Sign In removed (available in hero CTAs) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center h-16 sm:h-20">
            <CoStudyLogo size="sm" variant="light" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-white pointer-events-none" />
        
        <div className="relative text-center max-w-5xl mx-auto">
          {/* COSTUDY - Premium dark black */}
          <h1 className="text-[15vw] sm:text-[12vw] md:text-[10vw] lg:text-[180px] font-black leading-none tracking-tighter select-none text-[#0a0a0a]">
            COSTUDY
          </h1>
          
          {/* Sub-heading - Capital letters, lighter gray per reference */}
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase">
            The CMA-US Social Learning Universe
          </p>
          <p className="mt-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase">
            The Exam-Ready Platform
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-100 uppercase tracking-wider"
            >
              Join the Beta →
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold rounded-xl transition-all shadow-xl shadow-slate-900/25 hover:shadow-slate-900/40 hover:scale-105 active:scale-100 uppercase tracking-wider"
            >
              Sign In
            </button>
          </div>

          {/* Beta badge */}
          <div className="mt-12 inline-flex items-center gap-3 px-5 py-2.5 bg-slate-100 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-slate-600 font-medium">Invite-only Beta</span>
          </div>
        </div>

        <button 
          onClick={() => scrollToSection(featuresRef)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Icons.ChevronDown className="w-8 h-8 text-slate-300" />
        </button>
      </section>

      {/* Features Section - Lamp + liquid glass boxes */}
      <section ref={featuresRef} className="relative">
        <LampContainer compact>
          <div className="relative z-50 w-full max-w-6xl mx-auto px-6 py-24 sm:py-32">
            <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-black text-white mb-16 sm:mb-20 tracking-[0.15em] uppercase">
              Never Study Alone Again
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <FeatureBox
                number={1}
                title="AI Tutor"
                description="Ask anything about CMA. Get instant answers from your actual study materials — Gleim, Wiley, Hock. Real knowledge, not generic AI."
                delay={0}
              />
              <FeatureBox
                number={2}
                title="Study Rooms"
                description="Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability."
                delay={50}
              />
              <FeatureBox
                number={3}
                title="Unlimited MCQs"
                description="5,000+ practice questions by topic. Track your weak spots. See exactly what to focus on. Master every concept."
                delay={100}
              />
              <FeatureBox
                number={4}
                title="Essay Grading"
                description="Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect."
                delay={150}
              />
              <FeatureBox
                number={5}
                title="Mock Exams"
                description="Full 4-hour simulations. Exact Prometric interface. Time pressure included. No surprises on exam day."
                delay={200}
              />
              <FeatureBox
                number={6}
                title="Hire Mentors"
                description="Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone."
                delay={250}
              />
            </div>
          </div>
        </LampContainer>
      </section>

      {/* Teachers Section - Green theme, stacked cards */}
      <section ref={teachersRef} className="py-24 sm:py-32 px-6 bg-[#e6ffed]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-emerald-400 bg-emerald-50/80 mb-8">
              <Icons.GraduationCap className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">For Teachers</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-emerald-900 mb-6 tracking-tight">
              Teach globally. Earn fairly.
            </h2>
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="stacked-card-wrapper flex justify-center">
              <div className="stacked-card rounded-2xl">
                <h3 className="text-xl font-black text-slate-900 mb-2">Verified Badge</h3>
                <p className="text-slate-600 font-medium">Build instant trust with students</p>
              </div>
            </div>
            <div className="stacked-card-wrapper flex justify-center">
              <div className="stacked-card rounded-2xl">
                <h3 className="text-xl font-black text-slate-900 mb-2">Flash Sessions</h3>
                <p className="text-slate-600 font-medium">Study rooms hire you, split fees</p>
              </div>
            </div>
            <div className="stacked-card-wrapper flex justify-center">
              <div className="stacked-card rounded-2xl">
                <h3 className="text-xl font-black text-slate-900 mb-2">Set Your Rates</h3>
                <p className="text-slate-600 font-medium">You decide your worth</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={onGetStarted}
              className="px-12 py-5 bg-white/80 backdrop-blur-xl border border-white/40 text-emerald-800 text-lg font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-1 active:scale-95"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-24 sm:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-slate-500 font-medium">
              Start free. Upgrade when ready.
            </p>
            
            {/* Billing toggle */}
            <div className="mt-8 inline-flex bg-slate-100 rounded-full p-1.5 gap-1">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${billingCycle === 'MONTHLY' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'YEARLY' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Yearly
                <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm hover:shadow-lg transition-all">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Free</h3>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">₹0</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan - Popular */}
            <div className="bg-white rounded-3xl p-8 border-2 border-red-500 shadow-xl relative -translate-y-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-full">Popular</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Pro</h3>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">₹333</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Mentor Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm hover:shadow-lg transition-all">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Mentor</h3>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">₹1,999</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetStarted}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                Become Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Post-it note design */}
      <section className="py-24 sm:py-32 px-6 bg-[#1a1c29]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Ready to pass the CMA?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join 847+ candidates studying smarter together.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-12 py-5 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition-all shadow-xl hover:shadow-red-500/30"
          >
            Get Started Free →
          </button>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Footer - Post-it note design */}
      <footer className="py-12 px-6 bg-[#10121a] text-slate-400 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">COSTUDY</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">CMA Success Universe</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:hello@costudy.in" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-slate-500">
            © 2026 CoStudy. Built for CMA candidates worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
};
