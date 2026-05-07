/**
 * Referral Dashboard Component
 * Shows referral code, stats, and shareable links
 */

import React, { useState, useEffect } from 'react';
import { referralService, ReferralStats } from '../../services/referralService';
import { Icons } from '../Icons';
import { STUDENT_PAGE_BG, StudentPageChrome } from '../student/StudentPageChrome';

interface ReferralDashboardProps {
  userId: string;
  userName: string;
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ userId, userName }) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const code = await referralService.getOrCreateReferralCode(userId, userName);
      if (code) {
        setReferralCode(code.code);
        const statsData = await referralService.getReferralStats(userId);
        setStats(statsData);
        const referralDetails = await referralService.getReferralDetails(userId);
        setReferrals(referralDetails);
      }
    } catch (error) {
      console.error('Load referral data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = referralService.getReferralLink(referralCode);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const link = referralService.getReferralLink(referralCode);
    const message = `Join me on CoStudy - the #1 CMA exam prep platform! 🎓\n\nGet 50% OFF your first month with my code: ${referralCode}\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTwitter = () => {
    const link = referralService.getReferralLink(referralCode);
    const message = `Preparing for #CMA? Join @CoStudy and get 50% OFF with code ${referralCode} 🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`${STUDENT_PAGE_BG} flex flex-col`}>
      <StudentPageChrome
        eyebrow="Referrals"
        title="Refer & earn ₹100"
        description="Share CoStudy with friends and earn ₹100 for every successful referral. They get 50% off their first month too."
        icon={<Icons.Gift className="h-6 w-6" />}
      />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 pb-12 pt-2 sm:px-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand/15 bg-white p-4 shadow-sm">
          <div className="text-3xl font-black text-slate-900 mb-1">{stats?.totalReferrals || 0}</div>
          <div className="text-sm text-slate-500">Total Referrals</div>
        </div>

        <div className="rounded-xl border border-brand/15 bg-white p-4 shadow-sm">
          <div className="text-3xl font-black text-emerald-600 mb-1">{stats?.activeReferrals || 0}</div>
          <div className="text-sm text-slate-500">Active</div>
        </div>

        <div className="rounded-xl border border-brand/15 bg-white p-4 shadow-sm">
          <div className="text-3xl font-black text-brand mb-1">₹{stats?.totalEarned || 0}</div>
          <div className="text-sm text-slate-500">Earned</div>
        </div>

        <div className="rounded-xl border border-brand/15 bg-white p-4 shadow-sm">
          <div className="text-3xl font-black text-amber-600 mb-1">₹{stats?.pendingRewards || 0}</div>
          <div className="text-sm text-slate-500">Pending</div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="rounded-xl border border-brand/15 bg-white p-6 shadow-clay-red-raised">
        <h3 className="font-bold text-slate-900 mb-4">Your Referral Code</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-brand text-center">
            {referralCode}
          </div>
          <button
            onClick={copyReferralCode}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            {copied ? (
              <Icons.Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <Icons.Copy className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyReferralLink}
            className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand/90 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            <Icons.Link className="w-4 h-4" />
            Copy Link
          </button>
          <button
            onClick={shareViaWhatsApp}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <Icons.MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={shareViaTwitter}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <Icons.Twitter className="w-4 h-4" />
            Tweet
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Icons.Info className="w-5 h-5 text-brand" />
          How It Works
        </h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">1</div>
            <div className="text-sm text-slate-700">
              <strong>Share</strong> your referral code or link with friends
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">2</div>
            <div className="text-sm text-slate-700">
              They <strong>sign up</strong> using your code and get <strong>50% OFF</strong> first month
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">3</div>
            <div className="text-sm text-slate-700">
              When they upgrade to Pro, you <strong>earn ₹100</strong> in your wallet
            </div>
          </li>
        </ol>
      </div>

      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="rounded-xl border border-brand/15 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <img
                    src={ref.referred_user?.avatar || 'https://i.pravatar.cc/150'}
                    alt={ref.referred_user?.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{ref.referred_user?.name || 'Anonymous'}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {ref.status === 'COMPLETED' ? (
                    <div className="text-emerald-600 font-semibold text-sm">+₹100</div>
                  ) : (
                    <div className="text-amber-600 font-semibold text-sm">Pending</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
