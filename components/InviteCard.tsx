import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { 
  getMyInviteStats, 
  copyInviteLink, 
  shareInvite,
  InviteStats 
} from '../services/inviteService';

interface InviteCardProps {
  compact?: boolean;
}

export const InviteCard: React.FC<InviteCardProps> = ({ compact = false }) => {
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getMyInviteStats();
    setStats(data);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!stats?.code) return;
    const success = await copyInviteLink(stats.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!stats?.code) return;
    await shareInvite(stats.code);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats?.has_code) {
    return null;
  }

  const usesRemaining = stats.uses_remaining || 0;
  const usesCount = stats.uses_count || 0;
  const maxUses = stats.max_uses || 3;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Icons.Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Your Invite Code</div>
              <div className="text-lg font-mono font-black text-slate-900">{stats.code}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{usesRemaining}/{maxUses} left</span>
            <button 
              onClick={handleCopy}
              className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
            >
              {copied ? (
                <Icons.CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <Icons.Copy className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Icons.Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Invite Friends</h3>
            <p className="text-sm text-red-100">Share CoStudy with your study buddies</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Code Display */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Invite Code</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              <span className="text-2xl font-mono font-black text-slate-900 tracking-widest">{stats.code}</span>
            </div>
            <button 
              onClick={handleCopy}
              className="p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              title="Copy invite link"
            >
              {copied ? (
                <Icons.CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <Icons.Copy className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-emerald-600 font-medium">✓ Invite link copied to clipboard!</p>
          )}
        </div>

        {/* Usage Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Invites Used</span>
            <span className="text-sm font-bold text-slate-900">{usesCount} / {maxUses}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
              style={{ width: `${(usesCount / maxUses) * 100}%` }}
            />
          </div>
          {usesRemaining > 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              You have <span className="font-bold text-red-600">{usesRemaining}</span> invite{usesRemaining !== 1 ? 's' : ''} remaining
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-600 font-medium">
              ⚠️ All invites used
            </p>
          )}
        </div>

        {/* Invitees List */}
        {stats.invitees && stats.invitees.length > 0 && (
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">People You've Invited</label>
            <div className="mt-3 space-y-2">
              {stats.invitees.map((invitee, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {invitee.name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{invitee.name || 'New Student'}</div>
                    <div className="text-xs text-slate-500">
                      Joined {new Date(invitee.used_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Button */}
        {usesRemaining > 0 && (
          <button 
            onClick={handleShare}
            className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Share className="w-5 h-5" />
            Share Invite Link
          </button>
        )}
      </div>
    </div>
  );
};
