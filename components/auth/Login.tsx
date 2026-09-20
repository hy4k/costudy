
import React, { useState } from 'react';
import { Icons } from '../Icons';
import { authService } from '../../services/fetsService';

interface LoginProps {
  onLogin: () => void;
  onSwitch: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitch, onBack }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
  const [loginType, setLoginType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (view === 'LOGIN') {
        // Auth is unified, but we use the type to customize the loading/error experience if needed
        await authService.signIn(email, password);
        onLogin();
      } else {
        await authService.resetPassword(email);
        setSuccess("Recovery link dispatched. Please check your inbox (and spam folder).");
      }
    } catch (err: any) {
      setError(err.message || "Action failed. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand/10 blur-[180px] -mr-40 -mt-40 rounded-full animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/[0.03] backdrop-blur-3xl rounded-[4.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Brand Side */}
        <div className={`p-16 flex flex-col justify-center border-r border-white/5 bg-gradient-to-br transition-all duration-700 ${loginType === 'TEACHER' ? 'from-emerald-900/20' : 'from-white/[0.02]'} to-transparent`}>
          <div className="flex items-center justify-between mb-16 animate-in slide-in-from-left duration-700">
             <div className="flex items-center gap-4">
                <Icons.Logo className="w-16 h-16" />
                <span className="text-4xl font-black tracking-tighter text-white uppercase">CoStudy</span>
             </div>
             {onBack && (
               <button onClick={onBack} className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Icons.Plus className="rotate-45 w-4 h-4" /> Universe
               </button>
             )}
          </div>
          <h1 className="text-7xl font-black text-white leading-[0.85] tracking-tighter uppercase mb-8 scale-y-110">
            The <span className={`${loginType === 'TEACHER' ? 'text-emerald-500' : 'text-brand'}`}>CMA US</span> Study Universe
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md italic opacity-80">
            {loginType === 'TEACHER' 
                ? "\"Lead the next generation of finance professionals. Your expertise, their mastery.\"" 
                : "\"Beyond a platform. Your strategy for CMA US mastery. Connect, collaborate, and dominate the exam.\""}
          </p>
        </div>

        {/* Form Side */}
        <div className="p-16 flex flex-col justify-center bg-white/5 relative">
          <div className="max-w-md mx-auto w-full">
            {/* Login Type Toggle */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
               <button 
                 onClick={() => setLoginType('STUDENT')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'STUDENT' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                 Aspirant
               </button>
               <button 
                 onClick={() => setLoginType('TEACHER')}
                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'TEACHER' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                 Mentor
               </button>
            </div>

            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
              {view === 'LOGIN' ? (loginType === 'TEACHER' ? 'Faculty Access' : 'Candidate Portal') : 'Recovery Center'}
            </h2>
            <p className="text-slate-500 font-bold mb-12 uppercase text-[10px] tracking-[0.4em]">
              {view === 'LOGIN' ? (loginType === 'TEACHER' ? 'Secure Specialist Login' : 'Authenticate Your Journey') : 'Reset Your Neural Key'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl text-brand text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-4">
                  {success}
                </div>
              )}
              
              <div className="group relative">
                <input 
                  type="email" 
                  required
                  placeholder={loginType === 'TEACHER' ? "Faculty ID (Email)" : "Aspirant ID (Email)"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold outline-none transition-all placeholder:text-slate-600 focus:ring-8 ${loginType === 'TEACHER' ? 'focus:border-emerald-500/50 focus:ring-emerald-500/5' : 'focus:border-brand/50 focus:ring-brand/5'}`}
                />
              </div>

              {view === 'LOGIN' && (
                <div className="space-y-4">
                  <div className="group relative">
                    <input 
                      type="password" 
                      required
                      placeholder="Secure Access Key"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold outline-none transition-all placeholder:text-slate-600 focus:ring-8 ${loginType === 'TEACHER' ? 'focus:border-emerald-500/50 focus:ring-emerald-500/5' : 'focus:border-brand/50 focus:ring-brand/5'}`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setView('FORGOT')}
                      className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Forgot Access Key?
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-6 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4 mt-8 ${loginType === 'TEACHER' ? 'bg-emerald-600 shadow-emerald-500/20 hover:shadow-emerald-500/40' : 'bg-brand shadow-brand/20 hover:shadow-brand/40'}`}
              >
                {isLoading ? (
                  <><Icons.CloudSync className="w-5 h-5 animate-spin" /> {view === 'LOGIN' ? 'Verifying Profile...' : 'Dispatching...'}</>
                ) : (
                  view === 'LOGIN' ? 'Authorize Entry' : 'Request Recovery Link'
                )}
              </button>

              {view === 'FORGOT' && (
                <button 
                  type="button"
                  onClick={() => setView('LOGIN')}
                  className="w-full text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Return to Portal
                </button>
              )}
            </form>

            <div className="mt-12 pt-12 border-t border-white/5 text-center">
               <button 
                onClick={onSwitch}
                className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand hover:text-white transition-all shadow-xl"
               >
                 Register New Profile
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
