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
      { name: 'The Command Deck', limit: 'Full access', included: true },
      { name: 'CMA Alignments', limit: '1 active', included: true },
      { name: 'Study Rooms', limit: 'Unlimited', included: true },
      { name: 'Essay Evaluation', limit: '', included: false },
      { name: 'Full Question Bank', limit: '', included: false },
      { name: 'Unlimited Alignments', limit: '', included: false },
      { name: 'Mock Test Simulations', limit: '', included: false },
      { name: 'Progress Analytics', limit: '', included: false },
    ],
    pro: [
      { name: 'AI Tutor Chat', limit: 'Unlimited', included: true },
      { name: 'MCQ Practice', limit: 'Unlimited', included: true },
      { name: 'The Command Deck', limit: 'Full access', included: true },
      { name: 'CMA Alignments', limit: 'Unlimited', included: true },
      { name: 'Study Rooms', limit: 'Unlimited', included: true },
      { name: 'Essay Evaluation', limit: 'AI-powered', included: true },
      { name: 'Full Question Bank', limit: 'Complete access', included: true },
      { name: 'Mock Test Simulations', limit: 'Real exam feel', included: true },
      { name: 'Progress Analytics', limit: 'Full insights', included: true },
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
            The world's first <span className="text-slate-900 font-semibold">Academic Intelligence Network</span> for CMA US students. 
            Global alignments, peer audits, and AI-powered mastery.
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
              onClick={() => document.getElementById('flagship')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-4 bg-slate-100 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-3"
            >
              See How It Works
              <Icons.ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Global Pulse Ticker */}
          <div className="mt-16 inline-flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-2xl text-white">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              <span className="text-emerald-400 font-bold">Live:</span> Students aligned across India ↔ USA, Singapore ↔ Dubai, UK ↔ Canada
            </span>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FLAGSHIP FEATURE 1: THE COMMAND DECK */}
      {/* ============================================ */}
      <section id="flagship" className="py-24 px-6 bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full mb-4">
              <Icons.Grid className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Flagship Feature</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">The Command Deck</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Not a social feed. A <span className="text-slate-900 font-semibold">High-Signal Academic Intelligence Hub</span> where every interaction is designed for exam success.
            </p>
          </div>

          {/* Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual Mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-brand/20 to-violet-500/20 rounded-[3rem] blur-2xl" />
              <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                {/* Mock Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-brand/80" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Command Deck</span>
                  </div>
                  <div className="flex gap-2">
                    {['Audit Desk', 'Bounty Board', 'Expert Q&A'].map((tab, i) => (
                      <span key={i} className={`px-3 py-1 text-[10px] font-bold rounded-full ${i === 0 ? 'bg-violet-100 text-violet-600' : 'text-slate-400'}`}>
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Mock Posts */}
                <div className="p-6 space-y-4">
                  {/* Post 1: Peer Audit */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-violet-200" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">Priya S.</span>
                        <span className="text-[10px] text-violet-600 ml-2 px-2 py-0.5 bg-violet-100 rounded-full">Peer Audit Request</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">"Review my essay on revenue recognition under ASC 606..."</p>
                    <div className="flex items-center gap-4">
                      <button className="px-3 py-1.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-lg">✓ Compliant</button>
                      <button className="px-3 py-1.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg">✗ Non-Compliant</button>
                    </div>
                  </div>

                  {/* Post 2: MCQ Share */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-brand/20" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">James K.</span>
                        <span className="text-[10px] text-brand ml-2 px-2 py-0.5 bg-brand/10 rounded-full">MCQ Share</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">"This variance question tricked me..."</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="px-2 py-1 bg-slate-50 rounded">A) Favorable</div>
                      <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">B) Unfavorable ✓</div>
                    </div>
                  </div>

                  {/* Vouch Counter */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Icons.CheckBadge className="w-4 h-4 text-violet-500" />
                      <span><span className="font-bold text-slate-900">24</span> Vouches</span>
                    </div>
                    <button className="text-[10px] font-bold text-brand">AI Summary →</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature List */}
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    icon: Icons.Plus,
                    title: 'Academic Protocols',
                    description: 'Deploy structured posts: Standard Questions, MCQ Shares, Resource Drops, or Peer Audit Requests—each optimized for CMA learning.',
                    color: 'violet'
                  },
                  {
                    icon: Icons.CheckBadge,
                    title: 'Vouch System',
                    description: "We don't \"like\"—we Vouch. A professional endorsement that content is academically sound. High vouches = higher reputation.",
                    color: 'emerald'
                  },
                  {
                    icon: Icons.Award,
                    title: 'Bounty Board',
                    description: 'A gig economy for study. Complete tasks from mentors to earn Credits and Reputation Badges.',
                    color: 'amber'
                  },
                  {
                    icon: Icons.Sparkles,
                    title: 'AI Summaries',
                    description: 'Scan 10 posts in the time it takes to read 2. Gemini-powered 3-bullet summaries for every post.',
                    color: 'brand'
                  },
                  {
                    icon: Icons.Scale,
                    title: 'Peer Audit Desk',
                    description: "Review essays like a professional auditor. Render verdicts: Compliant or Non-Compliant based on IMA standards.",
                    color: 'violet'
                  }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center shrink-0`}>
                      <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FLAGSHIP FEATURE 2: CMA ALIGNMENT NETWORK */}
      {/* ============================================ */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <line x1="20%" y1="30%" x2="80%" y2="70%" stroke="url(#lineGrad)" strokeWidth="2" />
            <line x1="30%" y1="60%" x2="70%" y2="40%" stroke="url(#lineGrad)" strokeWidth="2" />
            <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="url(#lineGrad)" strokeWidth="2" />
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full mb-4">
              <Icons.Users className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Crown Jewel Feature</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">CMA Alignment Network</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Transform exam prep from a lonely marathon into a <span className="text-white font-semibold">Synchronized Global Operation</span>. 
              Form borderless academic units with peers worldwide.
            </p>
          </div>

          {/* The Process */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              {
                step: '01',
                title: 'Signal Intercept',
                description: 'Scan the Academic Radar. Find peers hitting 80% accuracy in topics you struggle with.',
                icon: Icons.Search
              },
              {
                step: '02',
                title: 'Treaty Request',
                description: "Send a Contract Proposal—not a friend request. Define purpose, duration, and mission goals.",
                icon: Icons.FileText
              },
              {
                step: '03',
                title: 'Sync Metrics',
                description: 'Profiles link. See real-time telemetry: scores, streaks, consistency. Streak-Lock activated.',
                icon: Icons.BarChart
              },
              {
                step: '04',
                title: 'Execute',
                description: "Context-only messaging. No fluff—every ping is a high-value academic insight.",
                icon: Icons.Rocket
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-brand/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-colors h-full">
                  <div className="text-violet-400 font-black text-sm mb-3">{item.step}</div>
                  <item.icon className="w-8 h-8 text-violet-400 mb-4" />
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-violet-500 to-transparent" />
                )}
              </div>
            ))}
          </div>

          {/* USPs */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* USP Cards */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Icons.Clock className="w-6 h-6 text-violet-400" />
                </div>
                <h4 className="font-bold text-xl">24/7 Academic Factory</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                <span className="text-white font-medium">India ↔ USA Synergy:</span> While you sleep in Mumbai, your partner in NYC audits your essay. 
                Wake up to professional feedback. The sun never sets on your preparation.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-brand/10 to-transparent border border-brand/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
                  <Icons.CheckBadge className="w-6 h-6 text-brand" />
                </div>
                <h4 className="font-bold text-xl">No Ghosting Zone</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Align only with high-reputation peers. Break your contract goals? Your <span className="text-white font-medium">Consistency Score</span> drops. 
                Go "Low-Signal" and lose access to elite partners.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Icons.BarChart className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-xl">Mission Control Dashboard</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                No profile pages—see a <span className="text-white font-medium">Combined Tactical View</span>. 
                Two progress bars racing toward mastery. Real-time performance comparison, side-by-side.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Icons.AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <h4 className="font-bold text-xl">SOS Protocol</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Stuck on a calculation? Trigger <span className="text-white font-medium">Rapid Response</span>—jump into 
                a 15-minute audio session with your aligned peer, anywhere in the world.
              </p>
            </div>
          </div>

          {/* Visual: Global Map Indicator */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-brand border-2 border-slate-900" />
                ))}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Global Alignments Active</div>
                <div className="text-xs text-slate-400">Mumbai ↔ NYC • Delhi ↔ London • Singapore ↔ Toronto</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Features Grid - Compact */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full mb-4">
              <Icons.GraduationCap className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Core Tools</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Plus Everything You Need</h2>
            <p className="text-lg text-slate-500">AI-powered tools built for CMA mastery</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Icons.Brain, title: 'AI Mastermind', description: 'Instant answers to any CMA concept. Knows IMA standards, formulas, exam patterns.' },
              { icon: Icons.ClipboardList, title: 'Smart Question Bank', description: 'Curated MCQs for Part 1 & 2. Automatic weak area tracking.' },
              { icon: Icons.Award, title: 'Mock Simulations', description: 'Real exam feel with timed tests and performance analytics.' },
              { icon: Icons.Pencil, title: 'Essay Grading', description: 'AI evaluation based on official IMA rubrics.' },
              { icon: Icons.TrendingUp, title: 'Progress Analytics', description: 'Track your journey. Optimize your study schedule.' },
              { icon: Icons.BookOpen, title: 'Resource Library', description: 'Access study materials, notes, and official IMA resources.' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand group-hover:scale-110 transition-all">
                  <feature.icon className="w-6 h-6 text-brand group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* STUDY ROOMS - Premium Visual */}
      {/* ============================================ */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full mb-4">
              <Icons.Users className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Collaborative Learning</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Study Rooms</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Join focused study sessions with peers worldwide. Real-time collaboration, 
              shared goals, and accountability that drives results.
            </p>
          </div>

          {/* Main Visual - Room Preview */}
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand/20 via-violet-500/20 to-brand/20 rounded-[3rem] blur-3xl opacity-60" />
            
            <div className="relative grid lg:grid-cols-2 gap-8 items-stretch">
              {/* Left: Room Preview Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                {/* Room Header */}
                <div className="bg-gradient-to-r from-brand to-brand-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icons.BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Part 1: Financial Planning</h4>
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          LIVE
                        </span>
                        <span>•</span>
                        <span>5 members</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Join Room
                  </button>
                </div>

                {/* Room Features */}
                <div className="p-6 space-y-4">
                  {/* Active Members */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-500">{['PR', 'JK', 'SM', 'AL', 'RN'][i]}</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">All focused on Budgeting</span>
                  </div>

                  {/* Focus Timer */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-700">Focus Timer</span>
                      <span className="text-xs text-emerald-600 font-bold">Pomodoro 25</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-brand to-emerald-500 h-full rounded-full transition-all" style={{width: '65%'}} />
                      </div>
                      <span className="font-mono text-lg font-bold text-slate-800">16:23</span>
                    </div>
                  </div>

                  {/* Mission Board Preview */}
                  <div className="border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icons.Target className="w-4 h-4 text-brand" />
                      <span className="text-sm font-bold text-slate-700">Today's Mission</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                          <Icons.CheckCircle className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-600 line-through">Complete 20 MCQs on Cost Behavior</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-brand/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-brand" />
                        </div>
                        <span className="text-sm text-slate-700">Review Variance Analysis formulas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Feature Cards */}
              <div className="space-y-4">
                {[
                  {
                    icon: Icons.Target,
                    title: 'Mission Board',
                    description: 'Set shared goals with deadlines. Track team progress in real-time. Celebrate wins together.',
                    color: 'brand',
                    stat: '3x more likely to complete',
                  },
                  {
                    icon: Icons.Clock,
                    title: 'Synchronized Focus Timer',
                    description: 'Pomodoro sessions sync across all room members. Study together, break together.',
                    color: 'emerald',
                    stat: '25/45/60 min presets',
                  },
                  {
                    icon: Icons.MessageSquare,
                    title: 'Discussion Threads',
                    description: 'Topic-based Q&A with pinned answers. No noise—just high-value exchanges.',
                    color: 'violet',
                    stat: 'Instant doubt clearing',
                  },
                  {
                    icon: Icons.Zap,
                    title: 'Quiz Arena',
                    description: '1v1 MCQ duels or room-wide battles. Compete on the leaderboard.',
                    color: 'amber',
                    stat: 'Gamified learning',
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{feature.title}</h4>
                        <span className={`text-[10px] font-bold text-${feature.color}-600 bg-${feature.color}-50 px-2 py-0.5 rounded-full`}>
                          {feature.stat}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-600 transition-all shadow-lg shadow-brand/20 inline-flex items-center gap-2"
            >
              <Icons.Users className="w-5 h-5" />
              Explore Study Rooms
            </button>
          </div>
        </div>
      </section>

      {/* Mentor Section - Emerald Theme */}
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
            <div className="group p-8 rounded-3xl bg-white border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <Icons.Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Student Dashboard</h3>
              <p className="text-slate-500 leading-relaxed mb-4">
                Track progress, send broadcasts, create private rooms, and manage your practice.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Enrolled student tracking</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Broadcast announcements</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Revenue share on referrals</li>
              </ul>
            </div>

            <div className="group p-8 rounded-3xl bg-white border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <Icons.CheckBadge className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Mentor Badge</h3>
              <p className="text-slate-500 leading-relaxed mb-4">
                All mentors verified by CoStudy. Unique verification code for secure login.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Manual verification by CoStudy</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Unique verification code login</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-4 h-4 text-emerald-500" />Verified badge on profile</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
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
            
            <div className="inline-flex items-center gap-4 p-2 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full">Save 33%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-100 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Free</h3>
              <p className="text-slate-500 mb-8">Perfect to get started</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">₹0</span>
                <span className="text-slate-400 ml-2">forever</span>
              </div>
              <button onClick={onGetStarted} className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all mb-8">
                Get Started Free
              </button>
              <ul className="space-y-3">
                {features.free.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {f.included ? <Icons.CheckCircle className="w-5 h-5 text-emerald-500" /> : <Icons.XCircle className="w-5 h-5 text-slate-300" />}
                    <span className={f.included ? 'text-slate-700' : 'text-slate-400'}>{f.name}</span>
                    {f.limit && f.included && <span className="text-slate-400 text-xs">({f.limit})</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="absolute top-0 right-0 px-3 py-1 bg-violet-500 rounded-full text-xs font-bold">Most Popular</div>
                <h3 className="text-2xl font-black mb-2">Pro</h3>
                <p className="text-slate-400 mb-8">Full power unlocked</p>
                <div className="mb-8">
                  <span className="text-5xl font-black">₹{billingCycle === 'yearly' ? pricing.yearly.monthly : pricing.monthly.price}</span>
                  <span className="text-slate-400 ml-2">/month</span>
                  {billingCycle === 'yearly' && <div className="text-sm text-slate-500 mt-1">Billed ₹{pricing.yearly.price}/year</div>}
                </div>
                <button onClick={onGetStarted} className="w-full py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-600 transition-all mb-8 shadow-lg shadow-brand/30">
                  Start 7-Day Free Trial
                </button>
                <ul className="space-y-3">
                  {features.pro.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Icons.CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>{f.name}</span>
                      {f.limit && <span className="text-slate-500 text-xs">({f.limit})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-500 mb-4">Compare with traditional CMA prep</p>
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm">
              <span className="text-slate-400 line-through">Gleim: ₹80,000+</span>
              <span className="text-slate-400 line-through">Becker: ₹1,20,000+</span>
              <span className="text-slate-900 font-bold px-4 py-2 bg-emerald-100 rounded-full">CoStudy Pro: ₹3,999/year</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">Ready to Become a CMA?</h2>
          <p className="text-xl text-slate-400 mb-10">Join the global network of CMA aspirants preparing smarter together.</p>
          <button onClick={onGetStarted} className="px-12 py-5 bg-brand text-white text-lg font-bold rounded-2xl hover:bg-brand-600 transition-all shadow-2xl shadow-brand/30">
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
          <div className="text-sm">© 2026 CoStudy. Built for CMA aspirants, by CMA aspirants.</div>
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
