/**
 * Admin Panel Component
 * Full-featured dashboard for content moderation and user management
 */

import React, { useState, useEffect } from 'react';
import { adminService, AdminStats, ContentReport } from '../services/adminService';
import { Icons } from './Icons';

interface AdminPanelProps {
  adminId: string;
}

type AdminTab = 'DASHBOARD' | 'USERS' | 'REPORTS' | 'ANALYTICS';

export const AdminPanel: React.FC<AdminPanelProps> = ({ adminId }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
      
      const pendingReports = await adminService.getContentReports('PENDING');
      setReports(pendingReports);
    } catch (error) {
      console.error('Load admin data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const result = await adminService.getUsers({ limit: 50 });
    setUsers(result.users);
  };

  const handleReviewReport = async (reportId: string, action: 'APPROVE' | 'DISMISS') => {
    const success = await adminService.reviewContentReport(reportId, action, adminId);
    if (success) {
      setReports(reports.filter(r => r.id !== reportId));
      loadDashboardData(); // Refresh stats
    }
  };

  const handleUserAction = async (userId: string, action: string, reason: string) => {
    const success = await adminService.performUserAction(
      { action: action as any, userId, reason },
      adminId
    );
    if (success) {
      loadUsers(); // Refresh user list
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-slate-900 mb-1">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-emerald-600 mb-1">{stats?.activeUsers || 0}</div>
          <div className="text-sm text-slate-500">Active Users</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-brand mb-1">{stats?.proSubscribers || 0}</div>
          <div className="text-sm text-slate-500">Pro Subscribers</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-amber-600 mb-1">₹{stats?.totalRevenue || 0}</div>
          <div className="text-sm text-slate-500">Total Revenue</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-blue-600 mb-1">{stats?.postsToday || 0}</div>
          <div className="text-sm text-slate-500">Posts Today</div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-black text-rose-600 mb-1">{stats?.reportsToday || 0}</div>
          <div className="text-sm text-slate-500">Reports Pending</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <button className="px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition">
            <Icons.Users className="w-4 h-4" />
            Manage Users
          </button>
          <button className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition">
            <Icons.AlertTriangle className="w-4 h-4" />
            Review Reports
          </button>
          <button className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition">
            <Icons.Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Pending Reports</h3>
          <div className="space-y-3">
            {reports.slice(0, 5).map(report => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900">{report.reason}</div>
                  <div className="text-sm text-slate-500">
                    {report.content_type} · Reported {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewReport(report.id, 'APPROVE')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-semibold transition"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleReviewReport(report.id, 'DISMISS')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-semibold transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Icons.Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
        <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">All Plans</option>
          <option value="Basic">Free</option>
          <option value="Pro">Pro</option>
          <option value="Elite">Elite</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Joined</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.costudy_status?.subscription === 'Pro' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.costudy_status?.subscription || 'Basic'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-slate-100 rounded transition">
                      <Icons.Eye className="w-4 h-4 text-slate-600" />
                    </button>
                    <button className="p-1.5 hover:bg-rose-50 rounded transition">
                      <Icons.Ban className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Icons.Check className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <div className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</div>
          <div className="text-sm text-slate-500">No pending reports at the moment</div>
        </div>
      ) : (
        reports.map(report => (
          <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-semibold">
                    {report.content_type}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(report.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="font-bold text-slate-900 mb-1">{report.reason}</div>
                <div className="text-sm text-slate-600">{report.details}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleReviewReport(report.id, 'APPROVE')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition"
              >
                Remove Content
              </button>
              <button
                onClick={() => handleReviewReport(report.id, 'DISMISS')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition"
              >
                Dismiss Report
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Admin Panel</h1>
        <p className="text-slate-500">Manage users, content, and platform analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
        {(['DASHBOARD', 'USERS', 'REPORTS', 'ANALYTICS'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === tab
                ? 'text-brand border-b-2 border-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'DASHBOARD' && renderDashboard()}
      {activeTab === 'USERS' && renderUsers()}
      {activeTab === 'REPORTS' && renderReports()}
    </div>
  );
};
