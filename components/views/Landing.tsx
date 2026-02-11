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
  const [currentSpend, setCurrentSpend] = useState(80000);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pricing = {
    monthly: { price: 499, period: '/month' },
    yearly: { price: 3999, period: '/year', monthly: 333 },
  };

  const savings = currentSpend - pricing.yearly.price;
  const savingsPercent = Math.round((savings / currentSpend) * 100);

  const featuresReveal = useScrollReveal(0.15);
  const howItWorksReveal = useScrollReveal(0.15);
  const pricingReveal = useScrollReveal(0.15);
  const testimonialReveal = useScrollReveal(0.15);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* ============================================ */}
      {/* FIXED HEADER */}
      {/* ============================================ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
              <Icons.BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-slate-900">CoStudy</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Log In
            </button>
            <button onClick={onGetStarted} className="px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand/90 transition-all hover:shadow-lg hover:shadow-brand/20">
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.08),transparent_50%)]" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-sm font-semibold text-emerald-700">Trusted by 2,800+ CMA students worldwide</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Pass Your <span className="text-brand">CMA Exam</span><br />
            With AI-Powered Study Tools
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform for CMA US exam prep. AI tutoring, practice questions, 
            essay grading, and a global community of students — all at a fraction of traditional prep costs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button onClick={onGetStarted} className="group px-8 py-4 bg-brand text-white text-lg font-bold rounded-xl hover:bg-brand/90 transition-all hover:shadow-xl hover:shadow-brand/20 flex items-center gap-2">
              Start Free Trial
              <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 border-2 border-slate-200 text-slate-700 text-lg font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2">
              See How It Works
              <Icons.ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-slate-900"><AnimatedCounter target={94} suffix="%" /></div>
              <div className="text-sm font-medium text-slate-500">Pass Rate</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-slate-900"><AnimatedCounter target={50000} suffix="+" /></div>
              <div className="text-sm font-medium text-slate-500">Practice Questions</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-slate-900"><AnimatedCounter target={12} /></div>
              <div className="text-sm font-medium text-slate-500">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHAT IS COSTUDY */}
      {/* ============================================ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">What is CoStudy?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              CoStudy is an AI-powered educational platform designed specifically for 
              <strong className="text-slate-900"> CMA (Certified Management Accountant) US exam </strong> 
              preparation. Think of it as having a personal tutor, study group, and practice center — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Icons.Brain,
                title: 'AI Tutor',
                description: 'Ask any CMA concept and get instant, accurate explanations based on IMA standards.',
                color: 'brand'
              },
              {
                icon: Icons.Users,
                title: 'Study Community',
                description: 'Connect with fellow CMA students worldwide. Share tips, ask questions, and stay motivated.',
                color: 'violet'
              },
              {
                icon: Icons.Target,
                title: 'Smart Practice',
                description: 'Adaptive MCQs and essay practice that focus on your weak areas to maximize study efficiency.',
                color: 'emerald'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}/10 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}`} />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" ref={howItWorksReveal.ref} className={`py-20 px-6 transition-all duration-1000 ${
        howItWorksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">How CoStudy Works</h2>
            <p className="text-lg text-slate-600">Three simple steps to transform your CMA preparation</p>
          </div>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 rounded-full mb-4">
                  <span className="text-sm font-bold text-brand">Step 1</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-4">Create Your Study Profile</h3>
                <p className="text-lg text-slate-600 mb-4">
                  Tell us which CMA part you're preparing for and your target exam date. 
                  We'll create a personalized study plan based on your timeline.
                </p>
                <ul className="space-y-2">
                  {['Choose Part 1 or Part 2', 'Set your exam date', 'Get a customized study schedule'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-slate-700">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                      <Icons.User className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Your Profile</div>
                      <div className="text-sm text-slate-500">CMA Part 1 • May 2026</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Days until exam</span>
                      <span className="font-bold text-brand">89 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Study streak</span>
                      <span className="font-bold text-emerald-600">12 days 🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-100 rounded-2xl p-8 border border-slate-200">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-slate-900">AI Tutor</span>
                    <span className="text-xs text-emerald-600 font-semibold">Online</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                      "What's the difference between absorption and variable costing?"
                    </div>
                    <div className="bg-brand/5 rounded-lg p-3 text-sm text-slate-700 border-l-2 border-brand">
                      "Great question! Absorption costing includes all manufacturing costs (both fixed and variable) in product costs, while variable costing only includes variable manufacturing costs..."
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 rounded-full mb-4">
                  <span className="text-sm font-bold text-violet-600">Step 2</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-4">Learn with AI Assistance</h3>
                <p className="text-lg text-slate-600 mb-4">
                  Stuck on a concept? Ask our AI tutor anytime. It knows the entire CMA curriculum 
                  and can explain complex topics in simple terms.
                </p>
                <ul className="space-y-2">
                  {['24/7 instant answers', 'Based on official IMA curriculum', 'Explains in your preferred style'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-slate-700">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full mb-4">
                  <span className="text-sm font-bold text-emerald-600">Step 3</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-4">Practice & Track Progress</h3>
                <p className="text-lg text-slate-600 mb-4">
                  Take mock exams that simulate the real Prometric experience. 
                  Our AI grading system evaluates your essays just like the actual exam.
                </p>
                <ul className="space-y-2">
                  {['Realistic mock exams', 'AI-graded essays with feedback', 'Detailed performance analytics'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-slate-700">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="font-bold text-slate-900 mb-4">Your Progress</div>
                  <div className="space-y-4">
                    {[
                      { topic: 'Financial Planning', score: 85, color: 'emerald' },
                      { topic: 'Cost Management', score: 72, color: 'amber' },
                      { topic: 'Internal Controls', score: 91, color: 'emerald' },
                    ].map(item => (
                      <div key={item.topic}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{item.topic}</span>
                          <span className={`font-bold text-${item.color}-600`}>{item.score}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES */}
      {/* ============================================ */}
      <section ref={featuresReveal.ref} className={`py-20 px-6 bg-slate-900 text-white transition-all duration-1000 ${
        featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Everything You Need to Pass</h2>
            <p className="text-lg text-slate-400">All the tools serious CMA candidates need, in one platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Icons.Brain, title: 'AI Study Assistant', description: 'Get instant answers to any CMA concept, 24/7.' },
              { icon: Icons.ClipboardList, title: '50,000+ Questions', description: 'Comprehensive question bank covering both parts.' },
              { icon: Icons.Pencil, title: 'Essay Grading', description: 'AI evaluates your essays using IMA rubrics.' },
              { icon: Icons.Award, title: 'Mock Exams', description: 'Realistic Prometric-style exam simulations.' },
              { icon: Icons.TrendingUp, title: 'Analytics Dashboard', description: 'Track progress and identify weak areas.' },
              { icon: Icons.Users, title: 'Study Groups', description: 'Join virtual study rooms with global peers.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <section ref={pricingReveal.ref} id="pricing" className={`py-20 px-6 transition-all duration-1000 ${
        pricingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Simple, Affordable Pricing</h2>
            <p className="text-lg text-slate-600">Save thousands compared to traditional CMA prep courses</p>
          </div>

          {/* Comparison Calculator */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 block">
                  Compare with your current option
                </label>
                <div className="space-y-2">
                  {[
                    { name: 'Gleim', price: 80000 },
                    { name: 'Becker', price: 120000 },
                    { name: 'Hock', price: 50000 },
                    { name: 'Local Coaching', price: 40000 },
                  ].map(option => (
                    <button
                      key={option.name}
                      onClick={() => setCurrentSpend(option.price)}
                      className={`w-full p-3 rounded-xl border text-left transition-all text-sm ${
                        currentSpend === option.price 
                          ? 'border-brand bg-brand/5 text-slate-900' 
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{option.name}</span>
                        <span className={currentSpend === option.price ? 'text-brand font-bold' : ''}>₹{option.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center items-center text-center">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">CoStudy Pro</div>
                <div className="text-5xl font-black text-slate-900 mb-1">₹3,999</div>
                <div className="text-slate-500 mb-4">/year</div>
                
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="text-emerald-700 font-bold text-sm uppercase tracking-wider mb-1">You Save</div>
                  <div className="text-3xl font-black text-emerald-600">₹{savings.toLocaleString()}</div>
                  <div className="text-emerald-600 text-sm">{savingsPercent}% less</div>
                </div>

                <button onClick={onGetStarted} className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 transition-all">
                  Start Free Trial
                </button>
                <p className="mt-2 text-xs text-slate-500">7 days free • Cancel anytime</p>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">Everything included in Pro:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['AI Tutor', 'All MCQs', 'Essay Grading', 'Mock Exams', 'Study Groups', 'Analytics'].map(item => (
                <span key={item} className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================ */}
      <section ref={testimonialReveal.ref} className={`py-20 px-6 bg-slate-50 transition-all duration-1000 ${
        testimonialReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Students Love CoStudy</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Passed Part 1 on my first attempt! The AI tutor explained variance analysis better than any textbook.",
                name: "Priya S.",
                location: "Mumbai",
                result: "Part 1 Passed"
              },
              {
                quote: "The essay grading feature is incredible. I knew exactly what to improve before the real exam.",
                name: "James K.",
                location: "New York",
                result: "Both Parts Cleared"
              },
              {
                quote: "At ₹4K/year vs ₹80K for Gleim, CoStudy is a no-brainer. Same quality, fraction of the cost.",
                name: "Arjun M.",
                location: "Bangalore",
                result: "Part 2 Passed"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Icons.Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.location} • {testimonial.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-20 px-6 bg-brand">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Start Your CMA Journey?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of students who chose the smarter way to prepare.
          </p>
          <button onClick={onGetStarted} className="px-10 py-4 bg-white text-brand text-lg font-bold rounded-xl hover:bg-slate-50 transition-all hover:shadow-xl">
            Start Free Trial →
          </button>
          <p className="mt-4 text-sm text-white/60">No credit card required • 7-day free trial</p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Icons.BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">CoStudy</span>
            <span className="text-slate-500 text-sm">— AI-Powered CMA Prep</span>
          </div>
          <div className="text-sm text-slate-500">© 2026 CoStudy. Built for CMA aspirants.</div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
