

import { supabase } from './supabaseClient';
import { Post, Comment, StudyRoom, Mentor, PostType, LibraryItem, ManagedStudent, Broadcast, User, Notification, StudySession } from '../types';
import { getUserProfile } from './fetsService';

const getDefaultRooms = (): StudyRoom[] => [
  {
    id: 'room-1',
    name: 'CMA Part 1 Strategy',
    topic: 'CMA US Part 1',
    room_type: 'OPEN',
    max_members: 10,
    pomodoro_duration: 25,
    is_active: true,
    pomodoro_status: 'READY',
    created_at: new Date().toISOString()
  },
  {
    id: 'room-2',
    name: 'Part 2 Calculation Lab',
    topic: 'CMA US Part 2',
    room_type: 'MENTOR_LED',
    max_members: 20,
    pomodoro_duration: 45,
    is_active: true,
    pomodoro_status: 'FOCUS',
    pomodoro_end_time: new Date(Date.now() + 15 * 60000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'room-3',
    name: 'Ethics & Professional Standards',
    topic: 'Ethics',
    room_type: 'PRIVATE',
    max_members: 5,
    pomodoro_duration: 60,
    is_active: false,
    pomodoro_status: 'READY',
    created_at: new Date().toISOString()
  }
];

export const costudyService = {
  getPosts: async (category?: string) => {
    try {
      let query = supabase
        .from('posts')
        .select('*, author:user_profiles(*)')
        .order('created_at', { ascending: false });

      if (category && category !== 'All Feed') {
        const categoryMap: Record<string, string> = {
          'Expert Notes': PostType.RESOURCE,
          'Top Q&A': PostType.QUESTION,
          'Resources': PostType.RESOURCE,
          'Discussions': PostType.QUESTION
        };
        const dbType = categoryMap[category];
        if (dbType) query = query.eq('type', dbType);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return [];
      return data;
    } catch (e) {
      return [];
    }
  },

  subscribeToPosts: (callback: (payload: any) => void) => {
    return supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, callback)
      .subscribe();
  },

  createPost: async (authorId: string, content: string, type: PostType = PostType.QUESTION, tags: string[] = [], payload: any = {}) => {
    const postObj: any = {
      author_id: authorId,
      content,
      type,
      tags,
      vouches: 0,
      created_at: new Date().toISOString()
    };

    if (type === PostType.PEER_AUDIT_REQUEST) {
      postObj.audit_status = 'OPEN';
      postObj.subject = payload.subject;
    } else if (type === PostType.MCQ) {
      postObj.mcq_data = payload.mcq_data; // Stored in content JSON or separate column based on schema
      // Will store JSON in content to avoid schema change for now
      postObj.content = JSON.stringify({ question: content, mcq_data: payload.mcq_data });
    } else if (type === PostType.RESOURCE) {
      postObj.resource_data = payload.resource_data;
      postObj.content = JSON.stringify({ title: payload.title, description: content, url: payload.resource_data.url });
    } else if (type === PostType.BOUNTY) {
      postObj.bounty_details = payload.bounty_details;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([postObj])
      .select('*, author:user_profiles(*)');
    if (error) throw error;
    return data[0];
  },

  submitVouch: async (userId: string, postId: string, vouchType: string = 'COMPLIANT') => {
    // Check if already vouched
    const { data: existing } = await supabase
      .from('vouch_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (existing && existing.length > 0) throw new Error('Already vouched on this post.');

    // Insert Vouch Log
    const { error: logError } = await supabase
      .from('vouch_logs')
      .insert([{ user_id: userId, post_id: postId, vouch_type: vouchType }]);

    if (logError) throw logError;

    // Update Post count via RPC or directly (simplified for direct update here, ideally an RPC increments safely)
    // Since we can't easily do concurrent safe increments without RPC, we read then write
    const { data: post } = await supabase.from('posts').select('vouches').eq('id', postId).single();
    if (post) {
      await supabase.from('posts').update({ vouches: (post.vouches || 0) + 1 }).eq('id', postId);
    }
    return true;
  },

  getPostDiscussion: async (postId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:user_profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data as Comment[];
    } catch (e) {
      return [];
    }
  },

  createComment: async (postId: string, authorId: string, content: string, parentId?: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          author_id: authorId,
          content,
          parent_id: parentId
        }
      ])
      .select();
    if (error) throw error;
    return data;
  },

  getRooms: async (): Promise<StudyRoom[]> => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`*, members:room_members(count)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }

      return data.map((room: any): StudyRoom => ({
        ...room,
        max_members: room.max_members || 10,
        room_type: room.room_type || 'OPEN',
        pomodoro_status: room.pomodoro_status || 'READY',
        pomodoro_duration: room.pomodoro_duration || 25,
        members_count: room.members?.[0]?.count || 0
      }));
    } catch (e) {
      console.error('getRooms error:', e);
      return [];
    }
  },

  createRoom: async (roomData: Partial<StudyRoom>) => {
    const { data, error } = await supabase
      .from('study_rooms')
      .insert([roomData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getRoomById: async (roomId: string) => {
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    if (error) throw error;
    return data;
  },

  joinRoom: async (roomId: string, userId: string) => {
    const { data, error } = await supabase
      .from('room_members')
      .upsert([{ room_id: roomId, user_id: userId, is_active: true }])
      .select();
    if (error) throw error;
    return data;
  },

  getRoomMembers: async (roomId: string) => {
    const { data, error } = await supabase
      .from('room_members')
      .select('*, profile:user_profiles(*)')
      .eq('room_id', roomId)
      .eq('is_active', true);
    if (error) return [];
    return data;
  },

  getRoomMissions: async (roomId: string) => {
    const { data, error } = await supabase
      .from('room_missions')
      .select('*, profile:user_profiles(name)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data;
  },

  createRoomMission: async (roomId: string, text: string) => {
    const { data, error } = await supabase
      .from('room_missions')
      .insert([{ room_id: roomId, task_text: text }])
      .select('*, profile:user_profiles(name)')
      .single();
    if (error) throw error;
    return data;
  },

  toggleRoomMission: async (missionId: string, isCompleted: boolean, userId: string) => {
    const { data, error } = await supabase
      .from('room_missions')
      .update({ is_completed: isCompleted, completed_by: isCompleted ? userId : null })
      .eq('id', missionId)
      .select('*, profile:user_profiles(name)')
      .single();
    if (error) throw error;
    return data;
  },

  updateRoomTimerStatus: async (roomId: string, status: string, endTime: string | null) => {
    const { data, error } = await supabase
      .from('study_rooms')
      .update({ pomodoro_status: status, pomodoro_end_time: endTime })
      .eq('id', roomId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToRoom: (roomId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_missions', filter: `room_id=eq.${roomId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` }, callback)
      .subscribe();
  },

  getMentors: async (): Promise<Mentor[]> => {
    try {
      // Fetch users with role = 'TEACHER' from user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'TEACHER')
        .not('name', 'is', null);

      if (error) {
        console.error('Error fetching mentors:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform user_profiles to Mentor format
      return data.map((profile: any): Mentor => ({
        id: profile.id,
        name: profile.name || 'Mentor',
        specialties: profile.specialties || ['CMA US'],
        isVerified: profile.costudy_status?.isVerified || false,
        img: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
        reputation: {
          studentImprovement: profile.reputation?.studyScore?.total || 0,
          avgScoreJump: Math.floor(Math.random() * 15) + 5, // Would come from analytics
          consistency: profile.reputation?.consistencyScore?.streak || 0,
          helpfulness: profile.reputation?.helpfulnessScore?.total || 0,
          responseTime: '< 2 hours'
        },
        trackRecord: {
          studentsTaught: profile.reputation?.helpfulnessScore?.groupsLed || 0,
          reviewCount: profile.reputation?.vouchesReceived || 0,
          passRate: 85 + Math.floor(Math.random() * 15), // Would come from analytics
          avgImprovement: 12 + Math.floor(Math.random() * 8)
        },
        offerings: [
          { type: 'session', label: '1-on-1 Session', price: profile.hourly_rate || 500, currency: 'INR', unit: 'hour' },
          { type: 'review', label: 'Essay Review', price: Math.floor((profile.hourly_rate || 500) * 0.6), currency: 'INR' }
        ],
        learningStyle: [profile.learning_style || 'Discussion'],
        timezone: 'IST',
        communicationPreference: ['Chat', 'Video Call']
      }));
    } catch (e) {
      console.error('getMentors error:', e);
      return [];
    }
  },

  getLibraryItems: async (): Promise<LibraryItem[]> => {
    return [
      {
        id: 'lib-1',
        title: 'CMA Part 1: Strategic Financial Management Official Guide',
        type: 'PDF',
        size: '15.4 MB',
        category: 'Financial Accounting',
        tags: ['Part 1', 'IMA', 'Official'],
        isIndexed: true,
        pageCount: 450
      }
    ];
  },

  ingestToVault: async (itemId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 2000);
    });
  },

  // --- Resource Mutation Methods ---
  updateResource: async (resourceId: string, updates: { title?: string, summary?: string, category?: string }) => {
    const { data, error } = await supabase
      .from('study_room_resources')
      .update(updates)
      .eq('id', resourceId)
      .select();
    if (error) throw error;
    return data;
  },

  deleteResource: async (resourceId: string) => {
    const { error } = await supabase
      .from('study_room_resources')
      .delete()
      .eq('id', resourceId);
    if (error) throw error;
    return true;
  },

  // --- Teacher Dashboard Methods ---
  getManagedStudents: async (teacherId: string): Promise<ManagedStudent[]> => {
    try {
      const { data } = await supabase
        .from('student_enrollments')
        .select('*, student:student_id(*)')
        .eq('teacher_id', teacherId);

      if (data && data.length > 0) {
        return data.map((e: any) => {
          const performance = e.student.performance || [];
          const avgScore = performance.length > 0
            ? Math.round(performance.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / performance.length)
            : 0;

          return {
            id: e.student.id,
            name: e.student.name,
            handle: e.student.handle || 'aspirant',
            avatar: e.student.avatar || 'https://i.pravatar.cc/150',
            focus: e.student.exam_focus || 'General',
            lastActivity: '1d ago',
            performanceScore: avgScore || 70, // Default to 70 for visual balance if empty
            status: e.status === 'ACTIVE' ? 'Active' : 'Struggling'
          };
        });
      }

      // Fallback mock data if DB is empty for demo purposes
      return [
        { id: 's1', name: 'Rahul V.', handle: 'rahul_cma', avatar: 'https://i.pravatar.cc/150?u=s1', focus: 'Part 1', lastActivity: '10m ago', performanceScore: 82, status: 'Active' },
        { id: 's2', name: 'Sneha P.', handle: 'sneha_study', avatar: 'https://i.pravatar.cc/150?u=s2', focus: 'Part 2', lastActivity: '1d ago', performanceScore: 65, status: 'Struggling' },
        { id: 's3', name: 'Amit Kumar', handle: 'amit_k', avatar: 'https://i.pravatar.cc/150?u=s3', focus: 'Ethics', lastActivity: '4h ago', performanceScore: 90, status: 'Active' }
      ];
    } catch (e) {
      return [];
    }
  },

  // New method to drill down into a specific student for the Mentor
  getStudentDeepDive: async (studentId: string): Promise<User | null> => {
    return await getUserProfile(studentId);
  },

  getBroadcasts: async (teacherId: string): Promise<Broadcast[]> => {
    try {
      const { data } = await supabase
        .from('teacher_broadcasts')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      return (data as Broadcast[]) || [];
    } catch (e) {
      return [];
    }
  },

  createBroadcast: async (teacherId: string, title: string, content: string, type: string) => {
    const { data, error } = await supabase
      .from('teacher_broadcasts')
      .insert([{ teacher_id: teacherId, title, content, type }])
      .select()
      .single();

    if (error) throw error;
    return data as Broadcast;
  },

  // --- Study Session Methods ---
  getSessions: async (roomId: string): Promise<StudySession[]> => {
    try {
      const { data, error } = await supabase
        .from('study_room_sessions')
        .select('*, author:user_profiles(*)')
        .eq('room_id', roomId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }
      return data as StudySession[];
    } catch (e) {
      return [];
    }
  },

  createSession: async (session: Omit<StudySession, 'id' | 'created_at' | 'author'>) => {
    const { data, error } = await supabase
      .from('study_room_sessions')
      .insert([session])
      .select('*, author:user_profiles(*)')
      .single();

    if (error) throw error;
    return data as StudySession;
  }
};

export const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as Notification[]) || [];
    } catch (e) {
      console.error('Error fetching notifications:', e);
      return [];
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  }
};