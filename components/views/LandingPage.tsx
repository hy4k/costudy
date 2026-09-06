import React from 'react';
import { Icons } from '../Icons';

interface LandingPageProps {
    onLogin: () => void;
    onStartFree: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onStartFree }) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-40 overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand/5 blur-[180px] -mr-40 -mt-40 rounded-full animate-pulse pointer-events-none"></div>
                
                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-200 dark:border-slate-800 shadow-xl mb-12 animate-in slide-in-from-top-4 duration-700">
                        <Icons.CheckBadge className="w-5 h-5 text-brand" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-slate-200">Official CMA US Intelligence Protocol</span>
                    </div>
                    
                    <h1 className="text-7xl sm:text-9xl md:text-[11rem] font-black text-slate-900 dark:text-white tracking-tighter leading-[0.8] mb-4 uppercase">
                        COSTUDY
                    </h1>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-brand tracking-tight mb-10 uppercase">
                        Master CMA Together.
                    </h2>
                    
                    <p className="text-xl sm:text-3xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto mb-16 leading-relaxed italic opacity-80">
                        Modern, AI-powered social network for elite accounting professionals. Hire faculty, collaborate in clusters, and dominate the CMA US exam.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <button 
                            onClick={onStartFree}
                            className="px-12 py-6 bg-brand text-white rounded-[2.5rem] text-sm font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,26,26,0.3)] hover:bg-slate-900 dark:hover:bg-slate-800 hover:scale-105 transition-all active:scale-95"
                        >
                            Start Free
                        </button>
                        <button 
                            onClick={onLogin}
                            className="px-12 py-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.4em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Candidate Login
                        </button>
                    </div>
                </div>
            </section>

            {/* Student Experience Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
                    <div className="w-full lg:col-span-5 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-brand/10 text-brand border border-brand/20 mb-4 sm:mb-6">
                            <Icons.Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Candidate Experience</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-3 sm:mb-4">
                            Master the <span className="text-brand">CMA US</span> Together
                        </h2>
                        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 font-medium mb-6 sm:mb-8 leading-relaxed max-w-xl">
                            Turn solitary study into collaborative momentum. Practice MCQs with 24/7 AI guidance, join live peer clusters, and track your readiness with precision diagnostics.
                        </p>
                        <button 
                            onClick={onStartFree}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-brand hover:bg-brand-600 text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Icons.Sparkles className="w-4 h-4" />
                            Join as a Student
                        </button>
                    </div>

                    <div className="w-full lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4 sm:mb-5">
                                    <Icons.Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">AI Deck & Live Rooms</h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 sm:mb-6">
                                    Instant Socratic explanations for complex accounting concepts, active MCQ drills, and synchronized video study clusters.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">24/7 AI Tutor</span>
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Live Video Rooms</span>
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Interactive MCQs</span>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-4 sm:mb-5">
                                    <Icons.Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-2">Mastery Path & Mocks</h4>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 sm:mb-6">
                                    Structured Part 1 & Part 2 curriculum roadmap, timed mock test simulations, and a deterministic CBQ (Case-Based Question) scoring engine.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-slate-800">
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Part 1 & 2 Roadmap</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Timed Mocks</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">CBQ Scoring</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategic Pricing Section */}
            <section className="px-6 py-24 sm:py-32 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Choose Your Intensity</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Strategic Mastery Plans</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-10 sm:p-14 rounded-[4rem] border border-slate-200 dark:border-slate-800 flex flex-col group hover:border-slate-400 dark:hover:border-slate-700 transition-all shadow-sm">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Free</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium italic mb-10">Perfect to get started</p>
                            
                            <div className="mb-10">
                                <div className="text-5xl font-black text-slate-900 dark:text-white">₹0 <span className="text-xl text-slate-400 dark:text-slate-500">forever</span></div>
                            </div>

                            <ul className="space-y-4 mb-14 flex-1">
                                {[
                                    { text: "AI Tutor Chat", note: "20 questions/day" },
                                    { text: "MCQ Practice", note: "10 questions/day" },
                                    { text: "Study Rooms", note: "Unlimited" },
                                    { text: "Social Feed & Community", note: "Full access" },
                                    { text: "Peer Connections", note: "Unlimited" },
                                    { text: "CBQ Case Practice", disabled: true },
                                    { text: "Full Question Bank", disabled: true },
                                    { text: "Mock Test Simulations", disabled: true },
                                ].map((feat, i) => (
                                    <li key={i} className={`flex items-center gap-3 text-sm font-bold uppercase tracking-widest ${feat.disabled ? 'text-slate-300 dark:text-slate-700 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                        <Icons.CheckCircle className={`w-4 h-4 ${feat.disabled ? 'text-slate-200 dark:text-slate-800' : 'text-emerald-500'}`} />
                                        <span>{feat.text} {feat.note && <span className="text-[10px] lowercase text-slate-400 dark:text-slate-500 font-medium tracking-normal">({feat.note})</span>}</span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={onStartFree} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all">Get Started Free</button>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-slate-900 dark:bg-slate-950 p-10 sm:p-14 rounded-[4rem] border-4 border-brand flex flex-col relative overflow-hidden shadow-2xl group">
                            <div className="absolute top-0 right-0 p-8 text-brand/20 opacity-20 group-hover:scale-110 transition-transform">
                                <Icons.Logo className="w-40 h-40" />
                            </div>
                            <div className="absolute top-8 right-10 bg-brand text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Recommended</div>
                            
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Pro</h3>
                            <p className="text-slate-400 font-medium italic mb-10">Everything you need to pass</p>
                            
                            <div className="mb-10">
                                <div className="text-5xl font-black text-white">₹333 <span className="text-xl text-slate-500">/ month</span></div>
                                <div className="text-[10px] font-black text-brand uppercase tracking-widest mt-2">Billed ₹3999/year</div>
                            </div>

                            <ul className="space-y-4 mb-14 flex-1 relative z-10">
                                {[
                                    { text: "AI Tutor Chat", note: "Unlimited" },
                                    { text: "MCQ Practice", note: "Unlimited" },
                                    { text: "Study Rooms", note: "Unlimited" },
                                    { text: "Social Feed & Community", note: "Full access" },
                                    { text: "Peer Connections", note: "Unlimited" },
                                    { text: "CBQ Case Practice", note: "Server-side deterministic scoring" },
                                    { text: "Full Question Bank", note: "Complete access" },
                                    { text: "Mock Test Simulations", note: "Real exam feel" },
                                    { text: "Progress Analytics", note: "Weak area tracking" },
                                    { text: "Priority Support", note: "24/7 help" },
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-300">
                                        <Icons.CheckCircle className="w-4 h-4 text-brand" />
                                        <span>{feat.text} <span className="text-[10px] lowercase text-slate-500 font-medium tracking-normal">({feat.note})</span></span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={onStartFree} className="w-full py-5 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-brand/20 hover:-translate-y-1 transition-all">Start 7-Day Free Trial</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mentor Application Section */}
            <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
                    <div className="w-full lg:col-span-5 text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-4 sm:mb-6">
                            <Icons.GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Faculty Protocol</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-3 sm:mb-4">
                            Coach & Scale on <span className="text-emerald-500">CoStudy</span>
                        </h2>
                        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 font-medium mb-6 sm:mb-8 leading-relaxed max-w-xl">
                            Empower candidates worldwide. Host private rooms, broadcast announcements, and monetize your expertise through verified faculty partnerships.
                        </p>
                        <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                            <Icons.CheckBadge className="w-4 h-4" />
                            Apply as a Mentor
                        </button>
                    </div>

                    <div className="w-full lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="p-6 sm:p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl sm:rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 sm:mb-5">
                                    <Icons.Grid className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Faculty Dashboard</h4>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 sm:mb-6">
                                    Track student progress across modules, broadcast cohort announcements, and host exclusive study sessions.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-emerald-100 dark:border-emerald-900/30">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Cohort Tracking</span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Broadcasts</span>
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Revenue Share</span>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center mb-4 sm:mb-5">
                                    <Icons.CheckBadge className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mb-2">Verified Status</h4>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 sm:mb-6">
                                    Build trust instantly with high-signal CoStudy verification, dedicated mentor profiles, and priority placement.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-slate-800">
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Verified Badge</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Secure Access</span>
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">High Trust</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
                    <div className="flex items-center gap-4">
                        <Icons.Logo className="w-12 h-12" />
                        <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CoStudy</span>
                    </div>
                    <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                        <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-brand transition-colors">Terms of Use</a>
                        <a href="#" className="hover:text-brand transition-colors">Contact Support</a>
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">© 2025 CoStudy. All strategic rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};