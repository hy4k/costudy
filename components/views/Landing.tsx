import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Feature Scene Card - ZooZoo style
const FeatureScene: React.FC<{
  visual: React.ReactNode;
  headline: string;
  subtext?: string;
  gradient: string;
  delay?: number;
}> = ({ visual, headline, subtext, gradient, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className={`
        relative overflow-hidden rounded-3xl p-8 
        ${gradient}
        transform transition-all duration-700 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        hover:scale-[1.02] hover:shadow-2xl
        cursor-pointer group
      `}
    >
      {/* Visual/Character Area */}
      <div className="h-40 flex items-center justify-center mb-6">
        {visual}
      </div>
      
      {/* Text */}
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 text-center leading-tight">
        {headline}
      </h3>
      {subtext && (
        <p className="text-slate-600 text-center mt-2 text-lg">
          {subtext}
        </p>
      )}
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-3xl" />
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [scrollY, setScrollY] = useState(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        @keyframes think {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes connect-line {
          0% { width: 0; opacity: 0; }
          50% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-wave { animation: wave 1s ease-in-out infinite; }
        .animate-think { animation: think 2s ease-in-out infinite; }
        .animate-connect-line { animation: connect-line 2s ease-out forwards; }
        .animate-ping-slow { animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">COSTUDY</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onLogin} className="text-slate-600 hover:text-slate-900 font-medium transition">
                Sign In
              </button>
              <button 
                onClick={onGetStarted} 
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white rounded-full font-semibold transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Big Bold Header */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, slate 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="max-w-5xl mx-auto relative text-center">
          {/* Main Logo Text */}
          <h1 
            className="text-[8rem] md:text-[12rem] lg:text-[14rem] font-black tracking-tighter leading-none text-slate-900"
            style={{ 
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            COSTUDY
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-2xl md:text-3xl font-medium tracking-[0.3em] text-slate-400 uppercase mt-4"
            style={{ 
              transform: `translateY(${scrollY * 0.05}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            CMA Success Universe
          </p>
          
          {/* Simple CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-semibold rounded-full transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join as Student →
            </button>
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-semibold rounded-full transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Feature Scenes - ZooZoo Style */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section intro */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              This is how you pass.
            </h2>
            <p className="text-xl text-slate-500">
              Six features. Zero fluff.
            </p>
          </div>

          {/* Feature Grid - 6 cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Costudying - Global Peer Connection */}
            <FeatureScene
              gradient="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100"
              headline="Costudy with someone in New York."
              subtext="While you sleep, they review your work."
              delay={0}
              visual={
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* India student */}
                  <div className="absolute left-4 flex flex-col items-center">
                    <div className="relative">
                      <span className="text-4xl">👨‍💻</span>
                      <span className="absolute -bottom-1 -right-1 text-sm">🇮🇳</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">Cochin</span>
                  </div>
                  
                  {/* Connection line with pulse */}
                  <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-1 flex items-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-connect-line rounded-full" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full">
                      <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping-slow" />
                    </div>
                  </div>
                  
                  {/* US student */}
                  <div className="absolute right-4 flex flex-col items-center">
                    <div className="relative">
                      <span className="text-4xl">👩‍💻</span>
                      <span className="absolute -bottom-1 -right-1 text-sm">🇺🇸</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-medium">New York</span>
                  </div>
                </div>
              }
            />

            {/* Feature 2: Smart Engine (AI Tutor) */}
            <FeatureScene
              gradient="bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100"
              headline="Ask anything about CMA."
              subtext="CoStudy's engine knows it all."
              delay={100}
              visual={
                <div className="relative flex flex-col items-center justify-center h-full">
                  {/* Chat bubbles */}
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <div className="self-end bg-slate-900 text-white px-3 py-2 rounded-2xl rounded-br-sm text-xs animate-float" style={{ animationDelay: '0s' }}>
                      What's transfer pricing? 🤔
                    </div>
                    <div className="self-start bg-white border-2 border-emerald-200 px-3 py-2 rounded-2xl rounded-bl-sm text-xs animate-float" style={{ animationDelay: '0.5s' }}>
                      <span className="font-semibold text-emerald-600">CoStudy:</span> It's when divisions...
                    </div>
                  </div>
                </div>
              }
            />

            {/* Feature 3: Study Rooms */}
            <FeatureScene
              gradient="bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100"
              headline="Study Rooms with Focus Timer."
              subtext="Synchronized sessions worldwide."
              delay={200}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* Study Room Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 w-56">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-amber-600">PART 1 WARRIORS</div>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-pink-400 border-2 border-white"></div>
                        <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"></div>
                        <div className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white text-[8px] flex items-center justify-center font-bold">+2</div>
                      </div>
                    </div>
                    <div className="text-center py-3 bg-slate-900 rounded-xl text-white">
                      <div className="text-2xl font-mono font-bold">24:58</div>
                      <div className="text-[10px] text-slate-400">Focus Timer</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      5 studying now
                    </div>
                  </div>
                </div>
              }
            />

            {/* Feature 4: Mock Exams - Prometric Style */}
            <FeatureScene
              gradient="bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100"
              headline="Mock exams. Prometric authentic."
              subtext="Same interface. Same pressure."
              delay={300}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* Prometric-style exam mockup */}
                  <div className="bg-slate-100 rounded-lg overflow-hidden w-64 shadow-lg border border-slate-300">
                    {/* Header */}
                    <div className="bg-slate-200 px-3 py-2 flex items-center justify-between text-[10px]">
                      <div>
                        <div className="font-bold text-slate-700">Question: 1</div>
                        <div className="text-slate-500">Section: 1</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500">Time Remaining:</div>
                        <div className="font-mono font-bold text-slate-700">00:44:50</div>
                      </div>
                      <button className="px-2 py-1 bg-green-600 text-white rounded text-[9px] font-bold">
                        Finish Section
                      </button>
                    </div>
                    {/* Body */}
                    <div className="flex">
                      {/* Question numbers */}
                      <div className="bg-slate-200 p-1 flex flex-col gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <div key={n} className={`w-5 h-4 rounded text-[8px] flex items-center justify-center font-bold ${n === 1 ? 'bg-amber-400 text-white' : 'bg-amber-200 text-amber-800'}`}>
                            {n}
                          </div>
                        ))}
                      </div>
                      {/* Question area */}
                      <div className="flex-1 p-2">
                        <div className="text-[8px] text-slate-600 mb-2">The system used to accumulate and analyze...</div>
                        <div className="space-y-1">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} className="flex items-center gap-1 text-[8px] bg-white border-l-2 border-green-500 px-1 py-0.5">
                              <span className="font-bold text-slate-500">{opt}</span>
                              <span className="text-slate-600">{opt === 'A' ? 'human capital' : opt === 'B' ? 'intellectual capital' : opt === 'C' ? 'natural capital' : 'manufactured'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="bg-green-700 px-2 py-1 flex items-center justify-end gap-1">
                      <button className="px-2 py-0.5 bg-green-600 text-white rounded text-[8px]">← Prev</button>
                      <button className="px-2 py-0.5 bg-green-600 text-white rounded text-[8px]">Next →</button>
                    </div>
                  </div>
                </div>
              }
            />

            {/* Feature 5: Social Wall */}
            <FeatureScene
              gradient="bg-gradient-to-br from-rose-100 via-pink-50 to-red-100"
              headline="The Social Wall."
              subtext="Share doubts. Get answers. Help others."
              delay={400}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* Social Wall mockup */}
                  <div className="bg-white rounded-2xl shadow-lg p-3 w-56">
                    {/* Post */}
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-400"></div>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-800">Priya • <span className="text-slate-400 font-normal">2h ago</span></div>
                        <div className="text-[9px] text-slate-600 mt-1">Can someone explain the difference between absorption and variable costing? 🤔</div>
                      </div>
                    </div>
                    {/* Engagement */}
                    <div className="flex items-center gap-3 text-[9px] text-slate-500 border-t pt-2">
                      <span className="flex items-center gap-1">💬 12</span>
                      <span className="flex items-center gap-1">❤️ 8</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">✓ Solved</span>
                    </div>
                    {/* Reply preview */}
                    <div className="mt-2 bg-slate-50 rounded-lg p-2">
                      <div className="text-[9px] text-slate-600">
                        <span className="font-bold text-emerald-600">Prof. Kumar:</span> Great question! The key difference is in how fixed manufacturing overhead...
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            {/* Feature 6: Hire Teachers */}
            <FeatureScene
              gradient="bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100"
              headline="Hire expert teachers."
              subtext="Solo sessions or split with your room."
              delay={500}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* Teacher hire mockup */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 w-56">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl">
                        👨‍🏫
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Prof. Sharma</div>
                        <div className="text-[10px] text-emerald-600 font-medium">⭐ 4.9 • 120 sessions</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500">Solo</div>
                        <div className="text-sm font-bold text-slate-900">₹500</div>
                      </div>
                      <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center border-2 border-emerald-200">
                        <div className="text-[10px] text-emerald-600">Room Split</div>
                        <div className="text-sm font-bold text-emerald-700">₹100<span className="text-[10px] font-normal">/each</span></div>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                      Book Session →
                    </button>
                  </div>
                </div>
              }
            />

          </div>
        </div>
      </section>

      {/* Essay Feature - Full Width */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto">
          <FeatureScene
            gradient="bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100"
            headline="Write essays. Get graded instantly."
            subtext="CoStudy evaluates like the IMA would."
            delay={0}
            visual={
              <div className="flex items-center justify-center gap-8">
                {/* Essay input */}
                <div className="bg-white rounded-xl shadow-lg p-4 w-48">
                  <div className="text-xs text-violet-600 font-semibold mb-2">YOUR ESSAY</div>
                  <div className="h-16 bg-slate-100 rounded p-2 text-[8px] text-slate-400 leading-relaxed">
                    The variance analysis shows that the material price variance is favorable because...
                  </div>
                  <div className="mt-2 flex justify-end">
                    <div className="px-2 py-1 bg-violet-600 text-white text-[10px] rounded font-medium">
                      Submit →
                    </div>
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="text-3xl animate-float">→</div>
                
                {/* Feedback */}
                <div className="bg-white rounded-xl shadow-lg p-4 w-48 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs text-emerald-600 font-semibold">FEEDBACK</div>
                    <span className="text-lg">✨</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mb-1">82/100</div>
                  <div className="text-[10px] text-slate-500">
                    Good analysis! Consider adding journal entries...
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* For Teachers Section */}
      <section className="py-20 px-4 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-semibold mb-4">
              <Icons.Award className="w-4 h-4" /> FOR TEACHERS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Teach globally. Earn professionally.
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join CoStudy as a verified mentor. Set your rates, get discovered by students worldwide, and build your teaching empire.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Icons.CheckBadge className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Verified Badge</h4>
              <p className="text-slate-500">Get verified by CoStudy. Build trust with students instantly.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Icons.Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Flash Sessions</h4>
              <p className="text-slate-500">Get pulled into study rooms for 1-hour deep dives. Split fees among students.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Icons.Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Set Your Rates</h4>
              <p className="text-slate-500">You decide your worth. CoStudy handles payments securely.</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold rounded-full transition transform hover:scale-105"
            >
              Apply as Teacher →
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-500 mb-8">Start free. Upgrade when ready.</p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-slate-100 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  billingCycle === 'monthly' ? 'bg-red-600 text-white' : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  billingCycle === 'yearly' ? 'bg-red-600 text-white' : 'text-slate-500'
                }`}
              >
                Yearly <span className="text-emerald-500 text-sm">Save 33%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-slate-400 mb-6">Get started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {['20 AI questions/day', '10 MCQ practice/day', 'Community Wall access', 'Basic study rooms'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition">
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-red-50 to-white rounded-2xl border-2 border-red-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-slate-400 mb-6">For serious candidates</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ₹{billingCycle === 'yearly' ? '333' : '499'}
                </span>
                <span className="text-slate-400">/month</span>
                {billingCycle === 'yearly' && (
                  <div className="text-sm text-slate-500">Billed ₹3,999/year</div>
                )}
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {['Unlimited AI questions', 'Unlimited MCQ practice', 'Mock test simulations', 'Essay AI evaluation', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition">
                Upgrade to Pro
              </button>
            </div>

            {/* Mentor */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-2xl font-bold mb-2">Mentor</h3>
              <p className="text-slate-400 mb-6">Teach and earn</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹1,999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {['Everything in Pro', 'Student dashboard', 'Revenue share', 'Verified badge', 'Analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition">
                Become a Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-full mb-8">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 font-medium">
              Invite-only beta. Limited spots.
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to pass the CMA?
          </h2>
          
          <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto">
            Join students who study smarter, not harder. Get your invite code from a friend, or request early access.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-semibold rounded-full transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Request Access →
            </button>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-slate-50 text-slate-900 text-xl font-semibold rounded-full transition border-2 border-slate-200"
            >
              I Have an Invite
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">COSTUDY</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 text-sm">CMA Success Universe</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 transition">About</a>
              <a href="#" className="hover:text-slate-900 transition">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition">Terms</a>
              <a href="mailto:hello@costudy.in" className="hover:text-slate-900 transition">Contact</a>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-slate-400">
            © 2026 CoStudy. Built for CMA candidates worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
};
