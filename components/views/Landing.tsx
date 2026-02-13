import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Animated character component for ZooZoo-style scenes
const StudyCharacter: React.FC<{ 
  emoji: string; 
  animation?: string;
  size?: string;
}> = ({ emoji, animation = 'bounce', size = 'text-6xl' }) => {
  const animations: Record<string, string> = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    float: 'animate-float',
    wave: 'animate-wave',
    think: 'animate-think',
  };
  
  return (
    <span className={`${size} ${animations[animation] || ''} inline-block`}>
      {emoji}
    </span>
  );
};

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
        @keyframes globe-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
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
        .animate-globe-spin { animation: globe-spin 20s linear infinite; }
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
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold transition"
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
          <div className="mt-12">
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white text-xl font-semibold rounded-full transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Free →
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
              Four features. Zero fluff.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Feature 1: Costudying - Global Peer Connection */}
            <FeatureScene
              gradient="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100"
              headline="Costudy with someone in New York."
              subtext="While you sleep, they review your work."
              delay={0}
              visual={
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* India student */}
                  <div className="absolute left-8 flex flex-col items-center">
                    <div className="relative">
                      <span className="text-5xl">👨‍💻</span>
                      <span className="absolute -bottom-1 -right-1 text-lg">🇮🇳</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">Mumbai</span>
                  </div>
                  
                  {/* Connection line with pulse */}
                  <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-1 flex items-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-connect-line rounded-full" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full">
                      <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping-slow" />
                    </div>
                  </div>
                  
                  {/* US student */}
                  <div className="absolute right-8 flex flex-col items-center">
                    <div className="relative">
                      <span className="text-5xl">👩‍💻</span>
                      <span className="absolute -bottom-1 -right-1 text-lg">🇺🇸</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">New York</span>
                  </div>
                </div>
              }
            />

            {/* Feature 2: Smart Engine */}
            <FeatureScene
              gradient="bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100"
              headline="Ask anything about CMA."
              subtext="CoStudy's engine knows it all."
              delay={100}
              visual={
                <div className="relative flex flex-col items-center">
                  {/* Chat bubbles */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <div className="self-end bg-slate-900 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm animate-float" style={{ animationDelay: '0s' }}>
                      What's transfer pricing? 🤔
                    </div>
                    <div className="self-start bg-white border-2 border-emerald-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm animate-float" style={{ animationDelay: '0.5s' }}>
                      <span className="font-semibold text-emerald-600">CoStudy:</span> It's when divisions of the same company...
                    </div>
                  </div>
                  {/* Brain icon */}
                  <div className="absolute -bottom-2 right-4 text-4xl animate-think">
                    🧠
                  </div>
                </div>
              }
            />

            {/* Feature 3: MCQ Practice */}
            <FeatureScene
              gradient="bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100"
              headline="Practice MCQs by topic."
              subtext="Know exactly where you're weak."
              delay={200}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* MCQ Card mockup */}
                  <div className="bg-white rounded-2xl shadow-lg p-5 w-64 transform rotate-2 hover:rotate-0 transition-transform">
                    <div className="text-xs text-amber-600 font-semibold mb-2">PART 1 • BUDGETING</div>
                    <div className="text-sm font-medium text-slate-800 mb-3">
                      A flexible budget is...
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center">A</div>
                        <span className="text-slate-600">Fixed at one level</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center font-bold">B</div>
                        <span className="text-slate-900 font-medium">Adjusted for activity ✓</span>
                      </div>
                    </div>
                  </div>
                  {/* Checkmark burst */}
                  <div className="absolute -top-2 -right-2 text-3xl animate-bounce">
                    ✅
                  </div>
                </div>
              }
            />

            {/* Feature 4: Mock Exams */}
            <FeatureScene
              gradient="bg-gradient-to-br from-rose-100 via-pink-50 to-red-100"
              headline="Mock exams. Prometric style."
              subtext="Same pressure. Same interface."
              delay={300}
              visual={
                <div className="relative flex items-center justify-center">
                  {/* Timer and exam mockup */}
                  <div className="bg-slate-900 rounded-xl p-4 w-64 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">SECTION 1 OF 2</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Icons.Clock className="w-3 h-3" />
                        <span className="text-xs font-mono">02:45:30</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div className="h-full w-1/3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-medium
                            ${i < 4 ? 'bg-emerald-500' : i === 4 ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}
                          `}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Stress emoji */}
                  <div className="absolute -bottom-4 -left-4 text-4xl animate-wave">
                    😤
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

      {/* Simple Social Proof - No Fake Numbers */}
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
              className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white text-xl font-semibold rounded-full transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started →
            </button>
            <button 
              onClick={onLogin}
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
