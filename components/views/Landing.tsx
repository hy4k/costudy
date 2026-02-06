import React, { useState } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const features = {
    free: [
      { name: 'AI Tutor Chat', limit: '20 questions/day', included: true },
      { name: 'MCQ Practice', limit: '10 questions/day', included: true },
      { name: 'Study Rooms', limit: 'Unlimited', included: true },
      { name: 'Social Feed & Community', limit: 'Full access', included: true },
      { name: 'Peer Connections', limit: 'Unlimited', included: true },
      { name: 'Essay Evaluation', limit: '', included: false },
      { name: 'Full Question Bank', limit: '', included: false },
      { name: 'Mock Test Simulations', limit: '', included: false },
      { name: 'Progress Analytics', limit: '', included: false },
      { name: 'Priority Support', limit: '', included: false },
    ],
    pro: [
      { name: 'AI Tutor Chat', limit: 'Unlimited', included: true },
      { name: 'MCQ Practice', limit: 'Unlimited', included: true },
      { name: 'Study Rooms', limit: 'Unlimited', included: true },
      { name: 'Social Feed & Community', limit: 'Full access', included: true },
      { name: 'Peer Connections', limit: 'Unlimited', included: true },
      { name: 'Essay Evaluation', limit: 'AI-powered grading', included: true },
      { name: 'Full Question Bank', limit: 'Complete access', included: true },
      { name: 'Mock Test Simulations', limit: 'Real exam feel', included: true },
      { name: 'Progress Analytics', limit: 'Weak area tracking', included: true },
      { name: 'Priority Support', limit: '24/7 help', included: true },
    ],
  };

  const pricing = {
    monthly: { price: 499, period: '/month' },
    yearly: { price: 3999, period: '/year', monthly: 333, savings: '33% off' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
              <Icons.BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">CoStudy</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-brand transition-colors"
            >
              Log In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand/20"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full mb-8">
            <Icons.Sparkles className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-brand uppercase tracking-wider">AI-Powered CMA US Prep</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
            Pass Your CMA Exam<br />
            <span className="text-brand">Learn Together</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered study platform built for CMA US students. 
            Smart practice, instant feedback, and a community of future CMAs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-10 py-4 bg-brand text-white text-lg font-bold rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand/30 flex items-center gap-3"
            >
              <Icons.Rocket className="w-5 h-5" />
              Start Free Today
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-4 bg-slate-100 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-3"
            >
              View Pricing
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-slate-400">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">Part 1 & 2</div>
              <div className="text-xs font-bold uppercase tracking-wider">Full Coverage</div>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">IMA</div>
              <div className="text-xs font-bold uppercase tracking-wider">Aligned Content</div>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">24/7</div>
              <div className="text-xs font-bold uppercase tracking-wider">AI Tutor</div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different - NEW SUBTLE SECTION */}
      <section className="py-16 px-6 bg-gradient-to-r from-brand/5 via-white to-emerald-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Not Just Another Prep Course</h2>
            <p className="text-slate-500">Three things that make CoStudy different</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* The Wall */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center">
                <Icons.MessageSquare className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">The Wall</h3>
              <p className="text-sm text-slate-500">
                A knowledge exchange, not a social feed. Share MCQs, get peer reviews on essays, and learn from high-signal discussions.
              </p>
            </div>
            
            {/* Study Partners */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Icons.Users className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Find Study Partners</h3>
              <p className="text-sm text-slate-500">
                Connect with peers who complement your weaknesses. Someone in the US can review your essay while you sleep.
              </p>
            </div>
            
            {/* Study Rooms */}
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Icons.Home className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Study Rooms</h3>
              <p className="text-sm text-slate-500">
                Join live rooms for group practice. Solve MCQs together, share resources, and keep each other accountable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Features Grid - Red/White Theme */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full mb-4">
              <Icons.GraduationCap className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">For Students</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Everything You Need to Pass</h2>
            <p className="text-lg text-slate-500">Built specifically for CMA US exam preparation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Icons.Brain,
                title: 'AI Mastermind Tutor',
                description: 'Get instant answers to any CMA concept. Our AI knows IMA standards, formulas, and exam patterns.',
              },
              {
                icon: Icons.ClipboardList,
                title: 'Smart Question Bank',
                description: 'Practice with our curated question bank covering Part 1 and Part 2. Track your weak areas automatically.',
              },
              {
                icon: Icons.Award,
                title: 'Mock Test Simulations',
                description: 'Experience the real exam with timed tests, proctored environment, and detailed performance analytics.',
              },
              {
                icon: Icons.Pencil,
                title: 'Essay Evaluation',
                description: 'Submit essays and get AI-powered grading based on official IMA rubrics and scoring criteria.',
              },
              {
                icon: Icons.Users,
                title: 'Global Study Network',
                description: 'Connect with CMA aspirants worldwide. Find study partners, join group sessions, and stay motivated together.',
              },
              {
                icon: Icons.BarChart,
                title: 'Progress Analytics',
                description: 'Track your preparation journey. Identify weak topics and optimize your study schedule.',
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand/5 to-transparent rounded-bl-[3rem] rounded-tr-3xl" />
                
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center mb-6 shadow-lg shadow-brand/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor Section - Emerald/White Theme */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-4">
              <Icons.Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">For Mentors</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Teach, Earn & Impact</h2>
            <p className="text-lg text-slate-500">Help students succeed while building your coaching business</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mentor Card 1 */}
            <div className="group relative p-8 rounded-3xl bg-white border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-[4rem] rounded-tr-3xl" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <Icons.Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Student Dashboard</h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  Track your students' progress, send broadcasts, create private study rooms, and manage your coaching practice.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Enrolled student tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Broadcast announcements
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Revenue share on referrals
                  </li>
                </ul>
              </div>
            </div>

            {/* Mentor Card 2 */}
            <div className="group relative p-8 rounded-3xl bg-white border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-[4rem] rounded-tr-3xl" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <Icons.CheckBadge className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Mentor Badge</h3>
                <p className="text-slate-500 leading-relaxed mb-4">
                  All mentors are verified by CoStudy. Get a unique code for secure login and build trust with students.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Manual verification by CoStudy
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Unique verification code login
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500" />
                    Verified badge on profile
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mentor CTA */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Are you a CMA or accounting professional?</p>
            <button className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
              Apply to Become a Mentor
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Simple, Honest Pricing</h2>
            <p className="text-lg text-slate-500 mb-8">Start free, upgrade when you're ready</p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-2 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-slate-900 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-white text-slate-900 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">
                  Save 33%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Free</h3>
                <p className="text-slate-500">Perfect to get started</p>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">₹0</span>
                <span className="text-slate-400 ml-2">forever</span>
              </div>

              <button
                onClick={onGetStarted}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all mb-8"
              >
                Get Started Free
              </button>

              <ul className="space-y-4">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feature.included ? (
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <Icons.XCircle className="w-5 h-5 text-slate-300 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                        {feature.name}
                      </span>
                      {feature.limit && (
                        <span className="text-slate-400 text-sm ml-2">({feature.limit})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl" />
              
              <div className="relative">
                <div className="absolute top-0 right-0 px-3 py-1 bg-brand/90 rounded-full text-xs font-bold uppercase shadow-lg">
                  Most Popular
                </div>
                
                <div className="mb-8">
                  <h3 className="text-2xl font-black mb-2">Pro</h3>
                  <p className="text-slate-400">Everything you need to pass</p>
                </div>
                
                <div className="mb-8">
                  <span className="text-5xl font-black">
                    ₹{billingCycle === 'yearly' ? pricing.yearly.monthly : pricing.monthly.price}
                  </span>
                  <span className="text-slate-400 ml-2">/month</span>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-slate-500 mt-1">
                      Billed ₹{pricing.yearly.price}/year
                    </div>
                  )}
                </div>

                <button
                  onClick={onGetStarted}
                  className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-600 transition-all mb-8 shadow-lg shadow-brand/30"
                >
                  Start 7-Day Free Trial
                </button>

                <ul className="space-y-4">
                  {features.pro.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-white">{feature.name}</span>
                        {feature.limit && (
                          <span className="text-slate-500 text-sm ml-2">({feature.limit})</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Comparison to competitors */}
          <div className="mt-16 text-center">
            <p className="text-slate-500 mb-4">Compare with traditional CMA prep courses</p>
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="text-slate-400">
                <span className="line-through">Gleim: ₹80,000+</span>
              </div>
              <div className="text-slate-400">
                <span className="line-through">Becker: ₹1,20,000+</span>
              </div>
              <div className="text-slate-900 font-bold px-4 py-2 bg-emerald-100 rounded-full">
                CoStudy Pro: ₹3,999/year
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            Ready to Become a CMA?
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join CMA aspirants already preparing smarter with AI-powered tools.
          </p>
          <button
            onClick={onGetStarted}
            className="px-12 py-5 bg-brand text-white text-lg font-bold rounded-2xl hover:bg-brand-600 transition-all shadow-2xl shadow-brand/30"
          >
            Start Your CMA Journey — Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center">
              <Icons.BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">CoStudy</span>
          </div>
          <div className="text-sm">
            © 2026 CoStudy. Built for CMA aspirants, by CMA aspirants.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
