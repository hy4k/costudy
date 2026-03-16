/**
 * CoStudy Referral System Service
 * Handles referral code generation, tracking, and rewards
 */

import { supabase } from './supabaseClient';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses: number;
  max_uses: number;
  reward_amount: number;
  created_at: string;
  expires_at?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingRewards: number;
  conversionRate: number;
}

/**
 * Generate unique referral code
 */
const generateReferralCode = (userName: string): string => {
  const cleanName = userName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${random}`;
};

export const referralService = {
  /**
   * Create referral code for user (or get existing)
   */
  async getOrCreateReferralCode(userId: string, userName: string): Promise<ReferralCode | null> {
    try {
      // Check if user already has a code
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) return existing;

      // Create new code
      const code = generateReferralCode(userName);
      
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          uses: 0,
          max_uses: 1000, // Unlimited for practical purposes
          reward_amount: 100, // ₹100 per successful referral
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create referral code error:', error);
      return null;
    }
  },

  /**
   * Validate referral code
   */
  async validateCode(code: string): Promise<{ valid: boolean; referrerId?: string; reward?: number }> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) return { valid: false };

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false };
      }

      // Check if max uses reached
      if (data.uses >= data.max_uses) {
        return { valid: false };
      }

      return {
        valid: true,
        referrerId: data.user_id,
        reward: data.reward_amount
      };
    } catch (error) {
      return { valid: false };
    }
  },

  /**
   * Apply referral code during signup
   */
  async applyReferralCode(
    newUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; reward?: number }> {
    try {
      // Validate code
      const validation = await referralService.validateCode(referralCode);
      if (!validation.valid || !validation.referrerId) {
        return { success: false };
      }

      // Check if new user already used a referral code (prevent abuse)
      const { data: existingUsage } = await supabase
        .from('referral_usage')
        .select('*')
        .eq('referred_user_id', newUserId)
        .single();

      if (existingUsage) {
        console.warn('User already used a referral code');
        return { success: false };
      }

      // Record referral usage
      const { error: usageError } = await supabase
        .from('referral_usage')
        .insert({
          referral_code: referralCode,
          referrer_id: validation.referrerId,
          referred_user_id: newUserId,
          status: 'PENDING', // Will become COMPLETED after first paid action
          reward_amount: validation.reward,
          created_at: new Date().toISOString()
        });

      if (usageError) throw usageError;

      // Increment referral code usage count
      const { error: updateError } = await supabase.rpc('increment_referral_uses', {
        code_id: referralCode
      });

      if (updateError) console.warn('Failed to increment uses:', updateError);

      // Give new user 50% discount on first month (REFEREE BENEFIT)
      await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            firstMonthDiscount: 50,
            referredBy: validation.referrerId
          }
        })
        .eq('id', newUserId);

      return { success: true, reward: validation.reward };
    } catch (error) {
      console.error('Apply referral code error:', error);
      return { success: false };
    }
  },

  /**
   * Complete referral (when referred user makes first payment)
   */
  async completeReferral(referredUserId: string, paymentAmount: number): Promise<boolean> {
    try {
      // Get referral usage
      const { data: usage } = await supabase
        .from('referral_usage')
        .select('*')
        .eq('referred_user_id', referredUserId)
        .eq('status', 'PENDING')
        .single();

      if (!usage) return false;

      // Mark as completed
      await supabase
        .from('referral_usage')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          conversion_amount: paymentAmount
        })
        .eq('id', usage.id);

      // Add reward to referrer's wallet
      const { data: referrerProfile } = await supabase
        .from('user_profiles')
        .select('costudy_status')
        .eq('id', usage.referrer_id)
        .single();

      const currentBalance = referrerProfile?.costudy_status?.walletBalance || 0;
      const newBalance = currentBalance + usage.reward_amount;

      await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            ...referrerProfile?.costudy_status,
            walletBalance: newBalance
          }
        })
        .eq('id', usage.referrer_id);

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: usage.referrer_id,
          type: 'REWARD',
          amount: usage.reward_amount,
          description: `Referral reward for ${referredUserId.slice(0, 8)}`,
          reference_type: 'REFERRAL',
          reference_id: usage.id,
          balance_after: newBalance,
          created_at: new Date().toISOString()
        });

      // Send notification to referrer
      await supabase
        .from('notifications')
        .insert({
          user_id: usage.referrer_id,
          type: 'REWARD',
          content: `You earned ₹${usage.reward_amount} from a successful referral!`,
          link: '/profile?tab=wallet',
          is_read: false,
          created_at: new Date().toISOString()
        });

      return true;
    } catch (error) {
      console.error('Complete referral error:', error);
      return false;
    }
  },

  /**
   * Get referral stats for user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      const { data: referrals } = await supabase
        .from('referral_usage')
        .select('*')
        .eq('referrer_id', userId);

      if (!referrals || referrals.length === 0) {
        return {
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarned: 0,
          pendingRewards: 0,
          conversionRate: 0
        };
      }

      const completed = referrals.filter(r => r.status === 'COMPLETED');
      const pending = referrals.filter(r => r.status === 'PENDING');

      const totalEarned = completed.reduce((sum, r) => sum + (r.reward_amount || 0), 0);
      const pendingRewards = pending.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      return {
        totalReferrals: referrals.length,
        activeReferrals: completed.length,
        totalEarned,
        pendingRewards,
        conversionRate: referrals.length > 0 ? (completed.length / referrals.length) * 100 : 0
      };
    } catch (error) {
      console.error('Get referral stats error:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
        pendingRewards: 0,
        conversionRate: 0
      };
    }
  },

  /**
   * Get referral leaderboard (top referrers)
   */
  async getReferralLeaderboard(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .rpc('get_referral_leaderboard', { limit_count: limit });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Leaderboard error:', error);
      return [];
    }
  },

  /**
   * Generate shareable referral link
   */
  getReferralLink(code: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?invite=${code}`;
  },

  /**
   * Get referral details (who referred whom)
   */
  async getReferralDetails(userId: string) {
    try {
      const { data: referred } = await supabase
        .from('referral_usage')
        .select('*, referred_user:user_profiles!referred_user_id(*)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      return referred || [];
    } catch (error) {
      console.error('Referral details error:', error);
      return [];
    }
  }
};
