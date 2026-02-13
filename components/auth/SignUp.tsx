
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { authService } from '../../services/fetsService';
import { validateInviteCode, useInviteCode } from '../../services/inviteService';

interface SignUpProps {
  onSignUp: () => void;
  onSwitch: () => void;
  onBack?: () => void;
  initialInviteCode?: string; // From URL param ?invite=XXXXXX
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitch, onBack, initialInviteCode = '' }) => {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState(''); // Mentor verification
  const [inviteCode, setInviteCode] = useState(initialInviteCode); // Student invite code
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteOwnerId, setInviteOwnerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-validate initial invite code from URL
  useEffect(() => {
    if (initialInviteCode && initialInviteCode.length === 6) {
      checkInviteCode(initialInviteCode);
    }
  }, [initialInviteCode]);

  // Instant Theme Preview for Role Selection
  useEffect(() => {
    const root = document.documentElement;
    if (role === 'TEACHER') {
        // Teacher Theme (Teal/Specialist)
        root.style.setProperty('--color-brand-50', '#f0fdfa');
        root.style.setProperty('--color-brand-100', '#ccfbf1');
        root.style.setProperty('--color-brand-200', '#99f6e4');
        root.style.setProperty('--color-brand-300', '#5eead4');
        root.style.setProperty('--color-brand-400', '#2dd4bf');
        root.style.setProperty('--color-brand-500', '#0d9488');
        root.style.setProperty('--color-brand-600', '#0f766e');
        root.style.setProperty('--color-brand-700', '#115e59');
        root.style.setProperty('--color-brand-800', '#134e4a');
        root.style.setProperty('--color-brand-900', '#042f2e');
    } else {
        // Student Theme (Red/Brand)
        root.style.setProperty('--color-brand-50', '#fff1f1');
        root.style.setProperty('--color-brand-100', '#ffdfdf');
        root.style.setProperty('--color-brand-200', '#ffc5c5');
        root.style.setProperty('--color-brand-300', '#ff9d9d');
        root.style.setProperty('--color-brand-400', '#ff6464');
        root.style.setProperty('--color-brand-500', '#ff1a1a');
        root.style.setProperty('--color-brand-600', '#ed0000');
        root.style.setProperty('--color-brand-700', '#c80000');
        root.style.setProperty('--color-brand-800', '#a50404');
        root.style.setProperty('--color-brand-900', '#890b0b');
    }
  }, [role]);

  // Check invite code validity
  const checkInviteCode = async (code: string) => {
    if (code.length !== 6) {
      setInviteValid(null);
      setInviteOwnerId(null);
      return;
    }

    setInviteChecking(true);
    const result = await validateInviteCode(code);
    setInviteValid(result.valid);
    setInviteOwnerId(result.owner_id || null);
    setInviteChecking(false);

    if (!result.valid && result.error) {
      setError(result.error);
    } else {
      setError(null);
    }
  };

  // Handle invite code input change
  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setInviteCode(value);
    
    if (value.length === 6) {
      checkInviteCode(value);
    } else {
      setInviteValid(null);
      setInviteOwnerId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Mentor Verification Logic
    if (role === 'TEACHER' && accessCode !== 'CMA2025') {
        setError("Invalid Specialist Access Code. Mentorship is currently invite-only. Use 'CMA2025' for demo.");
        setIsLoading(false);
        return;
    }

    // Student Invite Code Validation
    if (role === 'STUDENT') {
      if (!inviteCode || inviteCode.length !== 6) {
        setError("Invite code is required. Get one from a current CoStudy member!");
        setIsLoading(false);
        return;
      }
      
      if (inviteValid !== true) {
        setError("Please enter a valid invite code before signing up.");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Create the account
      const data = await authService.signUp(email, password, name, role);
      const user = data?.user;
      
      // If student, consume the invite code
      if (role === 'STUDENT' && user?.id && inviteCode) {
        const useResult = await useInviteCode(inviteCode, user.id);
        if (!useResult.success) {
          console.warn("Failed to record invite code usage:", useResult.error);
          // Don't block signup, just log it
        }
      }

      // Wait for session propagation
      setTimeout(() => onSignUp(), 800);
    } catch (err: any) {
      console.error("Signup Flow Error:", err);
      if (err.message.includes('Database error')) {
        setError("Account creation hiccup. This email might already be pending verification, or the server is busy. Please try again in 30 seconds.");
      } else {
        setError(err.message || "Failed to create candidate profile. Ensure details are valid.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-[1200px] bg-white/[0.03] backdrop-blur-3xl rounded-[4.5rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Header Area */}
          <div className="lg:col-span-12 p-12 lg:p-16 pb-0 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <Icons.Logo className="w-12 h-12" />
                <span className="text-2xl font-black tracking-tighter text-white uppercase">CoStudy</span>
             </div>
             <div className="flex items-center gap-6">
                {onBack && (
                   <button onClick={onBack} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-2">
                     <Icons.Plus className="rotate-45 w-4 h-4" /> Universe
                   </button>
                )}
                <button onClick={onSwitch} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">Already registered?</button>
             </div>
          </div>

          {/* Role Selection (Left) */}
          <div className="lg:col-span-5 p-16 pt-10">
            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter leading-none">Choose Your <span className="text-brand">Path</span></h2>
            <div className="space-y-6">
               <div 
                onClick={() => setRole('STUDENT')}
                className={`p-10 rounded-[3rem] border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group ${role === 'STUDENT' ? 'border-brand bg-brand/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
               >
                  <div className={`absolute top-0 right-0 p-8 transition-opacity duration-300 ${role === 'STUDENT' ? 'opacity-100' : 'opacity-0'}`}>
                      <Icons.CheckBadge className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight transition-colors ${role === 'STUDENT' ? 'text-brand' : 'text-white'}`}>CMA Aspirant</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Master CMA US concepts with AI guidance and peer support.</p>
               </div>
               
               <div 
                onClick={() => setRole('TEACHER')}
                className={`p-10 rounded-[3rem] border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group ${role === 'TEACHER' ? 'border-brand bg-brand/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}
               >
                  <div className={`absolute top-0 right-0 p-8 transition-opacity duration-300 ${role === 'TEACHER' ? 'opacity-100' : 'opacity-0'}`}>
                      <Icons.CheckBadge className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight transition-colors ${role === 'TEACHER' ? 'text-brand' : 'text-white'}`}>CMA Specialist</h3>
                  <p className="text-sm text-slate-500 font-medium italic">Mentor aspirants, broadcast insights, and monetize your expertise.</p>
               </div>
            </div>
          </div>

          {/* Details Form (Right) */}
          <div className="lg:col-span-7 p-16 pt-10 bg-white/5">
            <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter leading-none">{role === 'TEACHER' ? 'Specialist' : 'Aspirant'} <span className="text-brand">Profile</span></h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-6 bg-brand/10 border border-brand/20 rounded-[2rem] text-brand text-[11px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-4">
                  {error}
                </div>
              )}

              {/* Invite Code Input for Students */}
              {role === 'STUDENT' && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <div className="relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-6 text-brand">
                      <Icons.Gift className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="INVITE CODE"
                      value={inviteCode}
                      onChange={handleInviteCodeChange}
                      maxLength={6}
                      className={`w-full border-2 rounded-[1.5rem] px-8 py-5 pl-16 text-white font-mono font-black text-center text-xl tracking-[0.3em] uppercase outline-none transition-all focus:ring-4 ${
                        inviteValid === true 
                          ? 'bg-emerald-500/10 border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/10' 
                          : inviteValid === false 
                            ? 'bg-brand/10 border-brand/50 focus:border-brand focus:ring-brand/10'
                            : 'bg-white/5 border-white/10 focus:border-brand/50 focus:ring-brand/5'
                      } placeholder:text-slate-600 placeholder:font-sans placeholder:text-sm placeholder:tracking-widest`}
                    />
                    {/* Status Icon */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-6">
                      {inviteChecking && (
                        <div className="w-5 h-5 border-2 border-slate-500 border-t-brand rounded-full animate-spin" />
                      )}
                      {!inviteChecking && inviteValid === true && (
                        <Icons.CheckCircle className="w-6 h-6 text-emerald-500" />
                      )}
                      {!inviteChecking && inviteValid === false && (
                        <Icons.XCircle className="w-6 h-6 text-brand" />
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-4">
                    {inviteValid === true 
                      ? '✓ Valid invite code!' 
                      : '* Get an invite code from a current CoStudy member'
                    }
                  </p>
                </div>
              )}

              <input 
                type="text" 
                required
                placeholder="Official Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-brand/5"
              />
              <input 
                type="email" 
                required
                placeholder="Primary Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-brand/5"
              />
              <input 
                type="password" 
                required
                placeholder="Secure Access Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] px-8 py-5 text-white font-bold outline-none focus:border-brand/50 transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-brand/5"
              />

              {/* Mentor Verification Code Input */}
              {role === 'TEACHER' && (
                  <div className="animate-in slide-in-from-top-4 duration-500 pt-2">
                      <div className="relative">
                        <div className="absolute top-1/2 -translate-y-1/2 left-6 text-brand">
                            <Icons.CheckBadge className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            required
                            placeholder="Specialist Access Code (Invite Only)"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="w-full bg-brand/5 border-2 border-brand/20 rounded-[1.5rem] px-8 py-5 pl-16 text-white font-bold outline-none focus:border-brand/50 transition-all placeholder:text-brand/40 focus:ring-4 focus:ring-brand/5"
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-4">* Verification Required for Faculty Access (Try 'CMA2025')</p>
                  </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || (role === 'STUDENT' && inviteValid !== true)}
                className="w-full py-6 bg-brand text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-4 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Seeding Identity...</>
                ) : (
                  role === 'TEACHER' ? 'Confirm Specialist Access' : 'Confirm Candidate Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
