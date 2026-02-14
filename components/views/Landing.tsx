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

// Animated counter for stats
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ 
  end, suffix = '', duration = 2000 
}) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Feature card with social proof styling
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  highlight?: string;
  stats?: { label: string; value: string }[];
  gradient: string;
  delay?: number;
}> = ({ icon, emoji, title, description, highlight, stats, gradient, delay = 0 }) => {
  const { ref, inView } = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`
        relative overflow-hidden rounded-3xl bg-white border border-slate-200/60
        shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50
        transition-all duration-500 ease-out group
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />
      
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <span className="text-3xl">{emoji}</span>
        </div>

        {/* Content */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed mb-4">
          {description}
        </p>

        {/* Highlight tag */}
        {highlight && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} bg-opacity-10 text-sm font-medium`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {highlight}
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-6">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Social proof post (simplified, mobile-optimized)
const SocialPost: React.FC<{
  avatar: string;
  name: string;
  location: string;
  time: string;
  content: React.ReactNode;
  likes: number;
  verified?: boolean;
  delay?: number;
}> = ({ avatar, name, location, time, content, likes, verified, delay = 0 }) => {
  const { ref, inView } = useInView(0.15);
  const [liked, setLiked] = useState(false);

  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/30
        overflow-hidden transition-all duration-500 ease-out hover:shadow-xl
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-xl sm:text-2xl shadow-md flex-shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 truncate">{name}</span>
              {verified && (
                <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icons.CheckCircle className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {location} • {time}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 text-slate-700 leading-relaxed">
        {content}
      </div>

      {/* Engagement */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <button 
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-2 font-medium transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        >
          <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
          <span>{liked ? likes + 1 : likes}</span>
        </button>
        <button className="text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm">Reply</span>
        </button>
      </div>
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Reduced motion styles */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Navigation - Sticky, Mobile-optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 safe-area-inset">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">COSTUDY</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-3">
              <button 
                onClick={onLogin} 
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={onGetStarted} 
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-100"
              >
                Get Started Free
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -mr-2 text-slate-600"
            >
              {mobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 border-t border-slate-100 space-y-3">
              <button 
                onClick={() => { onLogin(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                Sign In
              </button>
              <button 
                onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}
                className="block w-full px-4 py-3 bg-red-600 text-white rounded-xl font-semibold text-center"
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Mobile First */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 via-white to-white pointer-events-none" />
        
        {/* Decorative elements - hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-32 left-10 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-40" />
        <div className="hidden sm:block absolute top-48 right-10 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-30" />
        
        <div className="max-w-5xl mx-auto relative">
          {/* Trust badge - Above the fold */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-700">Invite-only Beta</span>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500"><AnimatedCounter end={847} suffix="+" /> students</span>
            </div>
          </div>

          {/* Main headline - Responsive sizing */}
          <h1 className="text-center">
            <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-slate-900 leading-none">
              COSTUDY
            </span>
            <span className="block mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl font-medium tracking-widest text-slate-400 uppercase">
              CMA Success Universe
            </span>
          </h1>

          {/* Value proposition - Clear and immediate */}
          <p className="mt-6 sm:mt-8 text-center text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
            The AI-powered study platform where <span className="text-slate-900 font-semibold">CMA candidates worldwide</span> prepare together, 24/7.
          </p>

          {/* Primary CTA - Single, prominent */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-2xl sm:rounded-full transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-100"
            >
              Get Started Free →
            </button>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-lg font-semibold rounded-2xl sm:rounded-full transition-all"
            >
              I Have an Invite
            </button>
          </div>

          {/* Quick social proof */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇮🇳</span>
              <span>India</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇺🇸</span>
              <span>USA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇦🇪</span>
              <span>UAE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇬🇧</span>
              <span>UK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇸🇬</span>
              <span>Singapore</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-12 sm:py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              CMA prep is broken. We fixed it.
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              No more studying alone at 2 AM. No more waiting weeks for feedback.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Before */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-red-100">
              <div className="flex items-center gap-2 text-red-500 font-semibold mb-4">
                <span className="text-xl">😩</span>
                <span>Without CoStudy</span>
              </div>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Study alone, no accountability</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Wait days for essay feedback</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Expensive coaching classes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>No idea what real exam feels like</span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 sm:p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-4">
                <span className="text-xl">🚀</span>
                <span>With CoStudy</span>
              </div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Study rooms with global peers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>AI essay grading in 30 seconds</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>₹333/month for unlimited access</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Prometric-authentic mock exams</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Cards */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to pass
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Built by CMA candidates, for CMA candidates.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <FeatureCard
              icon={<Icons.Sparkles className="w-7 h-7" />}
              emoji="🧠"
              title="AI Tutor"
              description="Ask anything about CMA. Get instant, accurate answers drawn from your study materials."
              highlight="Available 24/7"
              gradient="from-violet-500 to-purple-600"
              delay={0}
            />

            <FeatureCard
              icon={<Icons.FileQuestion className="w-7 h-7" />}
              emoji="📝"
              title="MCQ Practice"
              description="Unlimited practice questions by topic. Track weak spots. Master every concept."
              stats={[{ label: 'Questions', value: '5,000+' }]}
              gradient="from-blue-500 to-cyan-500"
              delay={100}
            />

            <FeatureCard
              icon={<Icons.Clock className="w-7 h-7" />}
              emoji="⏱️"
              title="Mock Exams"
              description="Full 4-hour simulations. Exact Prometric interface. No surprises on exam day."
              highlight="Prometric Authentic"
              gradient="from-amber-500 to-orange-500"
              delay={200}
            />

            <FeatureCard
              icon={<Icons.PenLine className="w-7 h-7" />}
              emoji="✍️"
              title="Essay Evaluation"
              description="Submit essays anytime. Get detailed AI feedback in seconds, not weeks."
              stats={[{ label: 'Avg Response', value: '30s' }]}
              gradient="from-emerald-500 to-teal-500"
              delay={300}
            />

            <FeatureCard
              icon={<Icons.Users className="w-7 h-7" />}
              emoji="🌍"
              title="Global Study Rooms"
              description="Join study rooms across timezones. Focus timers. Mission boards. Real accountability."
              highlight="24/7 Active"
              gradient="from-pink-500 to-rose-500"
              delay={400}
            />

            <FeatureCard
              icon={<Icons.GraduationCap className="w-7 h-7" />}
              emoji="👨‍🏫"
              title="Hire Mentors"
              description="Book verified CMA instructors. Split the fee with your study room. Premium help, affordable price."
              stats={[{ label: 'From', value: '₹500/hr' }]}
              gradient="from-slate-600 to-slate-800"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* Social Proof - Real Stories */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              See what's happening
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Real moments from the CoStudy community
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <SocialPost
              avatar="👩‍💻"
              name="Priya M."
              location="Cochin 🇮🇳"
              time="2h ago"
              verified={true}
              likes={234}
              delay={0}
              content={
                <p>
                  Connected with <span className="text-blue-600 font-medium">@sarah_nyc</span> for our study session! She reviews my essays while I sleep. Wake up to feedback. 
                  <span className="block mt-2 text-emerald-600 font-medium">Timezone difference = superpower 🔥</span>
                </p>
              }
            />

            <SocialPost
              avatar="🧑‍💼"
              name="Rahul S."
              location="Delhi 🇮🇳"
              time="4h ago"
              verified={false}
              likes={189}
              delay={100}
              content={
                <p>
                  Stuck on transfer pricing for 3 days. Asked CoStudy AI at 2 AM. Got the clearest explanation ever with examples from <span className="font-medium">my own Gleim notes</span>.
                  <span className="block mt-2 text-slate-900 font-medium">Like having a tutor who never sleeps 🤯</span>
                </p>
              }
            />

            <SocialPost
              avatar="🔥"
              name="Part 1 Warriors"
              location="Global 🌍"
              time="1h ago"
              verified={true}
              likes={312}
              delay={200}
              content={
                <p>
                  Day 45 of our daily study room streak! 5 members across 4 countries. Same focus timer. Same mission.
                  <span className="block mt-2">When one person skips, the whole room's streak is at risk. <span className="font-medium text-amber-600">Accountability level: 💯</span></span>
                </p>
              }
            />
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section className="py-12 sm:py-20 px-4 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-semibold mb-4">
              <Icons.Award className="w-4 h-4" /> FOR TEACHERS
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Teach globally. Earn fairly.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
              Join as a verified mentor. Set your rates. Get discovered by students worldwide.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {[
              { icon: <Icons.CheckBadge className="w-6 h-6" />, title: 'Verified Badge', desc: 'Build instant trust with students' },
              { icon: <Icons.Users className="w-6 h-6" />, title: 'Flash Sessions', desc: 'Study rooms hire you, split fees' },
              { icon: <Icons.Wallet className="w-6 h-6" />, title: 'Set Your Rates', desc: 'You decide your worth' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold rounded-full transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-100"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">Simple Pricing</h2>
            <p className="text-base sm:text-lg text-slate-500 mb-6">Start free. Upgrade when ready.</p>
            
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                  billingCycle === 'monthly' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                  billingCycle === 'yearly' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Yearly <span className="text-emerald-400 ml-1">-33%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="mb-5">
                <span className="text-4xl font-bold">₹0</span>
              </div>
              <ul className="space-y-2.5 mb-6 text-sm">
                {['20 AI questions/day', '10 MCQ practice/day', 'Wall access', 'Basic study rooms'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-slate-200 hover:bg-slate-300 rounded-xl font-semibold transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro - Featured */}
            <div className="bg-gradient-to-b from-red-50 to-white rounded-2xl sm:rounded-3xl border-2 border-red-500 p-6 sm:p-8 relative shadow-xl sm:-my-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="mb-5">
                <span className="text-4xl font-bold">₹{billingCycle === 'yearly' ? '333' : '499'}</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6 text-sm">
                {['Unlimited AI questions', 'Unlimited MCQ', 'Mock exams', 'Essay evaluation', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors">
                Upgrade to Pro
              </button>
            </div>

            {/* Mentor */}
            <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-2">Mentor</h3>
              <div className="mb-5">
                <span className="text-4xl font-bold">₹1,999</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6 text-sm">
                {['Everything in Pro', 'Verified badge', 'Student dashboard', 'Revenue share', 'Analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
                Become Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to pass the CMA?
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-8">
            Join <AnimatedCounter end={847} suffix="+" /> candidates studying smarter together.
          </p>
          
          <button 
            onClick={onGetStarted}
            className="px-10 sm:px-12 py-4 bg-red-600 hover:bg-red-500 text-white text-lg sm:text-xl font-bold rounded-full transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-100"
          >
            Get Started Free →
          </button>
          
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • Free tier available forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 bg-slate-950 text-slate-400">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">COSTUDY</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm">CMA Success Universe</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:hello@costudy.in" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="text-center mt-6 sm:mt-8 text-sm text-slate-600">
            © 2026 CoStudy. Built for CMA candidates worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
};
