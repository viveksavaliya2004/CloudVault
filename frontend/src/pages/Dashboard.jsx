import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, FolderArchive,
  TrendingUp, Activity as ActivityIcon, ArrowRight, ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useDashboardStatsQuery } from '../hooks/useFiles';
import { formatBytes } from '../services/mockData';
import { Skeleton, UserAvatar } from '../components/UI';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: statsData, isLoading, isError } = useDashboardStatsQuery();

  const handleNavigateToFiles = () => navigate('/files');

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !statsData) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-red-500 font-semibold">Error Loading Analytics</p>
          <button onClick={() => window.location.reload()} className="premium-button-secondary mt-3">
            Reload
          </button>
        </div>
      </div>
    );
  }

  const { stats, uploadHistory, pinnedFiles, activities, user } = statsData;

  const getCategoryIcon = (name) => {
    if (name.includes('Doc')) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (name.includes('Image')) return { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (name.includes('Vid')) return { icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10' };
    return { icon: FolderArchive, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-container space-y-6 select-none text-left"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Welcome back, {user.name}</span>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-slate-450 dark:text-slate-400 mt-1">
            Here's the summary of your cloud activity and storage consumption.
          </p>
        </div>
        <button
          onClick={handleNavigateToFiles}
          className="premium-button-secondary py-2 text-xs"
        >
          <span>Browse Drive</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const { icon: CatIcon, color: iconColor, bg: iconBg } = getCategoryIcon(stat.name);
          return (
            <motion.div
              key={stat.name}
              whileHover={{ y: -3 }}
              className="premium-card p-5 flex items-start gap-4"
            >
              <div className={`p-3 rounded-xl flex-shrink-0 ${iconBg} ${iconColor}`}>
                <CatIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.name}</p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{formatBytes(stat.value)}</h4>
                <p className="text-xs text-slate-455 dark:text-slate-500 mt-0.5">{stat.count} items indexed</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload History Trend</h3>
              <p className="text-xs text-slate-400">Total data uploaded over last 7 months</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4%</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'white'
                  }}
                />
                <Area type="monotone" dataKey="size" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Storage Distribution</h3>
            <p className="text-xs text-slate-400">Proportions of data usage categories</p>
          </div>
          <div className="h-48 w-full flex justify-center items-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatBytes(value)}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold px-2">
            {stats.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pinned Files</h3>
              <p className="text-xs text-slate-400">Quick access to favorited items</p>
            </div>
            <button
              onClick={handleNavigateToFiles}
              className="text-xs text-primary font-semibold hover:underline"
            >
              See all
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {pinnedFiles.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Pin files from their context menu to show them here.
              </div>
            ) : (
              pinnedFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={handleNavigateToFiles}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 px-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-405 flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-455 dark:text-slate-505 flex-shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="premium-card p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Activities</h3>
              <p className="text-xs text-slate-400">Live feed of file manipulations</p>
            </div>
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-450">
              <ActivityIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/85">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No activity recorded yet.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 py-3">
                  <UserAvatar
                    name={act.user.name}
                    avatar={act.user.avatar}
                    size="sm"
                    className="rounded-full mt-0.5"
                  />
                  <div className="min-w-0 flex-grow">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{act.user.name}</span> {act.details}{' '}
                      <span className="font-semibold text-slate-850 dark:text-slate-200">
                        {act.targetName}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(act.timestamp).toLocaleDateString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
export default Dashboard;
