import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons } from '../Icons';
import { costudyService } from '../../services/costudyService';
import { supabase } from '../../services/supabaseClient';

interface LaunchMomentumProps {
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

interface ReferralItem {
  id: string;
  invitee: string;
  status: string;
  created_at: string;
  credits_rewarded: number;
}

const FOUNDER_TIERS = [
  {
    level: 1,
    title: 'Initiate Scholar',
    requiredCount: 0,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    perks: ['Standard Study Wall Access', 'CoStudy AI Flashcards', 'Public Study Rooms']
  },
  {
    level: 2,
    title: 'Founding Member',
    requiredCount: 1,
    badgeColor: 'bg-brand/10 text-brand border-brand/30',
    perks: ["'Founder' Badge on Wall & Profile", 'Early AI Prometric Essay Autograder Access', '+250 Bonus Credits']
  },
  {
    level: 3,
    title: 'Founding Vanguard',
    requiredCount: 3,
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    perks: ['Priority Mentor Q&A Queue', 'VIP Study Room Host Privileges', '+750 Cumulative Bonus Credits']
  },
  {
    level: 4,
    title: 'Founding Regent',
    requiredCount: 5,
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    perks: ['Monthly 1-on-1 Mentor Office Hours', '3 Months Free Pro Tier Subscription', 'Lifetime Leaderboard Founder Seal']
  }
];

const LEADERBOARD_AMBASSADORS = [
  { rank: 1, name: 'David Chen', handle: 'cma_david', count: 18, tier: 'Founding Regent', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { rank: 2, name: 'Ananya Sharma', handle: 'ananya_fin', count: 14, tier: 'Founding Regent', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  { rank: 3, name: 'Marcus Vance', handle: 'marcus_v', count: 11, tier: 'Founding Regent', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { rank: 4, name: 'Priya Nair', handle: 'pnair_cma', count: 9, tier: 'Founding Regent', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { rank: 5, name: 'Siddharth R.', handle: 'sid_cma', count: 7, tier: 'Founding Regent', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
];

export const LaunchMomentum: React.FC<LaunchMomentumProps> = ({ userId, userName = 'Candidate', userAvatar }) => {
  const [inviteeInput, setInviteeInput] = useState('');
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate personalized referral code/link
  const userHandle = userName.toLowerCase().replace(/[^a-z0-0]/g, '') || 'scholar';
  const referralCode = `FOUNDER-${userHandle.toUpperCase()}-2026`;
  const referralLink = `https://costudy.in/join?ref=${referralCode}`;

  useEffect(() => {
    const fetchReferralStats = async () => {
      let activeUserId = userId;
      if (!activeUserId) {
        const { data } = await supabase.auth.getUser();
        activeUserId = data?.user?.id || 'anon';
      }
      const stats = await costudyService.getReferralStats(activeUserId || 'anon');
      setReferrals(stats.referrals || []);
      setReferralCount(stats.referralCount || 0);
      setCreditsEarned(stats.creditsEarned || 0);
    };
    fetchReferralStats();
  }, [userId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setToastMessage('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeInput.trim()) return;

    setIsSending(true);
    try {
      let activeUserId = userId;
      if (!activeUserId) {
        const { data } = await supabase.auth.getUser();
        activeUserId = data?.user?.id || 'anon';
      }

      const newRef = await costudyService.sendReferralInvite(activeUserId || 'anon', inviteeInput.trim());
      setReferrals(prev => [newRef, ...prev]);
      setReferralCount(prev => prev + 1);
      setCreditsEarned(prev => prev + 250);
      setInviteeInput('');
      setToastMessage(`Founder invitation dispatched to ${inviteeInput}! +250 Credits awarded.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to send invite:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Determine current tier
  let currentTier = FOUNDER_TIERS[0];
  let nextTier = FOUNDER_TIERS[1];
  if (referralCount >= 5) {
    currentTier = FOUNDER_TIERS[3];
    nextTier = FOUNDER_TIERS[3];
  } else if (referralCount >= 3) {
    currentTier = FOUNDER_TIERS[2];
    nextTier = FOUNDER_TIERS[3];
  } else if (referralCount >= 1) {
    currentTier = FOUNDER_TIERS[1];
    nextTier = FOUNDER_TIERS[2];
  }

  const invitesToNext = nextTier.requiredCount > referralCount ? nextTier.requiredCount - referralCount : 0;
  const progressPercent = Math.min(100, Math.round((referralCount / (nextTier.requiredCount || 1)) * 100));

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0b0f19] p-6 sm:p-10 max-w-7xl mx-auto space-y-10 pb-24">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold font-mono"
          >
            <Icons.Sparkles className="w-5 h-5 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 sm:p-12 text-white shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                <Icons.Sparkles className="w-3.5 h-3.5" /> Launch Momentum Program
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 text-[10px] font-mono rounded-full">
                Founder Circle
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none">
              Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-brand-400 to-rose-400">Founder Status</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-xl">
              Help us ignite the CoStudy community before our official public launch. Invite fellow CMA candidates to join your peer study circle, unlock exclusive early features, and earn lifetime Founder distinction.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                <Icons.Users className="w-6 h-6 text-brand" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invites Verified</div>
                  <div className="text-xl font-black font-mono text-white">{referralCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                <Icons.Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bonus Credits</div>
                  <div className="text-xl font-black font-mono text-amber-400">+{creditsEarned} PTS</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                <Icons.Award className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Tier</div>
                  <div className="text-sm font-black text-purple-300 uppercase">{currentTier.title}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Holographic Founder Digital Pass Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 rounded-[2.5rem] border border-amber-500/30 shadow-[0_20px_50px_rgba(245,158,11,0.15)] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Icons.Logo className="w-8 h-8" />
                  <div>
                    <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">CoStudy Founder Pass</div>
                    <div className="text-xs font-mono text-slate-400">{referralCode}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 font-mono text-[9px] font-bold rounded-lg border border-amber-400/30">
                  VERIFIED EARLY ADOPTER
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`}
                  alt={userName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/50"
                />
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">{userName}</h4>
                  <div className="text-xs font-mono text-amber-400 font-bold">{currentTier.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Joined CoStudy Founder Cohort 2026</div>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Founder Perks:</div>
                <ul className="space-y-1">
                  {currentTier.perks.map((perk, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                      <Icons.CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Official Early Access Digital Pass • Non-Transferable
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Launch Community Radar Meter */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Community Radar</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Community Milestone: Launch Readiness
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              We are assembling 1,000 Founder Candidates to launch the global CoStudy CMA Grand Tournament.
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">785</span>
            <span className="text-slate-400 text-sm font-bold font-mono"> / 1,000 Founders</span>
          </div>
        </div>

        {/* Meter Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-700 relative">
            <div
              className="bg-gradient-to-r from-brand to-amber-500 h-full rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: '78.5%' }}
            ></div>
          </div>

          <div className="grid grid-cols-3 text-[10px] font-mono font-bold text-slate-400 pt-1">
            <div>250: Peer Audit Engine</div>
            <div className="text-center">500: Grand Tournament</div>
            <div className="text-right text-emerald-500 font-black">1000: Official Public Launch</div>
          </div>
        </div>
      </div>

      {/* Viral Referral Toolkit & Tier Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Referral Link & Direct Invitation Suite */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              Your Viral Referral Suite
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              Share your unique referral link with classmates, study groups, or on social media. Each verified join grants you +250 Credits.
            </p>
          </div>

          {/* Copy Link Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Unique Founder Link
            </label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-2xl">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white px-3 flex-1 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-slate-900 text-white hover:bg-brand shadow-md'
                }`}
              >
                <Icons.Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Direct Email/Name Invite Form */}
          <form onSubmit={handleSendInvite} className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Send Direct Founder Invitation
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inviteeInput}
                onChange={(e) => setInviteeInput(e.target.value)}
                placeholder="Enter classmate's email or handle (e.g. alex@cma.com)"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isSending || !inviteeInput.trim()}
                className="px-6 py-3 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-brand-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
              >
                <Icons.Send className="w-4 h-4" />
                {isSending ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>

          {/* Quick Social Share Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Quick Share Channels
            </span>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join me on CoStudy - the AI-powered peer learning network for CMA candidates! Use my founder code: ${referralCode} at ${referralLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Icons.MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Icons.Share2 className="w-4 h-4" /> LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Excited to join CoStudy's Founder Cohort for CMA prep! Get early access with my code: ${referralCode}`)}&url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Icons.Send className="w-4 h-4" /> X / Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Founder Tier Ladder */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
              Founder Perks Ladder
            </h3>
            <p className="text-slate-500 text-xs font-medium">
              Unlock cumulative privileges as your referrals join.
            </p>
          </div>

          {/* Tier Progress Bar to Next */}
          {invitesToNext > 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500 uppercase">Progress to {nextTier.title}</span>
                <span className="font-mono text-brand font-black">{referralCount} / {nextTier.requiredCount} Invites</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                Need {invitesToNext} more invite{invitesToNext > 1 ? 's' : ''} to reach {nextTier.title}!
              </div>
            </div>
          ) : (
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl text-purple-600 font-bold text-xs flex items-center gap-3">
              <Icons.Trophy className="w-6 h-6 text-purple-600 shrink-0" />
              <span>Congratulations! You have reached the highest tier: Founding Regent.</span>
            </div>
          )}

          {/* Tiers List */}
          <div className="space-y-4">
            {FOUNDER_TIERS.map((tier) => {
              const isUnlocked = referralCount >= tier.requiredCount;
              return (
                <div
                  key={tier.level}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUnlocked
                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${tier.badgeColor}`}>
                      {tier.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {tier.requiredCount === 0 ? '0 Invites' : `${tier.requiredCount}+ Invites`}
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {tier.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        {isUnlocked ? (
                          <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Icons.Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Referrals Activity Table & Top Ambassadors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Referral Activity List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Your Invited Peers ({referrals.length})
              </h3>
              <p className="text-slate-500 text-xs font-medium">Real-time referral confirmation ledger</p>
            </div>
            <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-mono font-bold rounded-xl">
              +250 PTS per join
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Icons.Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold uppercase tracking-wider">No invites recorded yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Send your first invitation above to start unlocking Founder privileges!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto no-scrollbar">
              {referrals.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                      {item.invitee.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{item.invitee}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Invited {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold rounded-lg border border-emerald-500/20 block mb-1">
                      {item.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">+250 Credits</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Founding Ambassadors Leaderboard */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Top Founder Ambassadors
            </h3>
            <p className="text-slate-500 text-xs font-medium">Leading advocates driving the CoStudy launch momentum</p>
          </div>

          <div className="space-y-4">
            {LEADERBOARD_AMBASSADORS.map((ambassador) => (
              <div
                key={ambassador.rank}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                      ambassador.rank === 1
                        ? 'bg-amber-400 text-slate-900 shadow-md'
                        : ambassador.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : ambassador.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    #{ambassador.rank}
                  </span>

                  <img
                    src={ambassador.avatar}
                    alt={ambassador.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />

                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{ambassador.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">@{ambassador.handle}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-brand">{ambassador.count} Invites</div>
                  <div className="text-[9px] font-bold text-amber-500 uppercase">{ambassador.tier}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchMomentum;
