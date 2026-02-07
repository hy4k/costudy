import { supabase } from './supabaseClient';
import {
  ActiveAlignment,
  AlignmentRequest,
  AlignmentPurpose,
  AlignmentDuration,
  TrackingRecord,
  ObserverRecord
} from '../types';

// ==========================================
// CMA ALIGNMENT NETWORK (CAN) SERVICE
// ==========================================

export const alignmentService = {
  // --- Active Alignments ---
  
  getMyAlignments: async (userId: string): Promise<ActiveAlignment[]> => {
    try {
      const { data, error } = await supabase
        .from('alignments')
        .select(`
          *,
          peer:peer_id(id, name, avatar, handle)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(a => ({
        id: a.id,
        peerId: a.peer_id,
        peerName: a.peer?.name || 'Unknown',
        peerAvatar: a.peer?.avatar || `https://i.pravatar.cc/150?u=${a.peer_id}`,
        purpose: a.purpose as AlignmentPurpose,
        streak: a.streak || 0,
        startDate: a.start_date,
        duration: a.duration as AlignmentDuration,
        status: a.status,
        goal: a.goal,
        restrictions: a.restrictions,
        pausedUntil: a.paused_until
      }));
    } catch (e) {
      console.error('Error fetching alignments:', e);
      return [];
    }
  },

  createAlignment: async (
    userId: string,
    peerId: string,
    purpose: AlignmentPurpose,
    duration: AlignmentDuration,
    goal?: string
  ): Promise<ActiveAlignment | null> => {
    try {
      const { data, error } = await supabase
        .from('alignments')
        .insert([{
          user_id: userId,
          peer_id: peerId,
          purpose,
          duration,
          goal,
          status: 'ACTIVE',
          streak: 0,
          start_date: new Date().toISOString()
        }])
        .select(`*, peer:peer_id(id, name, avatar)`)
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        peerId: data.peer_id,
        peerName: data.peer?.name || 'Unknown',
        peerAvatar: data.peer?.avatar,
        purpose: data.purpose,
        streak: 0,
        startDate: data.start_date,
        duration: data.duration,
        status: 'ACTIVE',
        goal: data.goal
      };
    } catch (e) {
      console.error('Error creating alignment:', e);
      return null;
    }
  },

  updateAlignmentStatus: async (
    alignmentId: string,
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
    pausedUntil?: string
  ): Promise<boolean> => {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (pausedUntil) updates.paused_until = pausedUntil;
      
      const { error } = await supabase
        .from('alignments')
        .update(updates)
        .eq('id', alignmentId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating alignment:', e);
      return false;
    }
  },

  updateRestrictions: async (alignmentId: string, restrictions: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alignments')
        .update({ restrictions, updated_at: new Date().toISOString() })
        .eq('id', alignmentId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error updating restrictions:', e);
      return false;
    }
  },

  incrementStreak: async (alignmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('increment_alignment_streak', { alignment_id: alignmentId });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error incrementing streak:', e);
      return false;
    }
  },

  renewAlignment: async (alignmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alignments')
        .update({
          status: 'ACTIVE',
          streak: 0,
          start_date: new Date().toISOString(),
          paused_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', alignmentId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error renewing alignment:', e);
      return false;
    }
  },

  // --- Alignment Requests ---
  
  getPendingRequests: async (userId: string): Promise<AlignmentRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('alignment_requests')
        .select(`
          *,
          sender:sender_id(id, name, avatar, handle)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(r => ({
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender?.name || 'Unknown',
        senderAvatar: r.sender?.avatar || `https://i.pravatar.cc/150?u=${r.sender_id}`,
        purpose: r.purpose as AlignmentPurpose,
        duration: r.duration as AlignmentDuration,
        note: r.note,
        timestamp: r.created_at,
        status: r.status
      }));
    } catch (e) {
      console.error('Error fetching requests:', e);
      return [];
    }
  },

  sendRequest: async (
    senderId: string,
    receiverId: string,
    purpose: AlignmentPurpose,
    duration: AlignmentDuration,
    note?: string
  ): Promise<AlignmentRequest | null> => {
    try {
      const { data, error } = await supabase
        .from('alignment_requests')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          purpose,
          duration,
          note,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        senderId: data.sender_id,
        senderName: 'You',
        senderAvatar: '',
        purpose: data.purpose,
        duration: data.duration,
        note: data.note,
        timestamp: data.created_at,
        status: 'PENDING'
      };
    } catch (e) {
      console.error('Error sending request:', e);
      return null;
    }
  },

  acceptRequest: async (requestId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('accept_alignment_request', { request_id: requestId });
      if (error) throw error;
      return data; // Returns new alignment ID
    } catch (e) {
      console.error('Error accepting request:', e);
      return null;
    }
  },

  declineRequest: async (requestId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('alignment_requests')
        .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error declining request:', e);
      return false;
    }
  },

  // --- Academic Radar (Tracking) ---
  
  getTracking: async (userId: string): Promise<TrackingRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('tracking_records')
        .select(`
          *,
          target:target_id(id, name, avatar, handle, reputation)
        `)
        .eq('tracker_id', userId)
        .eq('is_active', true)
        .order('tracked_since', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        id: t.id,
        targetId: t.target_id,
        targetName: t.target?.name || 'Unknown',
        targetAvatar: t.target?.avatar || `https://i.pravatar.cc/150?u=${t.target_id}`,
        stats: {
          consistencyStreak: t.target?.reputation?.consistencyScore?.streak || 0,
          lastMockScore: 0, // Would need to join with performance data
          essaysSubmitted: 0,
          doubtsSolved: 0
        },
        trackedSince: t.tracked_since
      }));
    } catch (e) {
      console.error('Error fetching tracking:', e);
      return [];
    }
  },

  getObservers: async (userId: string): Promise<ObserverRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('tracking_records')
        .select(`
          *,
          tracker:tracker_id(id, name, avatar, handle)
        `)
        .eq('target_id', userId)
        .eq('is_active', true)
        .order('tracked_since', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(o => ({
        id: o.id,
        observerId: o.tracker_id,
        observerName: o.tracker?.name || 'Unknown',
        observerAvatar: o.tracker?.avatar || `https://i.pravatar.cc/150?u=${o.tracker_id}`,
        observedSince: o.tracked_since
      }));
    } catch (e) {
      console.error('Error fetching observers:', e);
      return [];
    }
  },

  startTracking: async (trackerId: string, targetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tracking_records')
        .insert([{
          tracker_id: trackerId,
          target_id: targetId,
          tracked_since: new Date().toISOString(),
          is_active: true
        }]);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error starting tracking:', e);
      return false;
    }
  },

  stopTracking: async (trackerId: string, targetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tracking_records')
        .update({ is_active: false })
        .eq('tracker_id', trackerId)
        .eq('target_id', targetId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error stopping tracking:', e);
      return false;
    }
  }
};

export default alignmentService;
