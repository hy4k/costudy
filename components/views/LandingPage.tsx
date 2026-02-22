import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white font-sans selection:bg-brand selection:text-white">
            {/* Header */}
            <header className="px-6 py-8 sm:px-12 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <Icons.Logo className="w-8 h-8 text-white animate-pulse" />
                    <span className="text-xl font-black uppercase tracking-tighter">CoStudy</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-brand text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand/80 transition-all shadow-lg shadow-brand/20"
                    >
                        Get Started Free
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 sm:pt-32 sm:pb-40 px-6 text-center overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">AI-Powered CMA Intelligence Active</span>
                    </div>

                    <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl">
                        MASTER<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-rose-400">THE CMA.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 font-medium mb-12 max-w-2xl px-4">
                        CoStudy is the first collaborative learning engine built specifically for US CMA candidates.
                        Deploy Focus Rooms, study alongside peers, and leverage real-time AI mentoring.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-5 bg-white text-slate-900 rounded-lg text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all flex justify-center items-center gap-2"
                        >
                            Get Started Free <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full sm:w-auto px-8 py-5 bg-white/5 text-white rounded-lg border border-white/10 text-sm font-black uppercase tracking-[0.2em] hover:bg-white/10 active:scale-95 transition-all flex justify-center items-center"
                        >
                            See How It Works
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-slate-50 relative z-20 rounded-t-[4rem] sm:rounded-t-[6rem]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Strategic Assets</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Everything you need to conquer the exam.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                title: "Command Deck",
                                description: "Your personalized dashboard for tracking progress, managing study missions, and reviewing your real-time academic stats.",
                                icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
                                color: "text-brand", bgColor: "bg-brand/10"
                            },
                            {
                                title: "Study Rooms",
                                description: "Synchronized Pomodoro sessions. Lock in with other candidates globally to stay accountable and focused.",
                                icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                                color: "text-emerald-500", bgColor: "bg-emerald-500/10"
                            },
                            {
                                title: "Alignment Network",
                                description: "Establish peer-to-peer contracts. Find audit partners to grade your essays and challenge your conceptual knowledge.",
                                icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
                                color: "text-indigo-500", bgColor: "bg-indigo-500/10"
                            },
                            {
                                title: "AI Mastermind",
                                description: "FETS AI is available 24/7. It explains complex variances, joint costing, and ethics scenarios step-by-step.",
                                icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
                                color: "text-amber-500", bgColor: "bg-amber-500/10"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-slate-200 hover:shadow-2xl transition-all hover:-translate-y-2 group">
                                <div className={`w-16 h-16 ${feature.bgColor} ${feature.color} rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{feature.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 px-6 bg-slate-900 border-t border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-4">Tactical Deployments</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Choose your operational tier.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Free Tier */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 p-10 sm:p-12 rounded-xl flex flex-col items-center text-center">
                            <h3 className="text-xl font-black uppercase tracking-widest text-slate-300 mb-2">Base Access</h3>
                            <div className="text-5xl font-black text-white tabular-nums tracking-tighter mb-6">₹0<span className="text-xl text-slate-500 font-bold">/mo</span></div>
                            <ul className="text-sm text-slate-400 font-medium space-y-4 mb-10 w-full text-left">
                                <li className="flex items-center gap-3"><Icons.Check className="w-5 h-5 text-emerald-400" /> Public Study Rooms</li>
                                <li className="flex items-center gap-3"><Icons.Check className="w-5 h-5 text-emerald-400" /> Community Wall</li>
                                <li className="flex items-center gap-3"><Icons.Check className="w-5 h-5 text-emerald-400" /> Basic AI Queries</li>
                            </ul>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 rounded-lg bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20 px-4"
                            >
                                Start Free
                            </button>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-brand border border-brand/50 p-10 sm:p-14 rounded-xl flex flex-col items-center text-center shadow-2xl relative transform md:scale-105 z-10">
                            <div className="absolute -top-4 bg-white text-brand text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">Recommended</div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-white/90 mb-2">Pro Scholar</h3>
                            <div className="text-6xl font-black text-white tabular-nums tracking-tighter mb-6">₹333<span className="text-xl text-white/60 font-bold">/mo</span></div>
                            <ul className="text-sm text-white/90 font-bold space-y-4 mb-10 w-full text-left">
                                <li className="flex items-center gap-3"><Icons.Check className="w-6 h-6 text-white" /> Private & Mentor-Led Rooms</li>
                                <li className="flex items-center gap-3"><Icons.Check className="w-6 h-6 text-white" /> Unlimited AI Deep Dives</li>
                                <li className="flex items-center gap-3"><Icons.Check className="w-6 h-6 text-white" /> Request Peer Audits</li>
                                <li className="flex items-center gap-3"><Icons.Check className="w-6 h-6 text-white" /> Full Analytics History</li>
                            </ul>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-5 rounded-lg bg-white text-brand text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all px-4"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-950 border-t border-white/5 text-center px-6">
                <Icons.Logo className="w-6 h-6 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl font-black tracking-tighter text-slate-500 uppercase">CoStudy</h4>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mt-2 mb-8">Powered by FETS Academy</p>

                <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Support</a>
                </div>
            </footer>
        </div>
    );
};
