

import { supabase } from './supabaseClient';
import { Post, Comment, StudyRoom, Mentor, PostType, LibraryItem, ManagedStudent, Broadcast, User, Notification } from '../types';
import { getUserProfile } from './fetsService';

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
    return new Promise((resolve) => {
      let customRooms: StudyRoom[] = [];
      try {
        const stored = localStorage.getItem('costudy_custom_rooms');
        if (stored) customRooms = JSON.parse(stored);
      } catch (e) {
        console.error("Error loading custom rooms", e);
      }

      const defaultRooms: StudyRoom[] = [
        {
          id: 'room-1',
          name: 'CMA Part 1 Strategy Cluster',
          category: 'CMA US Part 1',
          members: 1240,
          activeOnline: 42,
          color: 'bg-brand',
          description: 'Focusing on Internal Controls, Performance Management, and Cost Management.',
          sections: ['Chat', 'Live Audio', 'Whiteboard', 'Resources'],
          targetTopics: ['Internal Controls', 'Performance Management', 'Costing & Variance'],
          admin_id: 'admin-rahul',
          admin_name: 'Rahul V. (Cluster Lead)',
          privacy: 'PUBLIC',
          member_list: [
            { id: 'm-1', name: 'Rahul V.', role: 'ADMIN', avatar: 'https://i.pravatar.cc/100?u=rahul' },
            { id: 'm-2', name: 'Sneha P.', role: 'MODERATOR', avatar: 'https://i.pravatar.cc/100?u=sneha' },
            { id: 'm-3', name: 'Dr. Ananya Sharma', role: 'FACULTY', avatar: 'https://i.pravatar.cc/100?u=ananya' },
            { id: 'm-4', name: 'Amit Kumar', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=amit' },
            { id: 'm-5', name: 'Priya Nair', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=priya' }
          ]
        },
        {
          id: 'room-2',
          name: 'Part 2 Decision & Finance Lab',
          category: 'CMA US Part 2',
          members: 890,
          activeOnline: 15,
          color: 'bg-indigo-600',
          description: 'Deep dive into Investment Decisions, Financial Statement Analysis, and Risk Management.',
          sections: ['Chat', 'Live Audio', 'Whiteboard', 'Resources'],
          targetTopics: ['Decision Analysis', 'Investment Decisions', 'Corporate Finance'],
          admin_id: 'admin-prof-vikram',
          admin_name: 'Prof. Vikram Roy (Lead)',
          privacy: 'PUBLIC',
          member_list: [
            { id: 'm-10', name: 'Prof. Vikram Roy', role: 'ADMIN', avatar: 'https://i.pravatar.cc/100?u=m2' },
            { id: 'm-11', name: 'Kavita Sundaram', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=kavita' },
            { id: 'm-12', name: 'John Doe', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=john' }
          ]
        },
        {
          id: 'room-3',
          name: 'Kochi & Kerala Aspirants Hub',
          category: 'Local Chapter',
          members: 430,
          activeOnline: 28,
          color: 'bg-emerald-600',
          description: 'Local study group for candidates in Cochin, Trivandrum, and Calicut. Organizes offline meetups & study spot sessions.',
          sections: ['Chat', 'Live Audio', 'Whiteboard', 'Resources'],
          targetTopics: ['Local Study Spots', 'Group Speed Tests', 'Exam Prep'],
          admin_id: 'admin-midhun',
          admin_name: 'Midhun N. (Regional Lead)',
          privacy: 'PUBLIC',
          member_list: [
            { id: 'm-20', name: 'Midhun N.', role: 'ADMIN', avatar: 'https://i.pravatar.cc/100?u=midhun' },
            { id: 'm-21', name: 'Reshma B.', role: 'MODERATOR', avatar: 'https://i.pravatar.cc/100?u=reshma' },
            { id: 'm-22', name: 'Faisal Khan', role: 'SCHOLAR', avatar: 'https://i.pravatar.cc/100?u=faisal' }
          ]
        }
      ];

      setTimeout(() => resolve([...customRooms, ...defaultRooms]), 300);
    });
  },

  createRoom: async (newRoom: Partial<StudyRoom>): Promise<StudyRoom> => {
    const room: StudyRoom = {
      id: `room-custom-${Date.now()}`,
      name: newRoom.name || 'New Study Cluster',
      category: newRoom.category || 'General Study',
      members: 1,
      activeOnline: 1,
      color: newRoom.color || 'bg-brand',
      description: newRoom.description || 'Custom collaborative study cluster.',
      sections: ['Chat', 'Live Audio', 'Whiteboard', 'Resources', 'Schedule', 'Faculty Hive', 'Study Spots', 'Settings'],
      targetTopics: newRoom.targetTopics || ['Exam Prep'],
      admin_id: newRoom.admin_id || 'user-admin',
      admin_name: newRoom.admin_name || 'Cluster Creator',
      privacy: newRoom.privacy || 'PUBLIC',
      member_list: newRoom.member_list || [
        { id: newRoom.admin_id || 'user-admin', name: newRoom.admin_name || 'You (Admin)', role: 'ADMIN', avatar: 'https://i.pravatar.cc/100?u=me' }
      ]
    };

    try {
      const stored = localStorage.getItem('costudy_custom_rooms');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(room);
      localStorage.setItem('costudy_custom_rooms', JSON.stringify(list));
    } catch (e) {
      console.error("Save custom room error", e);
    }

    return room;
  },

  getMentors: async (): Promise<Mentor[]> => {
    return new Promise((resolve) => {
      const mentors: Mentor[] = [
        {
          id: 'mentor-1',
          name: 'Prof. Rajesh Varma, CMA, CPA',
          img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          status: 'online',
          lastActive: 'Active now',
          responseTime: '< 5 mins',
          activeSessions: 2,
          rating: 4.9,
          reviewCount: 84,
          hourlyRate: 1800,
          specialties: ['Variance Analysis', 'Cost Management', 'Financial Reporting', 'Part 1'],
          learningStyle: 'Visual & Practical Drills',
          timezone: 'IST (UTC+5:30)',
          bio: '12+ years preparing candidates for CMA US. Specializes in Section B variance breakdown and standard costing calculations.',
          offerings: [
            { type: 'Doubt Resolution', price: 299 },
            { type: '1-on-1 Strategy Call', price: 1800 },
            { type: 'Essay Audit', price: 499 }
          ]
        },
        {
          id: 'mentor-2',
          name: 'Dr. Ananya Iyer, CMA, CFA',
          img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          status: 'in_session',
          lastActive: 'In Live Cluster #3',
          responseTime: 'Available at 6:30 PM',
          activeSessions: 1,
          rating: 4.95,
          reviewCount: 112,
          hourlyRate: 2200,
          specialties: ['Corporate Finance', 'Decision Analysis', 'WACC & Valuation', 'Part 2'],
          learningStyle: 'Conceptual & Socratic',
          timezone: 'IST (UTC+5:30)',
          bio: 'Former Senior Controller & IMA Faculty. Known for demystifying Part 2 capital structure and investment decisions.',
          offerings: [
            { type: 'Doubt Resolution', price: 349 },
            { type: '1-on-1 Strategy Call', price: 2200 },
            { type: 'Mock Exam Review', price: 799 }
          ]
        },
        {
          id: 'mentor-3',
          name: 'CA Sarthak Patel, CMA',
          img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          status: 'online',
          lastActive: 'Active now',
          responseTime: '< 10 mins',
          activeSessions: 0,
          rating: 4.85,
          reviewCount: 67,
          hourlyRate: 1500,
          specialties: ['Internal Controls', 'COSO Framework', 'Risk Management', 'Part 1 Sec E'],
          learningStyle: 'Real-world Case Studies',
          timezone: 'IST (UTC+5:30)',
          bio: 'Risk consultant & CMA instructor. Focuses on Section E internal controls, audit procedures, and IT governance.',
          offerings: [
            { type: 'Doubt Resolution', price: 249 },
            { type: '1-on-1 Strategy Call', price: 1500 },
            { type: 'Quick MCQ Sprint', price: 399 }
          ]
        },
        {
          id: 'mentor-4',
          name: 'Meera Nair, CMA, CIA',
          img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          status: 'offline',
          lastActive: 'Active 35m ago',
          responseTime: 'Within 2 hours',
          activeSessions: 0,
          rating: 4.9,
          reviewCount: 95,
          hourlyRate: 1900,
          specialties: ['Professional Ethics', 'IMA Statement', 'Performance Management', 'Essay Writing'],
          learningStyle: 'Structured Step-by-Step',
          timezone: 'IST (UTC+5:30)',
          bio: 'Specialist in Part 1 Section F ethical conflict escalation protocols and high-scoring CMA essay formatting.',
          offerings: [
            { type: 'Essay Audit', price: 450 },
            { type: '1-on-1 Strategy Call', price: 1900 },
            { type: 'Doubt Resolution', price: 299 }
          ]
        }
      ];
      setTimeout(() => resolve(mentors), 300);
    });
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
  
  likePost: async (postId: string) => {
    try {
      const { data: current } = await supabase.from('posts').select('likes').eq('id', postId).single();
      const newLikes = (current?.likes || 0) + 1;
      const { error } = await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
      if (error) console.warn('Supabase post like error:', error);
      return newLikes;
    } catch (e) {
      console.warn('Post like fallback:', e);
      return null;
    }
  },

  createBroadcast: async (teacherId: string, title: string, content: string, type: string): Promise<Broadcast> => {
    try {
      const { data, error } = await supabase
        .from('teacher_broadcasts')
        .insert([{ teacher_id: teacherId, title, content, type }])
        .select()
        .single();
      if (error) throw error;
      return data as Broadcast;
    } catch (e) {
      console.warn('Broadcast fallback:', e);
      return {
        id: `bc-${Date.now()}`,
        teacher_id: teacherId,
        title,
        content,
        type: type as any,
        created_at: new Date().toISOString()
      };
    }
  },

  // --- Mentor Bounties ---
  getBounties: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('mentor_bounties')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data;
    } catch (e) {
      return [];
    }
  },

  createBounty: async (teacherId: string, task: string, reward: number, type: string) => {
    try {
      const { data, error } = await supabase
        .from('mentor_bounties')
        .insert([{ teacher_id: teacherId, task, reward, type, status: 'OPEN' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Bounty creation fallback:', e);
      return {
        id: `b-${Date.now()}`,
        task,
        reward,
        type,
        status: 'OPEN',
        created_at: new Date().toISOString()
      };
    }
  },

  // --- Student Mastery Path Progress ---
  getUserProgress: async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('completed_modules')
        .eq('user_id', userId)
        .single();
      if (!error && data && Array.isArray(data.completed_modules)) {
        return data.completed_modules;
      }
    } catch (e) {
      console.warn('Failed to fetch user progress from DB:', e);
    }
    return [];
  },

  saveUserProgress: async (userId: string, completedModules: string[]) => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert([{ user_id: userId, completed_modules: completedModules, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
      if (error) console.warn('Supabase saveUserProgress error:', error);
    } catch (e) {
      console.warn('User progress save fallback:', e);
    }
  },

  // --- Launch Momentum Referral System ---
  getReferralStats: async (userId: string) => {
    try {
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);
      
      const referralsList = data || [];
      return {
        referralCount: referralsList.length,
        referrals: referralsList,
        creditsEarned: referralsList.length * 250
      };
    } catch (e) {
      // Fallback local storage state
      const localKey = `cs_referrals_${userId || 'anon'}`;
      let localList: any[] = [];
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) localList = JSON.parse(raw);
      } catch (err) {
        localList = [];
      }
      return {
        referralCount: localList.length,
        referrals: localList,
        creditsEarned: localList.length * 250
      };
    }
  },

  sendReferralInvite: async (userId: string, inviteeNameOrEmail: string) => {
    const localKey = `cs_referrals_${userId || 'anon'}`;
    const newRef = {
      id: `ref-${Date.now()}`,
      referrer_id: userId,
      invitee: inviteeNameOrEmail,
      status: 'JOINED',
      created_at: new Date().toISOString(),
      credits_rewarded: 250
    };

    try {
      const { data, error } = await supabase
        .from('referrals')
        .insert([newRef])
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase referral fallback:', e);
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(localKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newRef);
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (err) {
      console.warn('LocalStorage referral save failed:', err);
    }
    return newRef;
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