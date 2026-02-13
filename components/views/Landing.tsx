import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Scroll reveal hook
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Animated counter
const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.5);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / 60;
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
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroReveal = useScrollReveal(0.1);
  const featuresReveal = useScrollReveal(0.15);
  const howItWorksReveal = useScrollReveal(0.15);
  const pricingReveal = useScrollReveal(0.15);
  const ctaReveal = useScrollReveal(0.15);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* ============================================ */}
      {/* HEADER - Clean & Professional */}
      {/* ============================================ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
              <Icons.BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">CoStudy</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-red-600 transition-colors">
              Log In
            </button>
            <button onClick={onGetStarted} className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 transition-all hover:scale-105">
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO - Bold & Confident */}
      {/* ============================================ */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-red-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-100 rounded-full blur-3xl opacity-40" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div ref={heroReveal.ref} className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${
            heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {/* Left - Text Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full mb-8">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">CMA US Exam Prep</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
                <span className="text-slate-900">Pass Your CMA.</span>
                <br />
                <span className="text-red-600">Together.</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                The world's first <strong className="text-slate-900">peer-powered</strong> learning platform for CMA US candidates. AI tutoring, global study rooms, and a community that holds you accountable.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
                <button onClick={onGetStarted} className="group px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 hover:shadow-xl hover:shadow-red-600/25 transition-all hover:scale-105">
                  Start Free Trial
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 border-2 border-slate-200 text-slate-700 text-lg font-bold rounded-xl hover:border-red-200 hover:text-red-600 transition-all">
                  See How It Works
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-3xl font-black text-slate-900"><AnimatedCounter target={2847} />+</div>
                  <div className="text-sm text-slate-500 font-medium">Active Students</div>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-red-600"><AnimatedCounter target={94} suffix="%" /></div>
                  <div className="text-sm text-slate-500 font-medium">Pass Rate</div>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-slate-900"><AnimatedCounter target={12} /></div>
                  <div className="text-sm text-slate-500 font-medium">Countries</div>
                </div>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* App Header Mock */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs font-bold text-slate-400">costudy.in</span>
                  </div>
                </div>
                
                {/* App Content Mock */}
                <div className="p-6">
                  {/* Study Room Preview */}
                  <div className="bg-red-50 rounded-2xl p-6 mb-4 border border-red-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                          <Icons.Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Part 1 Study Room</div>
                          <div className="text-xs text-slate-500">5 students • Live</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
                      </div>
                    </div>
                    {/* Timer */}
                    <div className="text-center py-4">
                      <div className="text-4xl font-mono font-black text-slate-900">23:47</div>
                      <div className="text-xs text-red-600 font-bold mt-1">FOCUS SESSION</div>
                    </div>
                    {/* Avatars */}
                    <div className="flex justify-center -space-x-2">
                      {['PR', 'JK', 'SM', 'AL', '+2'].map((name, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${
                          i < 4 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <Icons.Brain className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-slate-900">AI Tutor</div>
                      <div className="text-xs text-slate-500">24/7 Help</div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <Icons.Award className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-slate-900">Mock Exams</div>
                      <div className="text-xs text-slate-500">Prometric Style</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 animate-bounce">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Priya passed!</div>
                    <div className="text-xs text-slate-500">Part 2 • Just now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROBLEM / SOLUTION */}
      {/* ============================================ */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-8">
            Studying Alone is <span className="text-red-400">Broken</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Icons.Clock, problem: 'No accountability', stat: '73%', desc: 'quit within 2 months' },
              { icon: Icons.HelpCircle, problem: 'Stuck on concepts', stat: '40hrs', desc: 'wasted on confusion' },
              { icon: Icons.TrendingDown, problem: 'Expensive courses', stat: '₹80,000+', desc: 'average spend' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                <div className="text-2xl font-black text-white mb-1">{item.stat}</div>
                <div className="text-sm text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <p className="text-xl text-white leading-relaxed">
              <strong className="text-red-400">CoStudy flips the script.</strong> You're not alone anymore. 
              Someone in NYC is solving what you're stuck on — right now. 
              Our platform connects you with peers, AI tutoring, and a system designed for one thing: 
              <strong className="text-white"> getting you certified.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES - Clean Cards */}
      {/* ============================================ */}
      <section id="features" className="py-24 bg-white">
        <div ref={featuresReveal.ref} className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${
          featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-center mb-16">
            <span className="text-red-600 font-bold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-4">
              Everything You Need to Pass
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Built by CMA candidates who got tired of expensive, outdated prep courses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Icons.Brain,
                title: 'AI Tutor',
                description: 'Ask anything, anytime. Our AI knows IMA standards cold and explains concepts like a patient mentor.',
                highlight: '24/7 availability'
              },
              {
                icon: Icons.Users,
                title: 'Global Study Rooms',
                description: 'Join topic-specific rooms. Synchronized timers, shared goals, real accountability.',
                highlight: '12 countries'
              },
              {
                icon: Icons.Award,
                title: 'Mock Exams',
                description: 'Prometric-authentic interface. Timed sections. Real pressure. Know exactly where you stand.',
                highlight: 'Exam-realistic'
              },
              {
                icon: Icons.Pencil,
                title: 'Essay Grading',
                description: 'Submit essays, get instant AI feedback based on official IMA rubrics. No waiting.',
                highlight: 'Instant feedback'
              },
              {
                icon: Icons.TrendingUp,
                title: 'Smart Analytics',
                description: 'Track your weak areas. See what to study next. Watch your scores climb over time.',
                highlight: 'Data-driven'
              },
              {
                icon: Icons.MessageSquare,
                title: 'Peer Audits',
                description: 'Have your work reviewed by peers who\'ve mastered the topic. Give audits, earn vouches.',
                highlight: 'Community-powered'
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-white rounded-2xl border-2 border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-600/5 transition-all duration-300">
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-100 group-hover:scale-110 transition-all">
                  <feature.icon className="w-7 h-7 text-red-600" />
                </div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">{feature.highlight}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div ref={howItWorksReveal.ref} className={`max-w-5xl mx-auto px-6 transition-all duration-1000 ${
          howItWorksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-center mb-16">
            <span className="text-red-600 font-bold text-sm uppercase tracking-widest">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 mb-4">
              Three Steps to CMA Success
            </h2>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-red-100 -translate-y-1/2" />
            
            <div className="grid lg:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  description: 'Tell us your exam date, weak topics, and study preferences. We\'ll customize your experience.',
                  icon: Icons.User
                },
                {
                  step: '02',
                  title: 'Get Matched',
                  description: 'Our system finds peers at your level, in complementary time zones. Study partners who push you forward.',
                  icon: Icons.Globe
                },
                {
                  step: '03',
                  title: 'Start Passing',
                  description: 'Join rooms, take mocks, audit essays, level up. The community keeps you accountable.',
                  icon: Icons.Rocket
                },
              ].map((item, i) => (
                <div key={i} className="relative text-center">
                  <div className="relative z-10 w-20 h-20 bg-white rounded-full border-4 border-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <item.icon className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="text-red-600 font-mono font-bold text-sm mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SOCIAL PROOF */}
      {/* ============================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-red-600 font-bold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-black text-slate-900 mt-4">
              Students Love CoStudy
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The study rooms changed everything. Having real accountability partners across the globe kept me on track when I wanted to quit.",
                name: "Priya S.",
                location: "Mumbai",
                result: "Passed Part 1"
              },
              {
                quote: "The AI tutor is like having a patient professor available 24/7. I'd get stuck at 2 AM and get unstuck in minutes.",
                name: "James K.",
                location: "New York",
                result: "Passed Both Parts"
              },
              {
                quote: "At ₹3,999/year vs ₹80,000 for Gleim, this is a no-brainer. The peer audit system is pure gold.",
                name: "Sarah M.",
                location: "London",
                result: "Passed Part 2"
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Icons.Star key={j} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.location} • {testimonial.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING - Simple & Clear */}
      {/* ============================================ */}
      <section id="pricing" className="py-24 bg-slate-900">
        <div ref={pricingReveal.ref} className={`max-w-4xl mx-auto px-6 transition-all duration-1000 ${
          pricingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="text-center mb-16">
            <span className="text-red-400 font-bold text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">
              Embarrassingly Affordable
            </h2>
            <p className="text-xl text-slate-400">
              Less than your monthly coffee budget. Seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Free Forever</div>
              <div className="text-5xl font-black text-white mb-2">₹0</div>
              <div className="text-slate-400 mb-8">Get started</div>
              <ul className="space-y-4 mb-8">
                {['Access to study rooms', 'Basic AI tutoring (5 questions/day)', 'Community access', '1 mock exam/month'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <Icons.CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-4 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all">
                Start Free
              </button>
            </div>

            {/* Pro */}
            <div className="relative bg-red-600 rounded-2xl p-8 shadow-2xl shadow-red-600/30">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-red-600 text-xs font-black rounded-full shadow-lg">
                MOST POPULAR
              </div>
              <div className="text-sm font-bold text-red-200 uppercase tracking-wider mb-4">Pro</div>
              <div className="text-5xl font-black text-white mb-2">₹3,999</div>
              <div className="text-red-200 mb-8">/year (just ₹333/month)</div>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Free',
                  'Unlimited AI tutoring',
                  'Unlimited mock exams',
                  'Essay grading with feedback',
                  'Advanced analytics',
                  'Priority peer matching',
                  'Direct mentor access'
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <Icons.CheckCircle className="w-5 h-5 text-white shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-4 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 hover:shadow-lg transition-all">
                Start 7-Day Free Trial
              </button>
              <p className="text-center text-xs text-red-200 mt-4">No credit card required</p>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-12 text-center">
            <p className="text-slate-400">
              Compare: Gleim ₹80,000 • Becker ₹1,20,000 • Hock ₹50,000
            </p>
            <p className="text-white font-bold mt-2">
              CoStudy Pro saves you up to <span className="text-red-400">₹1,16,000</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-24 bg-white">
        <div ref={ctaReveal.ref} className={`max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${
          ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full mb-8">
            <Icons.Clock className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold text-red-600">May 2026 exam window opens in 89 days</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
            Ready to <span className="text-red-600">Pass</span>?
          </h2>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Join 2,847+ students who stopped studying alone. 
            Start your free trial today — no credit card required.
          </p>
          <button onClick={onGetStarted} className="group px-10 py-5 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 hover:shadow-2xl hover:shadow-red-600/30 transition-all hover:scale-105">
            Start Your CMA Journey
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
              <Icons.BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">CoStudy</span>
          </div>
          <div className="text-sm text-slate-500">© 2026 CoStudy. Built for CMA aspirants, by CMA aspirants.</div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-red-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-red-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
