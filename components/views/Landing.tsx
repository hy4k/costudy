import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Intersection Observer hook for scroll animations
const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
};

// Feature Box Component
const FeatureBox: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  delay?: number;
}> = ({ icon, title, description, accent, delay = 0 }) => {
  const { ref, inView } = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`
        group relative bg-white rounded-3xl p-8 
        border-2 border-slate-100 hover:border-red-200
        shadow-sm hover:shadow-2xl hover:shadow-red-100/50
        transition-all duration-500 ease-out cursor-default
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className={`
        w-16 h-16 rounded-2xl mb-6 flex items-center justify-center
        bg-gradient-to-br ${accent} text-white
        group-hover:scale-110 transition-transform duration-300
        shadow-lg
      `}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold text-slate-900 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed text-lg">
        {description}
      </p>
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

  const handleJoinBeta = () => {
    // For now, just trigger onGetStarted
    // Later: validate invite code
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Minimal Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl">
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
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/30 via-white to-white pointer-events-none" />
        
        {/* Main content */}
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
              See what we're building
            </button>
          </div>

          {/* Beta badge */}
          <div className="mt-12 inline-flex items-center gap-3 px-5 py-2.5 bg-slate-100 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-slate-600 font-medium">Invite-only Beta • Limited spots</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Icons.ChevronDown className="w-8 h-8 text-slate-300" />
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 sm:py-32 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Built different.
            </h2>
            <p className="text-xl sm:text-2xl text-slate-500 max-w-2xl mx-auto">
              Everything you need to pass the CMA, with people who get it.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureBox
              icon={<Icons.Sparkles className="w-8 h-8" />}
              title="AI That Knows CMA"
              description="Ask anything. Get answers from your actual study materials — Gleim, Wiley, Hock. Not generic AI. Real CMA knowledge."
              accent="from-violet-500 to-purple-600"
              delay={0}
            />

            <FeatureBox
              icon={<Icons.Users className="w-8 h-8" />}
              title="Study Rooms"
              description="Join rooms across timezones. Pomodoro timers. Mission boards. When your room studies, you study. Real accountability."
              accent="from-pink-500 to-rose-500"
              delay={100}
            />

            <FeatureBox
              icon={<Icons.FileQuestion className="w-8 h-8" />}
              title="Unlimited MCQs"
              description="5,000+ practice questions by topic. Track your weak spots. See exactly what to focus on. Master every concept."
              accent="from-blue-500 to-cyan-500"
              delay={200}
            />

            <FeatureBox
              icon={<Icons.PenLine className="w-8 h-8" />}
              title="Essay Grading"
              description="Submit essays anytime. Get detailed AI feedback in 30 seconds. No more waiting weeks. Practice until perfect."
              accent="from-emerald-500 to-teal-500"
              delay={300}
            />

            <FeatureBox
              icon={<Icons.Clock className="w-8 h-8" />}
              title="Mock Exams"
              description="Full 4-hour simulations. Exact Prometric interface. Time pressure included. No surprises on exam day."
              accent="from-amber-500 to-orange-500"
              delay={400}
            />

            <FeatureBox
              icon={<Icons.GraduationCap className="w-8 h-8" />}
              title="Hire Mentors"
              description="Book verified CMA instructors. Your study room can split the cost. Premium help, affordable for everyone."
              accent="from-slate-600 to-slate-800"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* The Vibe Section - What it feels like */}
      <section className="py-20 sm:py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              This is what it feels like.
            </h2>
          </div>

          {/* Preview cards showing the vibe */}
          <div className="space-y-6">
            {/* Study room preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-10 text-white">
              <div className="flex items-center gap-3 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
                <span className="text-emerald-400 font-medium">Part 1 Warriors • 12 studying now</span>
              </div>
              <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-white/90">
                "Day 47 of our streak. 5 members, 4 countries, 1 mission. 
                <span className="text-red-400"> When one skips, we all feel it.</span>"
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['🇮🇳', '🇺🇸', '🇦🇪', '🇬🇧', '🇸🇬'].map((flag, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm border-2 border-slate-800">
                      {flag}
                    </div>
                  ))}
                </div>
                <span className="text-slate-400 text-sm">Study room members</span>
              </div>
            </div>

            {/* AI chat preview */}
            <div className="bg-slate-50 rounded-3xl p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Icons.Sparkles className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-medium text-slate-900">CoStudy AI</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">From your Gleim notes</span>
              </div>
              <p className="text-xl sm:text-2xl text-slate-700 leading-relaxed">
                "Transfer pricing uses the arm's length principle. Here's the exact page from your material with examples..."
              </p>
              <p className="mt-4 text-slate-500">
                Asked at 2:47 AM • Answered instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta CTA Section */}
      <section className="py-20 sm:py-32 px-6 bg-red-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Be an early tester.
          </h2>
          <p className="text-xl sm:text-2xl text-red-100 mb-10">
            We're looking for 100 beta testers to shape CoStudy. 
            <br className="hidden sm:block" />
            Free access. Direct line to the team.
          </p>

          {/* Beta signup form */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md mx-auto shadow-2xl">
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-red-300 focus:outline-none text-lg"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Invite code (optional)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-red-300 focus:outline-none text-lg font-mono"
                />
              </div>
              <button 
                onClick={handleJoinBeta}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition-all"
              >
                Request Beta Access
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Have an invite code? Skip the waitlist.
            </p>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-red-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              <span>847 students signed up</span>
            </div>
            <div className="hidden sm:block text-red-300">•</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span>23 countries</span>
            </div>
            <div className="hidden sm:block text-red-300">•</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Launching soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 px-6 bg-slate-950 text-slate-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black tracking-tight text-white">COSTUDY</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm">Built for CMA candidates</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="mailto:hello@costudy.in" className="hover:text-white transition-colors">
                hello@costudy.in
              </a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-slate-600">
            © 2026 CoStudy. Made with ❤️ for CMA candidates worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
};
