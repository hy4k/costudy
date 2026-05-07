/**
 * CoStudy Admin Panel Service
 * Handles admin-only operations for content moderation, user management, and analytics
 */

import { supabase } from './supabaseClient';
import { User, Post } from '../types';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  proSubscribers: number;
  totalRevenue: number;
  postsToday: number;
  reportsToday: number;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reporter?: Partial<User>;
  content_type: 'POST' | 'COMMENT' | 'MESSAGE';
  content_id: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface UserManagementAction {
  action: 'WARN' | 'SUSPEND' | 'BAN' | 'VERIFY' | 'UNBAN';
  userId: string;
  reason: string;
  duration?: number; // Days for suspension
}

/**
 * Check if user is admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, costudy_status')
      .eq('id', userId)
      .single();

    // Check if user has admin flag in costudy_status or is system role
    return data?.costudy_status?.isAdmin === true || data?.role === 'ADMIN';
  } catch (error) {
    return false;
  }
};

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStats> {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Active users (logged in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString());

      // Pro subscribers
      const { data: subscribers } = await supabase
        .from('user_profiles')
        .select('costudy_status')
        .or('costudy_status->>subscription.eq.Pro,costudy_status->>subscription.eq.Elite');

      const proSubscribers = subscribers?.length || 0;

      // Total revenue (from wallet_transactions)
      const { data: transactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .in('type', ['SUBSCRIPTION', 'CREDIT_PURCHASE']);

      const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Posts today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: postsToday } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Reports today
      const { count: reportsToday } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .eq('status', 'PENDING');

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        proSubscribers,
        totalRevenue,
        postsToday: postsToday || 0,
        reportsToday: reportsToday || 0
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        proSubscribers: 0,
        totalRevenue: 0,
        postsToday: 0,
        reportsToday: 0
      };
    }
  },

  /**
   * Get all users with filters
   */
  async getUsers(filters?: {
    search?: string;
    role?: string;
    subscription?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,handle.ilike.%${filters.search}%`);
      }

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.subscription) {
        query = query.eq('costudy_status->>subscription', filters.subscription);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { users: data || [], total: count || 0 };
    } catch (error) {
      console.error('Get users error:', error);
      return { users: [], total: 0 };
    }
  },

  /**
   * Get content reports
   */
  async getContentReports(status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED') {
    try {
      let query = supabase
        .from('content_reports')
        .select('*, reporter:user_profiles!reporter_id(*)')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ContentReport[];
    } catch (error) {
      console.error('Get reports error:', error);
      return [];
    }
  },

  /**
   * Review content report
   */
  async reviewContentReport(
    reportId: string,
    action: 'APPROVE' | 'DISMISS',
    adminId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const status = action === 'APPROVE' ? 'RESOLVED' : 'DISMISSED';

      const { error } = await supabase
        .from('content_reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          admin_notes: notes
        })
        .eq('id', reportId);

      if (error) throw error;

      // If approved, take action on the content
      if (action === 'APPROVE') {
        const { data: report } = await supabase
          .from('content_reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (report) {
          await adminService.moderateContent(report.content_type, report.content_id, 'HIDE');
        }
      }

      return true;
    } catch (error) {
      console.error('Review report error:', error);
      return false;
    }
  },

  /**
   * Moderate content (hide/delete)
   */
  async moderateContent(
    contentType: 'POST' | 'COMMENT' | 'MESSAGE',
    contentId: string,
    action: 'HIDE' | 'DELETE'
  ): Promise<boolean> {
    try {
      const tableName = contentType === 'POST' ? 'posts' : 
                        contentType === 'COMMENT' ? 'comments' : 'chat_messages';

      if (action === 'HIDE') {
        const { error } = await supabase
          .from(tableName)
          .update({ is_hidden: true, moderated_at: new Date().toISOString() })
          .eq('id', contentId);

        if (error) throw error;
      } else if (action === 'DELETE') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', contentId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Moderate content error:', error);
      return false;
    }
  },

  /**
   * User management actions
   */
  async performUserAction(action: UserManagementAction, adminId: string): Promise<boolean> {
    try {
      const { action: actionType, userId, reason, duration } = action;

      // Record action in admin_actions table
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          action_type: actionType,
          target_user_id: userId,
          reason,
          duration_days: duration,
          created_at: new Date().toISOString()
        });

      // Perform the action
      switch (actionType) {
        case 'WARN':
          // Send warning notification
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'ALERT',
              content: `⚠️ Warning: ${reason}`,
              is_read: false,
              created_at: new Date().toISOString()
            });
          break;

        case 'SUSPEND':
          // Suspend account
          const suspendUntil = new Date();
          suspendUntil.setDate(suspendUntil.getDate() + (duration || 7));

          await supabase
            .from('user_profiles')
            .update({
              costudy_status: {
                isSuspended: true,
                suspendedUntil: suspendUntil.toISOString(),
                suspensionReason: reason
              }
            })
            .eq('id', userId);
          break;

        case 'BAN':
          // Permanent ban
          await supabase
            .from('user_profiles')
            .update({
              costudy_status: {
                isBanned: true,
                banReason: reason,
                bannedAt: new Date().toISOString()
              }
            })
            .eq('id', userId);
          break;

        case 'VERIFY':
          // Verify user
          await supabase
            .from('user_profiles')
            .update({
              costudy_status: {
                isVerified: true,
                verifiedAt: new Date().toISOString()
              }
            })
            .eq('id', userId);
          break;

        case 'UNBAN':
          // Remove ban/suspension
          await supabase
            .from('user_profiles')
            .update({
              costudy_status: {
                isBanned: false,
                isSuspended: false
              }
            })
            .eq('id', userId);
          break;
      }

      return true;
    } catch (error) {
      console.error('User action error:', error);
      return false;
    }
  },

  /**
   * Get analytics data
   */
  async getAnalytics(period: 'day' | 'week' | 'month' | 'year') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // User growth
      const { data: newUsers } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Revenue
      const { data: revenue } = await supabase
        .from('wallet_transactions')
        .select('amount, created_at')
        .in('type', ['SUBSCRIPTION', 'CREDIT_PURCHASE'])
        .gte('created_at', startDate.toISOString());

      // Posts
      const { data: posts } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      return {
        userGrowth: newUsers?.length || 0,
        totalRevenue: revenue?.reduce((sum, r) => sum + r.amount, 0) || 0,
        postsCreated: posts?.length || 0,
        period
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  },

  /**
   * Export data (users, posts, transactions)
   */
  async exportData(dataType: 'users' | 'posts' | 'transactions', format: 'csv' | 'json') {
    try {
      let data: any[] = [];
      
      switch (dataType) {
        case 'users':
          const { data: users } = await supabase.from('user_profiles').select('*');
          data = users || [];
          break;
        case 'posts':
          const { data: posts } = await supabase.from('posts').select('*');
          data = posts || [];
          break;
        case 'transactions':
          const { data: txns } = await supabase.from('wallet_transactions').select('*');
          data = txns || [];
          break;
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        // Convert to CSV
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(v => 
            typeof v === 'string' && v.includes(',') ? `"${v}"` : v
          ).join(',')
        );
        
        return [headers, ...rows].join('\n');
      }
    } catch (error) {
      console.error('Export data error:', error);
      return null;
    }
  },

  /**
   * Bulk actions
   */
  async bulkSendNotification(userIds: string[], message: string, type: 'SYSTEM' | 'ALERT') {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        content: message,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Bulk notification error:', error);
      return false;
    }
  }
};
