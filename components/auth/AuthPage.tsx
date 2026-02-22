import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { Icons } from '../Icons';

interface AuthPageProps {
    onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            await supabase.auth.signInWithOAuth({ provider: 'google' });
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-900 via-[#0f172a] to-indigo-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Top Nav for Logo/Back */}
            <div className="absolute top-8 left-8">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <Icons.ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
                </button>
            </div>

            <div className="w-full max-w-md relative z-10 glassmorphism bg-slate-900/40 border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg mb-6">
                        <Icons.Logo className="w-10 h-10 text-brand" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">CoStudy</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                        {isLogin ? 'Authenticate Your Protocol' : 'Initialize Your Account'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-500">
                        <Icons.AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Comm Link (Email)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors placeholder:text-white/20"
                            placeholder="operator@fets.in"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Passcode</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:border-brand transition-colors placeholder:text-white/20"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-brand/80 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? <Icons.CloudSync className="w-5 h-5 animate-spin" /> : isLogin ? 'Initiate Login' : 'Deploy Account'}
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Or Bridge With</span>
                </div>

                <button
                    onClick={handleGoogleAuth}
                    type="button"
                    className="w-full py-4 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-[0.1em] shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex justify-center items-center gap-3 border border-slate-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue Via Google
                </button>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
                    >
                        {isLogin ? "Need access? Request Credentials" : "Have credentials? Authenticate Here"}
                    </button>
                </div>
            </div>
        </div>
    );
};
