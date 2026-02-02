

import { supabase } from './supabaseClient';
import { Post, Comment, StudyRoom, Mentor, PostType, LibraryItem, ManagedStudent, Broadcast, User, Notification } from '../types';
import { getUserProfile } from './fetsService';

// Helper: Default rooms fallback
const getDefaultRooms = (): StudyRoom[] => [
  {
    id: 'room-1',
    name: 'CMA Part 1 Strategy',
    category: 'CMA US Part 1',
    members: 1240,
    activeOnline: 42,
    color: 'bg-brand',
    description: 'Focusing on Internal Controls and Performance Management.',
    sections: ['Chat', 'Live Audio', 'Whiteboard', 'Resources'],
    targetTopics: ['Internal Controls', 'Performance Management']
  },
  {
    id: 'room-2',
    name: 'Part 2 Calculation Lab',
    category: 'CMA US Part 2',
    members: 890,
    activeOnline: 15,
    color: 'bg-blue-600',
    description: 'Deep dive into Investment Decisions and Decision Analysis.',
    sections: ['Chat', 'Formula Share', 'Live Solving'],
    targetTopics: ['Decision Analysis', 'Investment Decisions']
  },
  {
    id: 'room-3',
    name: 'Ethics & Professional Standards',
    category: 'Ethics',
    members: 650,
    activeOnline: 8,
    color: 'bg-emerald-600',
    description: 'IMA Ethics guidelines and professional conduct discussions.',
    sections: ['Chat', 'Case Studies'],
    targetTopics: ['IMA Ethics', 'Professional Conduct']
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

  createPost: async (authorId: string, content: string, type: PostType = PostType.QUESTION, tags: string[] = []) => {
    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          author_id: authorId, 
          content, 
          type,
          tags,
          likes: 0,
          created_at: new Date().toISOString()
        }
      ])
      .select('*, author:user_profiles(*)');
    if (error) throw error;
    return data[0];
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
        .select('*')
        .order('members_count', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        // Return default rooms if DB is empty or error
        return getDefaultRooms();
      }

      if (!data || data.length === 0) {
        return getDefaultRooms();
      }

      return data.map((room: any): StudyRoom => ({
        id: room.id,
        name: room.name,
        category: room.category || 'General',
        members: room.members_count || 0,
        activeOnline: room.active_count || Math.floor(Math.random() * 20) + 5,
        color: room.color_theme || 'bg-brand',
        description: room.description || '',
        sections: ['Chat', 'Resources', 'Live Audio'],
        targetTopics: room.target_topics || []
      }));
    } catch (e) {
      console.error('getRooms error:', e);
      return getDefaultRooms();
    }
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