import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Custom hook for scroll-triggered animations
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Animated counter component
const AnimatedCounter = ({ target, duration = 2000, suffix = '' }: { target: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.5);

  useEffect(() => {
    if (!isVisible) return;
    
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [currentSpend, setCurrentSpend] = useState(80000); // Default to Gleim price
  const [scrollY, setScrollY] = useState(0);
  const [activeStorySection, setActiveStorySection] = useState(0);

  // Track scroll for parallax and story progression
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Calculate which story section is active
      const vh = window.innerHeight;
      const section = Math.floor(window.scrollY / (vh * 0.8));
      setActiveStorySection(section);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pricing = {
    monthly: { price: 499, period: '/month' },
    yearly: { price: 3999, period: '/year', monthly: 333 },
  };

  const savings = currentSpend - pricing.yearly.price;
  const savingsPercent = Math.round((savings / currentSpend) * 100);

  // Scroll reveal hooks for each section
  const heroReveal = useScrollReveal(0.1);
  const storyReveal = useScrollReveal(0.2);
  const commandDeckReveal = useScrollReveal(0.15);
  const alignmentReveal = useScrollReveal(0.15);
  const studyRoomsReveal = useScrollReveal(0.15);
  const pricingReveal = useScrollReveal(0.15);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ============================================ */}
      {/* FIXED HEADER */}
      {/* ============================================ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 100 ? 'bg-slate-950/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand/30">
              <Icons.BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">CoStudy</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="px-6 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Log In
            </button>
            <button onClick={onGetStarted} className="group px-6 py-2.5 bg-gradient-to-r from-brand to-violet-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand/30 transition-all hover:scale-105">
              Start Free
              <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO - THE OPENING SCENE */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Floating Connection Lines - Representing Global Network */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <defs>
              <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0" />
                <stop offset="50%" stopColor="#F43F5E" stopOpacity="1" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#lineGrad1)" strokeWidth="1">
              <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
            </line>
            <line x1="80%" y1="10%" x2="20%" y2="70%" stroke="url(#lineGrad1)" strokeWidth="1">
              <animate attributeName="opacity" values="0;1;0" dur="5s" repeatCount="indefinite" begin="1s" />
            </line>
            <line x1="5%" y1="60%" x2="95%" y2="30%" stroke="url(#lineGrad1)" strokeWidth="1">
              <animate attributeName="opacity" values="0;1;0" dur="6s" repeatCount="indefinite" begin="2s" />
            </line>
          </svg>
        </div>

        <div ref={heroReveal.ref} className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${
          heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Global Exam Performance Infrastructure</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] mb-8">
            <span className="block text-white">The Exam is</span>
            <span className="block bg-gradient-to-r from-brand via-violet-400 to-brand bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Global.
            </span>
            <span className="block text-slate-400 text-3xl md:text-4xl lg:text-5xl font-bold mt-4">
              Your Preparation Should Be Too.
            </span>
          </h1>
          
          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            You're not studying alone anymore. <span className="text-white font-semibold">Somewhere, someone is solving what you're stuck on</span> — right now.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={onGetStarted} className="group relative px-10 py-5 bg-gradient-to-r from-brand to-violet-500 text-white text-lg font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-brand/30">
              <span className="relative z-10 flex items-center gap-3">
                <Icons.Rocket className="w-5 h-5" />
                Begin Your Journey
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-brand opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className="px-10 py-5 border border-white/20 text-white text-lg font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center gap-3">
              See How It Works
              <Icons.ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-center">
              <div className="text-3xl font-black text-white"><AnimatedCounter target={2847} /></div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Students Aligned</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400"><AnimatedCounter target={94} suffix="%" /></div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-violet-400"><AnimatedCounter target={12} /></div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Countries</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scroll to Experience</span>
          <Icons.ChevronDown className="w-5 h-5 text-slate-500" />
        </div>
      </section>

      {/* ============================================ */}
      {/* STORY SECTION - "Here's what happens when you open CoStudy..." */}
      {/* ============================================ */}
      <section id="story" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Story Intro */}
          <div ref={storyReveal.ref} className={`text-center mb-24 transition-all duration-1000 ${
            storyReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <p className="text-brand font-mono text-sm mb-4 tracking-widest">// EXPERIENCE</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Here's What Happens When<br />
              <span className="bg-gradient-to-r from-brand to-violet-400 bg-clip-text text-transparent">You Open CoStudy</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Not another study app. This is your global exam operations center.
            </p>
          </div>

          {/* Story Scene 1: The Alignment */}
          <div className="relative mb-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Visual - 3D Card */}
              <div className="relative group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-brand/30 to-violet-500/30 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 overflow-hidden transform-gpu transition-transform duration-500 group-hover:rotate-y-3 group-hover:rotate-x-3 shadow-2xl"
                     style={{ transformStyle: 'preserve-3d' }}>
                  {/* Scene Header */}
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-brand/10 to-violet-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-brand animate-pulse" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Signal Detected</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">LIVE</span>
                  </div>
                  
                  {/* Scene Content - Alignment Match */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      {/* Your Profile */}
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-violet-500 mb-2 flex items-center justify-center mx-auto ring-4 ring-brand/20">
                          <span className="text-xl font-bold">You</span>
                        </div>
                        <span className="text-sm font-bold text-white">Mumbai</span>
                        <div className="text-[10px] text-slate-500">Cost Accounting: 67%</div>
                      </div>
                      
                      {/* Connection Animation */}
                      <div className="flex-1 px-4">
                        <div className="relative h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-brand to-violet-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
                        </div>
                        <div className="text-center mt-2">
                          <span className="text-[10px] font-bold text-emerald-400 animate-pulse">ALIGNING...</span>
                        </div>
                      </div>
                      
                      {/* Match Profile */}
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-brand mb-2 flex items-center justify-center mx-auto ring-4 ring-violet-500/20">
                          <span className="text-xl font-bold">JK</span>
                        </div>
                        <span className="text-sm font-bold text-white">NYC</span>
                        <div className="text-[10px] text-emerald-400">Cost Accounting: 92%</div>
                      </div>
                    </div>
                    
                    {/* Match Stats */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Compatibility Score</span>
                        <span className="font-bold text-emerald-400">94%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Timezone Overlap</span>
                        <span className="font-bold text-white">12 hours daily</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <div className="text-brand font-mono text-sm mb-4">SCENE 01</div>
                <h3 className="text-3xl md:text-4xl font-black mb-6">
                  The System Scans.<br />
                  <span className="text-slate-400">A Match Emerges.</span>
                </h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-6">
                  Within seconds, our Academic Radar identifies a peer in NYC who's crushing Cost Accounting — the exact topic you're struggling with. 
                  While you sleep, they'll audit your essays. Wake up to professional feedback.
                </p>
                <p className="text-xl text-white font-semibold italic border-l-4 border-brand pl-4">
                  "The sun never sets on your preparation."
                </p>
              </div>
            </div>
          </div>

          {/* Story Scene 2: The Command Deck */}
          <div ref={commandDeckReveal.ref} className={`relative mb-32 transition-all duration-1000 delay-200 ${
            commandDeckReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text (Left) */}
              <div className="order-2 lg:order-1">
                <div className="text-violet-400 font-mono text-sm mb-4">SCENE 02</div>
                <h3 className="text-3xl md:text-4xl font-black mb-6">
                  You Enter The<br />
                  <span className="text-violet-400">Command Deck.</span>
                </h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-6">
                  Not a social feed. A high-signal intelligence hub where every interaction is designed for exam success. 
                  Peer audits, MCQ shares, vouch-verified answers — all filtered for maximum value.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Peer Audits', 'MCQ Shares', 'Vouch System', 'AI Summaries'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold text-violet-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual - Interactive Feed Preview (Right) */}
              <div className="order-1 lg:order-2 relative group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/30 to-brand/30 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                
                {/* Simulated Video/GIF Container */}
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.Grid className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Command Deck</span>
                    </div>
                    <div className="flex gap-2">
                      {['Audit Desk', 'Bounty Board'].map((tab, i) => (
                        <span key={tab} className={`px-3 py-1 text-[10px] font-bold rounded-full ${i === 0 ? 'bg-violet-500/20 text-violet-400' : 'text-slate-500'}`}>
                          {tab}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Animated Post */}
                  <div className="p-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 transform transition-all hover:scale-[1.02]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-brand flex items-center justify-center">
                          <span className="text-sm font-bold">PS</span>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">Priya S.</span>
                          <span className="ml-2 px-2 py-0.5 bg-violet-500/20 rounded-full text-[10px] font-bold text-violet-400">Peer Audit</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-4">"Review my variance analysis essay..."</p>
                      
                      {/* Animated Interaction */}
                      <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-500/30 transition-colors">
                          <Icons.CheckCircle className="w-4 h-4" /> 
                          <span className="relative">
                            Compliant
                            <span className="absolute -right-6 -top-1 text-[10px] animate-ping">+5</span>
                          </span>
                        </button>
                        <span className="text-slate-500 text-xs">or</span>
                        <button className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors">
                          Non-Compliant
                        </button>
                      </div>
                    </div>

                    {/* Vouch Counter Animation */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Icons.CheckBadge className="w-4 h-4 text-violet-500" />
                        <span><span className="font-bold text-white">47</span> Vouches</span>
                      </div>
                      <button className="text-xs font-bold text-brand hover:text-brand/80 transition-colors">
                        AI Summary →
                      </button>
                    </div>
                  </div>

                  {/* Video Placeholder Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white ml-0.5" />
                      </div>
                      Watch in action
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Scene 3: Study Rooms */}
          <div ref={studyRoomsReveal.ref} className={`relative transition-all duration-1000 delay-300 ${
            studyRoomsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Visual - Study Room with Timer */}
              <div className="relative group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 to-brand/30 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  {/* Room Header */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-brand/20 px-6 py-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                          <Icons.Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Part 1: Financial Planning</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span>5 focused</span>
                            <span>•</span>
                            <span>Mumbai + NYC + London</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timer - Animated */}
                  <div className="p-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 mb-4">
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Focus Session Active</div>
                        <div className="text-5xl font-mono font-black text-white mb-2">
                          <span className="inline-block animate-[pulse_1s_ease-in-out_infinite]">23</span>
                          <span className="text-emerald-400">:</span>
                          <span>47</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-brand rounded-full transition-all duration-1000" 
                               style={{ width: '65%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Active Members */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {['PR', 'JK', 'SM', 'AL', '+2'].map((name, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-900 ${
                            i < 4 ? 'bg-gradient-to-br from-emerald-400 to-brand' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {name}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">All in sync</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <div className="text-emerald-400 font-mono text-sm mb-4">SCENE 03</div>
                <h3 className="text-3xl md:text-4xl font-black mb-6">
                  The Room Syncs.<br />
                  <span className="text-emerald-400">Focus Multiplies.</span>
                </h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-6">
                  Five people. Three continents. One synchronized timer. When you focus, they focus. 
                  When you break, they break. Accountability that spans time zones.
                </p>
                <ul className="space-y-3">
                  {[
                    'Synchronized Pomodoro timers',
                    'Shared mission boards with deadlines',
                    '1v1 MCQ duels for practice',
                    'SOS Protocol for instant help'
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-300">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES GRID - 3D Cards with Animated Icons */}
      {/* ============================================ */}
      <section className="py-32 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Not More Studying.<br />
              <span className="bg-gradient-to-r from-brand to-violet-400 bg-clip-text text-transparent">Smarter Passing.</span>
            </h2>
            <p className="text-xl text-slate-400">Every tool engineered for one thing: your CMA certification.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Icons.Brain, 
                title: 'AI Mastermind', 
                description: 'Instant answers to any CMA concept. Knows IMA standards cold.',
                color: 'brand',
                animation: 'animate-pulse'
              },
              { 
                icon: Icons.Award, 
                title: 'Mock Simulations', 
                description: 'Prometric-authentic interface. Real exam pressure.',
                color: 'violet',
                animation: 'animate-bounce'
              },
              { 
                icon: Icons.Pencil, 
                title: 'Essay Grading', 
                description: 'AI evaluation on official IMA rubrics. Instant feedback.',
                color: 'emerald',
                animation: 'animate-[wiggle_1s_ease-in-out_infinite]'
              },
              { 
                icon: Icons.TrendingUp, 
                title: 'Performance Analytics', 
                description: 'Track weak areas. Optimize study time. Watch scores climb.',
                color: 'amber',
                animation: 'animate-[grow_2s_ease-in-out_infinite]'
              },
              { 
                icon: Icons.ClipboardList, 
                title: 'Question Bank', 
                description: 'Thousands of MCQs. Adaptive difficulty. Endless practice.',
                color: 'sky',
                animation: ''
              },
              { 
                icon: Icons.Globe, 
                title: 'Global Network', 
                description: '12 countries. 24/7 activity. Always someone online.',
                color: 'rose',
                animation: 'animate-spin-slow'
              },
            ].map((feature, i) => (
              <div key={i} className="group relative perspective-1000">
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-${feature.color}-500/50 to-${feature.color}-500/0 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative h-full p-6 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-500 transform-gpu group-hover:translate-y-[-4px] group-hover:shadow-2xl">
                  {/* Animated Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-400 ${feature.animation}`} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTERACTIVE PRICING CALCULATOR */}
      {/* ============================================ */}
      <section ref={pricingReveal.ref} id="pricing" className={`py-32 px-6 transition-all duration-1000 ${
        pricingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand font-mono text-sm mb-4 tracking-widest">// INVESTMENT</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Calculate Your<br />
              <span className="bg-gradient-to-r from-emerald-400 to-brand bg-clip-text text-transparent">Savings</span>
            </h2>
            <p className="text-xl text-slate-400">See what you'd save switching to CoStudy</p>
          </div>

          {/* Calculator */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 p-8 md:p-12 mb-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Input Side */}
              <div>
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 block">
                  What are you currently spending?
                </label>
                <div className="space-y-3 mb-6">
                  {[
                    { name: 'Gleim', price: 80000 },
                    { name: 'Becker', price: 120000 },
                    { name: 'Hock', price: 50000 },
                    { name: 'Other Coaching', price: 40000 },
                  ].map(option => (
                    <button
                      key={option.name}
                      onClick={() => setCurrentSpend(option.price)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        currentSpend === option.price 
                          ? 'border-brand bg-brand/10 text-white' 
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{option.name}</span>
                        <span className={currentSpend === option.price ? 'text-brand' : ''}>₹{option.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-sm text-slate-400">Custom amount:</span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-slate-500">₹</span>
                    <input 
                      type="number" 
                      value={currentSpend}
                      onChange={(e) => setCurrentSpend(Number(e.target.value))}
                      className="bg-transparent border-none outline-none text-white font-bold flex-1 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Results Side */}
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">CoStudy Pro</div>
                  <div className="text-6xl font-black text-white mb-1">₹3,999</div>
                  <div className="text-slate-500">/year</div>
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                  <div className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">Your Savings</div>
                  <div className="text-4xl font-black text-emerald-400 mb-1">₹{savings.toLocaleString()}</div>
                  <div className="text-emerald-400/60">{savingsPercent}% less than {currentSpend === 80000 ? 'Gleim' : currentSpend === 120000 ? 'Becker' : 'your current spend'}</div>
                </div>

                <ul className="text-left space-y-2 mb-6">
                  {[
                    'Everything traditional prep offers',
                    '+ Global peer network',
                    '+ 24/7 AI tutoring',
                    '+ Real accountability'
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                      <Icons.CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button onClick={onGetStarted} className="w-full py-4 bg-gradient-to-r from-brand to-violet-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand/30 transition-all hover:scale-[1.02]">
                  Claim Your Savings — Start Free
                </button>
              </div>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4 p-2 bg-white/5 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full">SAVE 33%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* URGENCY + SOCIAL PROOF */}
      {/* ============================================ */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand/10 via-violet-500/10 to-brand/10 border-y border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-white font-bold"><AnimatedCounter target={47} /> students joined today</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Icons.Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white font-bold">May 2026 exam in <span className="text-amber-400">89 days</span></span>
            </div>
          </div>
          
          <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
            Every day you wait, someone else is getting aligned,<br />
            <span className="text-slate-400">getting audited, getting ahead.</span>
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/20 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            Ready to<br />
            <span className="bg-gradient-to-r from-brand via-violet-400 to-brand bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Pass Global?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join the network. Find your alignment. Start passing.
          </p>
          <button onClick={onGetStarted} className="group px-12 py-6 bg-gradient-to-r from-brand to-violet-500 text-white text-xl font-bold rounded-2xl hover:shadow-2xl hover:shadow-brand/30 transition-all hover:scale-105">
            Start Your CMA Journey — Free
            <span className="inline-block ml-2 group-hover:translate-x-2 transition-transform">→</span>
          </button>
          <p className="mt-6 text-sm text-slate-500">No credit card required • 7-day Pro trial included</p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-violet-500 rounded-xl flex items-center justify-center">
              <Icons.BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">CoStudy</span>
            <span className="text-slate-500 text-sm">— Global Exam Performance Infrastructure</span>
          </div>
          <div className="text-sm text-slate-500">© 2026 CoStudy. Built for CMA aspirants, by CMA aspirants.</div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes grow {
          0%, 100% { transform: scaleY(0.8); }
          50% { transform: scaleY(1); }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-y-3:hover {
          transform: rotateY(3deg) rotateX(3deg);
        }
      `}</style>
    </div>
  );
};
