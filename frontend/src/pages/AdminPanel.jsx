import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, HardDrive, Database, BarChart2, ListTodo, Ban,
  Upload, Download, TrendingUp, Shield, ArrowUpRight,
  Activity, Clock, UserCheck, UserX
} from 'lucide-react';
import { apiService } from '../services/api';
import { formatBytes } from '../services/mockData';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';

export const AdminPanel = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [mostSharedFiles, setMostSharedFiles] = useState([]);
  const [mostDownloadedFiles, setMostDownloadedFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.admin.getStats();
      setStats(res.data.stats);
      setTopUsers(res.data.topUsers || []);
      setBlockedUsers(res.data.blockedUsers || []);
      setMostSharedFiles(res.data.mostSharedFiles || []);
      setMostDownloadedFiles(res.data.mostDownloadedFiles || []);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load admin stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchAllUsers = useCallback(async () => {
    try {
      setAllUsersLoading(true);
      const res = await apiService.admin.getUsers();
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load user list', 'error');
    } finally {
      setAllUsersLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAdminData();
    fetchAllUsers();
  }, [fetchAdminData, fetchAllUsers]);

  const handleToggleBlock = async (userId) => {
    try {
      await apiService.admin.toggleBlockUser(userId);
      addToast('User status updated', 'success');
      fetchAdminData();
      fetchAllUsers();
    } catch (err) {
      console.error(err);
      addToast(err?.response?.data?.message || 'Action failed', 'error');
    }
  };

  const storagePercent = stats ? Math.min(100, (stats.totalStorageUsed / stats.totalStorageLimit) * 100) : 0;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: Activity },
    { key: 'logs', label: 'Audit Logs', icon: ListTodo },
  ];

  // ── Stat Card ──
  const StatCard = ({ icon: Icon, label, value, color, sub, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-indigo-400/50 dark:hover:border-indigo-800/40 select-none' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {sub && <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{sub}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-left select-none">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor platform activity, manage users, and review system health.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.usersCount || 0}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          icon={HardDrive}
          label="Number of Files"
          value={stats?.filesCount || 0}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          onClick={() => setActiveTab('analytics')}
        />
        <StatCard
          icon={Database}
          label="Storage Used"
          value={formatBytes(stats?.totalStorageUsed || 0)}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          onClick={() => setActiveTab('analytics')}
        />
        <StatCard
          icon={Download}
          label="Downloads"
          value={stats?.downloadsCount || 0}
          color="bg-gradient-to-br from-violet-500 to-violet-600"
          onClick={() => setActiveTab('analytics')}
        />
        <StatCard
          icon={Upload}
          label="Uploads Today"
          value={stats?.uploadsTodayCount || 0}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => setActiveTab('logs')}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Upload Speed"
          value={stats?.avgUploadSpeed ? `${stats.avgUploadSpeed} Mbps` : '0 Mbps'}
          color="bg-gradient-to-br from-rose-500 to-rose-600"
          onClick={() => setActiveTab('analytics')}
        />
      </div>

      {/* Storage Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Platform Storage</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatBytes(stats?.totalStorageUsed || 0)} of {formatBytes(stats?.totalStorageLimit || 0)} used
            </p>
          </div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Math.round(storagePercent)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${storagePercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${storagePercent > 90 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                storagePercent > 70 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit transition-colors duration-300">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Top Storage Users
              </h3>
            </div>
            <div className="space-y-3">
              {topUsers.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">No users found.</p>
              ) : (
                topUsers.map((u, i) => (
                  <div key={u._id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                          i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                            i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                              'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{formatBytes(u.storageUsed || 0)}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Blocked Users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-500" />
                Blocked Accounts
              </h3>
              <span className="text-xs font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
                {blockedUsers.length}
              </span>
            </div>
            {blockedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="w-10 h-10 text-emerald-400 dark:text-emerald-500 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">All accounts are in good standing</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blockedUsers.map(u => (
                  <div key={u._id || u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleToggleBlock(u._id || u.id)}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Tab: Users ── */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors duration-300"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">All Users</h3>
            <span className="text-xs font-semibold bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">
              {allUsers.length} total
            </span>
          </div>

          {allUsersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Storage</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${u.role === 'admin'
                              ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                              : 'bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700'
                            }`}>
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{formatBytes(u.storageUsed || 0)}</td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="text-xs font-semibold bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">Admin</span>
                        ) : u.isBlocked ? (
                          <span className="text-xs font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">Blocked</span>
                        ) : (
                          <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <button
                            onClick={() => handleToggleBlock(u._id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${u.isBlocked
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 hover:bg-emerald-200 dark:hover:bg-emerald-500/25'
                                : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/15 hover:bg-rose-200 dark:hover:bg-rose-500/25'
                              }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tab: Analytics ── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* User Subscription Plans (Cards & Bars) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300 space-y-6"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Subscription Tiers
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Distribution of user subscription levels</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Free</span>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats?.plans?.free || 0}</p>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Default Tier</span>
              </div>
              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/30 bg-indigo-50/20 dark:bg-indigo-950/10 text-center">
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Premium</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats?.plans?.premium || 0}</p>
                <span className="text-[10px] font-semibold text-indigo-400">Paid Tier</span>
              </div>
              <div className="p-4 rounded-xl border border-violet-100 dark:border-violet-950/30 bg-violet-50/20 dark:bg-violet-950/10 text-center">
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">Business</span>
                <p className="text-2xl font-black text-violet-650 dark:text-violet-400 mt-1">{stats?.plans?.business || 0}</p>
                <span className="text-[10px] font-semibold text-violet-400">Enterprise Tier</span>
              </div>
            </div>

            {/* Plan Distribution Progress Bars */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Market Share</h4>
              {['free', 'premium', 'business'].map(plan => {
                const planCount = stats?.plans?.[plan] || 0;
                const percent = stats?.usersCount > 0 ? (planCount / stats.usersCount) * 100 : 0;
                const colors = {
                  free: 'from-slate-400 to-slate-500',
                  premium: 'from-indigo-500 to-indigo-600',
                  business: 'from-violet-500 to-violet-600'
                };
                return (
                  <div key={plan} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="capitalize text-slate-700 dark:text-slate-350">{plan} Plan</span>
                      <span className="text-slate-500 dark:text-slate-400">{planCount} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full bg-gradient-to-r ${colors[plan]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* User Verification / Platform Health */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300 space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  Account Security
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Identity verification status</p>
              </div>

              {/* Progress gauge circles style */}
              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Verified Identity</span>
                  <span className="text-slate-800 dark:text-white font-bold">{stats?.verifiedUsersCount || 0} users</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.usersCount > 0 ? ((stats.verifiedUsersCount || 0) / stats.usersCount) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Unverified / Guest</span>
                  <span className="text-slate-800 dark:text-white font-bold">{stats?.unverifiedUsersCount || 0} users</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.usersCount > 0 ? ((stats.unverifiedUsersCount || 0) / stats.usersCount) * 100 : 0}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick summary status banner */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              💡 Platform health: <span className="font-semibold text-slate-700 dark:text-slate-300">
                {stats?.usersCount > 0 ? Math.round(((stats.verifiedUsersCount || 0) / stats.usersCount) * 100) : 0}%
              </span> of your userbase has successfully verified their login credential integrity.
            </div>
          </motion.div>

          {/* File Storage Categories breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300 space-y-6"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                Resource Categories
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Breakdown of uploaded files by mime category</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[
                { key: 'images', label: 'Images', color: 'from-blue-500 to-blue-600', count: stats?.categories?.images || 0 },
                { key: 'videos', label: 'Videos', color: 'from-violet-500 to-violet-600', count: stats?.categories?.videos || 0 },
                { key: 'audios', label: 'Audios', color: 'from-indigo-500 to-indigo-600', count: stats?.categories?.audios || 0 },
                { key: 'documents', label: 'Documents', color: 'from-red-500 to-red-600', count: stats?.categories?.documents || 0 },
                { key: 'others', label: 'Others', color: 'from-slate-400 to-slate-500', count: stats?.categories?.others || 0 },
              ].map(cat => {
                const total = stats?.filesCount || 0;
                const percent = total > 0 ? (cat.count / total) * 100 : 0;
                return (
                  <div key={cat.key} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex flex-col justify-between space-y-3.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{cat.label}</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{cat.count}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{Math.round(percent)}% of files</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Most Shared & Most Downloaded Lists */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Most Shared Files */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                Most Shared Files
              </h3>
              {mostSharedFiles.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No shared files found.</p>
              ) : (
                <div className="space-y-3.5">
                  {mostSharedFiles.map((file, idx) => (
                    <div key={file._id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.fileName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Owned by: {file.owner?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-150 dark:border-indigo-900/30">
                          {file.shareCount} {file.shareCount === 1 ? 'Share' : 'Shares'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Most Downloaded Files */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-emerald-500" />
                Most Downloaded Files
              </h3>
              {mostDownloadedFiles.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No downloaded files found.</p>
              ) : (
                <div className="space-y-3.5">
                  {mostDownloadedFiles.map((file, idx) => (
                    <div key={file._id || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.fileName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Size: {formatBytes(file.size || 0)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-150 dark:border-emerald-900/30">
                          {file.downloadsCount} Downloads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

        </div>
      )}

      {/* ── Tab: Audit Logs ── */}
      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors duration-300"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-indigo-500" />
            Recent Activity
          </h3>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No recent activity recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${log.action === 'file_upload' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                        log.action === 'user_register' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                          'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                      {log.action === 'file_upload' ? <Upload className="w-3.5 h-3.5" /> :
                        log.action === 'user_register' ? <UserCheck className="w-3.5 h-3.5" /> :
                          <Ban className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{log.message}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;
