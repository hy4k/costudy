import { supabase } from './supabase';

export interface InviteStats {
  has_code: boolean;
  code?: string;
  max_uses?: number;
  uses_count?: number;
  uses_remaining?: number;
  invitees?: Array<{
    user_id: string;
    used_at: string;
    name: string;
    avatar: string;
  }>;
  created_at?: string;
}

export interface ValidateResult {
  valid: boolean;
  error?: string;
  code?: string;
  owner_id?: string;
  uses_remaining?: number;
}

export interface UseCodeResult {
  success: boolean;
  error?: string;
  code?: string;
  invited_by?: string;
  uses_remaining?: number;
}

/**
 * Validate an invite code before signup
 */
export const validateInviteCode = async (code: string): Promise<ValidateResult> => {
  const { data, error } = await supabase.rpc('validate_invite_code', {
    input_code: code.toUpperCase()
  });

  if (error) {
    console.error('Error validating invite code:', error);
    return { valid: false, error: error.message };
  }

  return data as ValidateResult;
};

/**
 * Use an invite code during signup
 */
export const useInviteCode = async (code: string, userId: string): Promise<UseCodeResult> => {
  const { data, error } = await supabase.rpc('use_invite_code', {
    input_code: code.toUpperCase(),
    new_user_id: userId
  });

  if (error) {
    console.error('Error using invite code:', error);
    return { success: false, error: error.message };
  }

  return data as UseCodeResult;
};

/**
 * Get current user's invite stats (their code + who they've invited)
 */
export const getMyInviteStats = async (): Promise<InviteStats | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_invite_stats', {
    user_id: user.id
  });

  if (error) {
    console.error('Error getting invite stats:', error);
    return null;
  }

  return data as InviteStats;
};

/**
 * Create invite code for user (usually auto-triggered, but can be manual)
 */
export const createMyInviteCode = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('create_user_invite_code', {
    user_id: user.id
  });

  if (error) {
    console.error('Error creating invite code:', error);
    return null;
  }

  return data as string;
};

/**
 * Generate shareable invite link
 */
export const getInviteLink = (code: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/signup?invite=${code}`;
};

/**
 * Copy invite link to clipboard
 */
export const copyInviteLink = async (code: string): Promise<boolean> => {
  const link = getInviteLink(code);
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Share invite via Web Share API (mobile-friendly)
 */
export const shareInvite = async (code: string, userName?: string): Promise<boolean> => {
  const link = getInviteLink(code);
  const shareData = {
    title: 'Join me on CoStudy!',
    text: `Hey! I'm studying for CMA US on CoStudy and thought you'd find it helpful. Use my invite code ${code} to join! 📚`,
    url: link
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      console.error('Share failed:', err);
      return false;
    }
  }

  // Fallback to copy
  return copyInviteLink(code);
};
