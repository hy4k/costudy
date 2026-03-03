import React, { useState, useRef } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Feature Box Component - Clean, no icons
const FeatureBox: React.FC<{
  number: string;
  title: string;
  description: string;
  delay?: number;
}> = ({ number, title, description, delay = 0 }) => {
  return (
    <div
      className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-red-300 transition-all duration-300 hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Number accent */}
      <span className="text-6xl font-black text-slate-100 group-hover:text-red-100 transition-colors absolute top-4 right-6">
        {number}
      </span>
      
      {/* Content */}
      <div className="relative">
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <span className="text-xl font-black tracking-tight text-red-600">COSTUDY</span>
            <button 
              onClick={onLogin}
              className="text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Giant COSTUDY */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/30 via-white to-white pointer-events-none" />
        
        <div className="relative text-center max-w-5xl mx-auto">
          {/* The big statement */}
          <h1 className="text-[15vw] sm:text-[12vw] md:text-[10vw] lg:text-[180px] font-black leading-none tracking-tighter text-red-600 select-none">
            COSTUDY
          </h1>
          
          {/* Tagline */}
          <p className="mt-6 sm:mt-8 text-2xl sm:text-3xl md:text-4xl font-medium text-slate-800">
            Don't study alone.
          </p>
          <p className="mt-2 text-xl sm:text-2xl text-slate-500">
            The social network for CMA US candidates.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-full transition-all shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-100"
            >
              Join the Beta →
            </button>
            <button 
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-10 py-4 text-slate-600 hover:text-red-600 text-lg font-medium transition-colors"
            >
              Learn more
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Icons.ChevronDown className="w-8 h-8 text-slate-300" />
        </div>
      </section>

      {/* Features Section - Clean boxes */}
      <section ref={featuresRef} className="py-24 sm:py-32 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to pass.
            </h2>
            <p className="text-xl text-slate-500">
              Built by CMA candidates, for CMA candidates.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureBox
              number="01"
              title="AI Tutor"
              description="Ask anything about CMA. Get instant answers from your actual study materials — Gleim, Wiley, Hock. Real knowledge, not generic AI."
              delay={0}
            />

            <FeatureBox
              number="02"
              title="Study Rooms"
              description="Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability."
              delay={50}
            />

            <FeatureBox
              number="03"
              title="Unlimited MCQs"
              description="5,000+ practice questions by topic. Track your weak spots. See exactly what to focus on. Master every concept."
              delay={100}
            />

            <FeatureBox
              number="04"
              title="Essay Grading"
              description="Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect."
              delay={150}
            />

            <FeatureBox
              number="05"
              title="Mock Exams"
              description="Full 4-hour simulations. Exact Prometric interface. Time pressure included. No surprises on exam day."
              delay={200}
            />

            <FeatureBox
              number="06"
              title="Hire Mentors"
              description="Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone."
              delay={250}
            />
          </div>
        </div>
      </section>

      {/* Social Proof - Simple stats */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-black text-red-600">847+</div>
              <div className="mt-2 text-slate-500 font-medium">Students</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-red-600">23</div>
              <div className="mt-2 text-slate-500 font-medium">Countries</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-red-600">5K+</div>
              <div className="mt-2 text-slate-500 font-medium">MCQs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta CTA Section */}
      <section className="py-24 sm:py-32 px-6 bg-red-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Be an early tester.
          </h2>
          <p className="text-xl text-red-100 mb-10">
            We're looking for beta testers to shape CoStudy. 
            Free access. Direct line to the team.
          </p>

          {/* Beta signup form */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl">
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-400 focus:outline-none text-lg"
              />
              <input
                type="text"
                placeholder="Invite code (optional)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-400 focus:outline-none text-lg font-mono"
              />
              <button 
                onClick={onGetStarted}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition-all"
              >
                Request Access
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Have an invite code? Skip the waitlist.
            </p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 px-6 bg-slate-950 text-slate-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black tracking-tight text-white">COSTUDY</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="mailto:hello@costudy.in" className="hover:text-white transition-colors">
                hello@costudy.in
              </a>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-slate-600">
            © 2026 CoStudy
          </div>
        </div>
      </footer>
    </div>
  );
};
