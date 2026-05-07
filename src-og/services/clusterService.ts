import { supabase } from './supabaseClient';
import {
  EnhancedStudyRoom,
  StudyRoomMember,
  StudyRoomMission,
  MCQWarSession,
  MCQWarParticipant,
  WhiteboardSession,
  GroupSubscription,
  GroupInvite,
  MentorAvailability,
  MentorSession,
  SessionPayment,
  Vouch,
  PostSummary,
  Badge,
  UserBadge,
  RoomLeaderboardEntry,
  calculateGroupPricing,
  calculateSplitFee,
  BillingCycle
} from '../types';

// ==========================================
// STUDY ROOM / CLUSTER HUB SERVICE
// ==========================================

export const clusterService = {
  // --- Room Management ---
  
  getRooms: async (roomType?: string): Promise<EnhancedStudyRoom[]> => {
    try {
      let query = supabase
        .from('study_rooms')
        .select('*')
        .order('members_count', { ascending: false });
      
      if (roomType) {
        query = query.eq('room_type', roomType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching rooms:', e);
      return [];
    }
  },

  getRoomById: async (roomId: string): Promise<EnhancedStudyRoom | null> => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching room:', e);
      return null;
    }
  },

  createRoom: async (room: Partial<EnhancedStudyRoom>): Promise<EnhancedStudyRoom | null> => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .insert([{
          ...room,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error creating room:', e);
      return null;
    }
  },

  updateRoomSettings: async (roomId: string, settings: Partial<EnhancedStudyRoom['settings']>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({ settings })
        .eq('id', roomId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating room settings:', e);
      return false;
    }
  },

  // --- Room Members ---
  
  getRoomMembers: async (roomId: string): Promise<StudyRoomMember[]> => {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .select('*, user:user_profiles(*)')
        .eq('room_id', roomId)
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching room members:', e);
      return [];
    }
  },

  joinRoom: async (roomId: string, userId: string): Promise<StudyRoomMember | null> => {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .insert([{
          room_id: roomId,
          user_id: userId,
          role: 'MEMBER',
          status: 'ACTIVE',
          signal_light: 'GREEN',
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update room member count
      await supabase.rpc('increment_room_members', { room_id: roomId });
      
      return data;
    } catch (e) {
      console.error('Error joining room:', e);
      return null;
    }
  },

  updateSignalLight: async (roomId: string, userId: string, signalLight: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('study_room_members')
        .update({ 
          signal_light: signalLight,
          last_active_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating signal light:', e);
      return false;
    }
  },

  markDailyContribution: async (roomId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('study_room_members')
        .update({ daily_contribution: true })
        .eq('room_id', roomId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Check if all members contributed and update streak
      await supabase.rpc('update_cluster_streak', { p_room_id: roomId });
      
      return true;
    } catch (e) {
      console.error('Error marking contribution:', e);
      return false;
    }
  },

  // --- Missions ---
  
  getRoomMissions: async (roomId: string): Promise<StudyRoomMission[]> => {
    try {
      const { data, error } = await supabase
        .from('study_room_missions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching missions:', e);
      return [];
    }
  },

  createMission: async (mission: Partial<StudyRoomMission>): Promise<StudyRoomMission | null> => {
    try {
      const { data, error } = await supabase
        .from('study_room_missions')
        .insert([{
          ...mission,
          status: 'ACTIVE',
          current_value: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error creating mission:', e);
      return null;
    }
  },

  updateMissionProgress: async (missionId: string, newValue: number): Promise<boolean> => {
    try {
      // Get current mission
      const { data: mission } = await supabase
        .from('study_room_missions')
        .select('*')
        .eq('id', missionId)
        .single();
      
      if (!mission) return false;
      
      const updates: Partial<StudyRoomMission> = { current_value: newValue };
      
      // Check if mission completed
      if (newValue >= mission.target_value) {
        updates.status = 'COMPLETED';
        updates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('study_room_missions')
        .update(updates)
        .eq('id', missionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating mission:', e);
      return false;
    }
  },

  certifyMission: async (missionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('study_room_missions')
        .update({ status: 'CERTIFIED' })
        .eq('id', missionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error certifying mission:', e);
      return false;
    }
  },

  // --- MCQ War Room ---
  
  createWarSession: async (session: Partial<MCQWarSession>): Promise<MCQWarSession | null> => {
    try {
      const { data, error } = await supabase
        .from('mcq_war_sessions')
        .insert([{
          ...session,
          status: 'WAITING',
          room_accuracy: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error creating war session:', e);
      return null;
    }
  },

  joinWarSession: async (sessionId: string, userId: string): Promise<MCQWarParticipant | null> => {
    try {
      const { data, error } = await supabase
        .from('mcq_war_participants')
        .insert([{
          session_id: sessionId,
          user_id: userId,
          score: 0,
          questions_answered: 0,
          accuracy: 0,
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error joining war session:', e);
      return null;
    }
  },

  startWarSession: async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mcq_war_sessions')
        .update({ 
          status: 'LIVE',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error starting war session:', e);
      return false;
    }
  },

  updateWarParticipant: async (sessionId: string, userId: string, score: number, answered: number): Promise<boolean> => {
    try {
      const accuracy = answered > 0 ? (score / answered) * 100 : 0;
      
      const { error } = await supabase
        .from('mcq_war_participants')
        .update({ 
          score,
          questions_answered: answered,
          accuracy
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating participant:', e);
      return false;
    }
  },

  endWarSession: async (sessionId: string): Promise<boolean> => {
    try {
      // Calculate room accuracy from all participants
      const { data: participants } = await supabase
        .from('mcq_war_participants')
        .select('accuracy')
        .eq('session_id', sessionId);
      
      const avgAccuracy = participants && participants.length > 0
        ? participants.reduce((sum, p) => sum + (p.accuracy || 0), 0) / participants.length
        : 0;
      
      const { error } = await supabase
        .from('mcq_war_sessions')
        .update({ 
          status: 'COMPLETED',
          room_accuracy: avgAccuracy,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error ending war session:', e);
      return false;
    }
  },

  // --- Whiteboard ---
  
  createWhiteboard: async (roomId: string, title: string, createdBy: string): Promise<WhiteboardSession | null> => {
    try {
      const { data, error } = await supabase
        .from('whiteboard_sessions')
        .insert([{
          room_id: roomId,
          title,
          canvas_data: {},
          is_active: true,
          created_by: createdBy,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error creating whiteboard:', e);
      return null;
    }
  },

  updateWhiteboardCanvas: async (whiteboardId: string, canvasData: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('whiteboard_sessions')
        .update({ 
          canvas_data: canvasData,
          updated_at: new Date().toISOString()
        })
        .eq('id', whiteboardId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating whiteboard:', e);
      return false;
    }
  }
};

// ==========================================
// GROUP PREMIUM SERVICE
// ==========================================

export const groupPremiumService = {
  createGroupSubscription: async (
    purchaserId: string,
    groupSize: number,
    billingCycle: BillingCycle,
    emails: string[]
  ): Promise<GroupSubscription | null> => {
    try {
      const pricing = calculateGroupPricing(groupSize, billingCycle);
      
      // Create subscription
      const { data: subscription, error: subError } = await supabase
        .from('group_subscriptions')
        .insert([{
          purchaser_id: purchaserId,
          plan_type: 'PRO',
          billing_cycle: billingCycle,
          group_size: groupSize,
          base_price: pricing.basePrice,
          discount_percent: pricing.discountPercent * 100,
          per_person_price: pricing.perPersonPrice,
          total_amount: pricing.totalAmount,
          payment_status: 'PENDING',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (subError) throw subError;
      
      // Create invites for each email
      const invites = emails.map(email => ({
        group_subscription_id: subscription.id,
        email,
        invite_code: generateInviteCode(),
        status: 'PENDING',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }));
      
      const { error: inviteError } = await supabase
        .from('group_invites')
        .insert(invites);
      
      if (inviteError) throw inviteError;
      
      return subscription;
    } catch (e) {
      console.error('Error creating group subscription:', e);
      return null;
    }
  },

  completePayment: async (subscriptionId: string, paymentId: string): Promise<boolean> => {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity
      
      // Update subscription status
      const { data: subscription, error: subError } = await supabase
        .from('group_subscriptions')
        .update({
          payment_status: 'COMPLETED',
          payment_id: paymentId,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();
      
      if (subError) throw subError;
      
      // Create auto study room
      const { data: room } = await supabase
        .from('study_rooms')
        .insert([{
          name: `Group Study Room`,
          room_type: 'GROUP_PREMIUM',
          group_subscription_id: subscriptionId,
          creator_id: subscription.purchaser_id,
          settings: { radioSilence: false, focusTheme: 'default' },
          cluster_streak: 0,
          created_at: now.toISOString()
        }])
        .select()
        .single();
      
      if (room) {
        // Link room to subscription
        await supabase
          .from('group_subscriptions')
          .update({ study_room_id: room.id })
          .eq('id', subscriptionId);
        
        // Add purchaser as admin
        await supabase
          .from('study_room_members')
          .insert([{
            room_id: room.id,
            user_id: subscription.purchaser_id,
            role: 'ADMIN',
            status: 'ACTIVE',
            joined_at: now.toISOString()
          }]);
      }
      
      // TODO: Send invite emails
      
      return true;
    } catch (e) {
      console.error('Error completing payment:', e);
      return false;
    }
  },

  acceptInvite: async (inviteCode: string, userId: string): Promise<boolean> => {
    try {
      // Find invite
      const { data: invite, error: findError } = await supabase
        .from('group_invites')
        .select('*, group_subscription:group_subscriptions(*)')
        .eq('invite_code', inviteCode)
        .eq('status', 'PENDING')
        .single();
      
      if (findError || !invite) {
        console.error('Invite not found or already used');
        return false;
      }
      
      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        await supabase
          .from('group_invites')
          .update({ status: 'EXPIRED' })
          .eq('id', invite.id);
        return false;
      }
      
      // Accept invite
      const { error: acceptError } = await supabase
        .from('group_invites')
        .update({
          status: 'ACCEPTED',
          accepted_by: userId,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invite.id);
      
      if (acceptError) throw acceptError;
      
      // Add to study room
      if (invite.group_subscription?.study_room_id) {
        await supabase
          .from('study_room_members')
          .insert([{
            room_id: invite.group_subscription.study_room_id,
            user_id: userId,
            role: 'MEMBER',
            status: 'ACTIVE',
            joined_at: new Date().toISOString()
          }]);
      }
      
      // Update user subscription status
      await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            subscription: 'Pro',
            isVerified: true
          }
        })
        .eq('id', userId);
      
      return true;
    } catch (e) {
      console.error('Error accepting invite:', e);
      return false;
    }
  },

  getSubscriptionByPurchaser: async (purchaserId: string): Promise<GroupSubscription | null> => {
    try {
      const { data, error } = await supabase
        .from('group_subscriptions')
        .select('*, invites:group_invites(*)')
        .eq('purchaser_id', purchaserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching subscription:', e);
      return null;
    }
  }
};

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==========================================
// FACULTY HIVE SERVICE
// ==========================================

export const facultyHiveService = {
  // --- Mentor Availability ---
  
  getAvailableMentors: async (topic?: string): Promise<MentorAvailability[]> => {
    try {
      let query = supabase
        .from('mentor_availability')
        .select('*, mentor:user_profiles(*)')
        .eq('is_online', true)
        .eq('available_for_flash', true);
      
      if (topic) {
        query = query.contains('topics', [topic]);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching available mentors:', e);
      return [];
    }
  },

  updateAvailability: async (mentorId: string, updates: Partial<MentorAvailability>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mentor_availability')
        .upsert({
          mentor_id: mentorId,
          ...updates,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating availability:', e);
      return false;
    }
  },

  // --- Session Management ---
  
  requestSession: async (session: Partial<MentorSession>): Promise<MentorSession | null> => {
    try {
      const { data, error } = await supabase
        .from('mentor_sessions')
        .insert([{
          ...session,
          status: 'REQUESTED',
          platform_fee_percent: 12.5,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error requesting session:', e);
      return null;
    }
  },

  acceptSession: async (sessionId: string, mentorId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (!session) return false;
      
      const mentorPayout = session.total_fee * (1 - session.platform_fee_percent / 100);
      
      const { error } = await supabase
        .from('mentor_sessions')
        .update({
          mentor_id: mentorId,
          status: 'ACCEPTED',
          mentor_payout: mentorPayout
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error accepting session:', e);
      return false;
    }
  },

  // --- Split Payments ---
  
  initiateSplitPayments: async (sessionId: string, roomId: string): Promise<boolean> => {
    try {
      // Get session and room members
      const { data: session } = await supabase
        .from('mentor_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      const { data: members } = await supabase
        .from('study_room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('status', 'ACTIVE');
      
      if (!session || !members || members.length === 0) return false;
      
      const splitInfo = calculateSplitFee(session.total_fee, members.length, session.platform_fee_percent);
      
      // Create payment records for each member
      const payments = members.map(member => ({
        session_id: sessionId,
        user_id: member.user_id,
        amount: splitInfo.perPersonShare,
        status: 'PENDING'
      }));
      
      const { error } = await supabase
        .from('session_payments')
        .insert(payments);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error initiating split payments:', e);
      return false;
    }
  },

  recordPayment: async (sessionId: string, userId: string, paymentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('session_payments')
        .update({
          status: 'ESCROWED',
          payment_id: paymentId,
          paid_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Check if all payments are complete
      const { data: payments } = await supabase
        .from('session_payments')
        .select('status')
        .eq('session_id', sessionId);
      
      const allPaid = payments?.every(p => p.status === 'ESCROWED' || p.status === 'RELEASED');
      
      if (allPaid) {
        // Update session to IN_PROGRESS
        await supabase
          .from('mentor_sessions')
          .update({ status: 'IN_PROGRESS', started_at: new Date().toISOString() })
          .eq('id', sessionId);
      }
      
      return true;
    } catch (e) {
      console.error('Error recording payment:', e);
      return false;
    }
  },

  completeSession: async (sessionId: string, roomVouch: boolean, rating?: number, feedback?: string): Promise<boolean> => {
    try {
      const { error: sessionError } = await supabase
        .from('mentor_sessions')
        .update({
          status: 'COMPLETED',
          ended_at: new Date().toISOString(),
          room_vouch: roomVouch,
          mentor_rating: rating,
          feedback
        })
        .eq('id', sessionId);
      
      if (sessionError) throw sessionError;
      
      if (roomVouch) {
        // Release escrowed payments
        const { error: paymentError } = await supabase
          .from('session_payments')
          .update({ status: 'RELEASED' })
          .eq('session_id', sessionId)
          .eq('status', 'ESCROWED');
        
        if (paymentError) throw paymentError;
      }
      
      return true;
    } catch (e) {
      console.error('Error completing session:', e);
      return false;
    }
  }
};

// ==========================================
// VOUCH SERVICE
// ==========================================

export const vouchService = {
  vouchPost: async (voucherId: string, postId: string): Promise<Vouch | null> => {
    try {
      const { data, error } = await supabase
        .from('vouches')
        .insert([{
          voucher_id: voucherId,
          post_id: postId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Increment post likes (vouches)
      await supabase.rpc('increment_post_vouches', { post_id: postId });
      
      return data;
    } catch (e) {
      console.error('Error vouching:', e);
      return null;
    }
  },

  removeVouch: async (voucherId: string, postId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vouches')
        .delete()
        .eq('voucher_id', voucherId)
        .eq('post_id', postId);
      
      if (error) throw error;
      
      // Decrement post likes (vouches)
      await supabase.rpc('decrement_post_vouches', { post_id: postId });
      
      return true;
    } catch (e) {
      console.error('Error removing vouch:', e);
      return false;
    }
  },

  hasVouched: async (voucherId: string, postId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('vouches')
        .select('id')
        .eq('voucher_id', voucherId)
        .eq('post_id', postId)
        .single();
      
      return !!data;
    } catch (e) {
      return false;
    }
  },

  getVouchCount: async (postId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('vouches')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      return count || 0;
    } catch (e) {
      return 0;
    }
  }
};

// ==========================================
// BADGE SERVICE
// ==========================================

export const badgeService = {
  getAllBadges: async (): Promise<Badge[]> => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category');
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching badges:', e);
      return [];
    }
  },

  getUserBadges: async (userId: string): Promise<UserBadge[]> => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badge:badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching user badges:', e);
      return [];
    }
  },

  awardBadge: async (userId: string, badgeCode: string, sourceType?: string, sourceId?: string): Promise<UserBadge | null> => {
    try {
      // Get badge by code
      const { data: badge } = await supabase
        .from('badges')
        .select('id')
        .eq('code', badgeCode)
        .single();
      
      if (!badge) return null;
      
      const { data, error } = await supabase
        .from('user_badges')
        .insert([{
          user_id: userId,
          badge_id: badge.id,
          source_type: sourceType,
          source_id: sourceId,
          earned_at: new Date().toISOString()
        }])
        .select('*, badge:badges(*)')
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error awarding badge:', e);
      return null;
    }
  }
};

// ==========================================
// LEADERBOARD SERVICE
// ==========================================

export const leaderboardService = {
  getRoomLeaderboard: async (weekStart?: string): Promise<RoomLeaderboardEntry[]> => {
    try {
      const startDate = weekStart || getWeekStart();
      
      const { data, error } = await supabase
        .from('room_leaderboard')
        .select('*, room:study_rooms(*)')
        .eq('week_start', startDate)
        .order('total_score', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
      return [];
    }
  },

  updateRoomStats: async (roomId: string, stats: Partial<RoomLeaderboardEntry>): Promise<boolean> => {
    try {
      const weekStart = getWeekStart();
      
      const { error } = await supabase
        .from('room_leaderboard')
        .upsert({
          room_id: roomId,
          week_start: weekStart,
          ...stats,
          total_score: (stats.essays_audited || 0) * 10 + 
                       (stats.questions_solved || 0) * 2 + 
                       (stats.streak_days || 0) * 5
        });
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating room stats:', e);
      return false;
    }
  }
};

// Helper function to get week start date
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
