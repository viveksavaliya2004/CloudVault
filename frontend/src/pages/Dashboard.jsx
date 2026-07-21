import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, FolderArchive,
  Activity as ActivityIcon, ArrowRight, ShieldCheck,
  Music, HelpCircle, HardDrive, Folder, Star, Clock, Heart, Download, AlertTriangle
} from 'lucide-react';
import { useDashboardStatsQuery, useDownloadFileMutation } from '../hooks/useFiles';
import { formatBytes } from '../services/mockData';
import { Skeleton, UserAvatar } from '../components/UI';
import { useFileViewer } from '../context/FileViewerContext';

export const Dashboard = () => {
  const { viewFile } = useFileViewer();
  const navigate = useNavigate();
  const { data: statsData, isLoading, isError, refetch } = useDashboardStatsQuery();
  const downloadFileMutation = useDownloadFileMutation();

  const [activeTab, setActiveTab] = useState('recent');

  const handleNavigateToFiles = () => navigate('/files');

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[480px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[480px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !statsData) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-500 font-semibold">Error Loading Analytics</p>
          <button onClick={() => refetch()} className="premium-button-secondary mt-3 mx-auto">
            Reload
          </button>
        </div>
      </div>
    );
  }

  const {
    stats = [],
    pinnedFiles = [],
    recentFiles = [],
    favouriteFiles = [],
    recentUploads = [],
    activities = [],
    user = {},
    storageUsed = 0,
    storageRemaining = 0,
    counts = { files: 0, folders: 0 }
  } = statsData;

  const storagePercentage = user.storageLimit > 0 ? (storageUsed / user.storageLimit) * 100 : 0;

  const getCategoryIcon = (name) => {
    if (name.includes('Doc') || name.includes('PDF')) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (name.includes('Image') || name.includes('Photo')) return { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (name.includes('Vid') || name.includes('Media')) return { icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10' };
    return { icon: FolderArchive, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'pdf':
        return { icon: FileText, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'video':
        return { icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10' };
      case 'document':
        return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'zip':
        return { icon: FolderArchive, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'audio':
        return { icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10' };
      default:
        return { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  // Selected tab data helper
  const getTabItems = () => {
    switch (activeTab) {
      case 'uploads':
        return recentUploads;
      case 'favourite':
        return favouriteFiles;
      case 'pinned':
        return pinnedFiles;
      case 'recent':
      default:
        return recentFiles;
    }
  };

  const tabItems = getTabItems().slice(0, 8); // Display up to 8 files

  const handleDownloadFile = (e, file) => {
    e.stopPropagation();
    downloadFileMutation.mutate({ id: file.id, name: file.name });
  };

  const getEmptyStateDetails = () => {
    switch (activeTab) {
      case 'uploads':
        return {
          title: 'No recent uploads',
          description: 'Upload files to your CloudVault Drive to see them in this feed.',
          icon: Clock
        };
      case 'favourite':
        return {
          title: 'No favourite files',
          description: 'Mark files as favourite from their context menu to see them here.',
          icon: Heart
        };
      case 'pinned':
        return {
          title: 'No pinned files',
          description: 'Pin important files from their context menu for quick access.',
          icon: Star
        };
      case 'recent':
      default:
        return {
          title: 'No files modified recently',
          description: 'Interact with files to see activity in this feed.',
          icon: Clock
        };
    }
  };

  const EmptyStateDetail = getEmptyStateDetails();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-container space-y-6 select-none text-left"
    >
      {/* Upper Header Welcome Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Welcome back, {user.name || 'User'}</span>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-slate-455 dark:text-slate-400 mt-1">
            Here's the summary of your cloud activity and storage consumption.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNavigateToFiles}
            className="premium-button-primary py-2 text-xs"
          >
            <span>Browse Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Drive Summary Metrics (Storage, Counts) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Storage Summary Card */}
        <div className="premium-card p-4.5 flex flex-col justify-between h-28">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cloud Storage</span>
            <HardDrive className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {storagePercentage.toFixed(1)}% Used
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                {formatBytes(storageRemaining)} free
              </span>
            </div>
            {/* Progress indicator */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                transition={{ duration: 1 }}
                style={{
                  backgroundImage: 'linear-gradient(90deg, #1A73E8, #7C3AED)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Active Files count card */}
        <div className="premium-card p-4.5 flex items-center gap-3 h-28">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Files</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{counts.files}</h4>
            <p className="text-[9px] text-slate-455 dark:text-slate-500">Indexed securely</p>
          </div>
        </div>

        {/* Folders count card */}
        <div className="premium-card p-4.5 flex items-center gap-3 h-28">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl flex-shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Folders</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{counts.folders}</h4>
            <p className="text-[9px] text-slate-455 dark:text-slate-500">Structured layout</p>
          </div>
        </div>

      </div>

      {/* Row 3: Category Breakdowns (Images, PDFs, Videos, Documents) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const { icon: CatIcon, color: iconColor, bg: iconBg } = getCategoryIcon(stat.name);
          return (
            <motion.div
              key={stat.name}
              whileHover={{ y: -3 }}
              className="premium-card p-4 flex items-center gap-3 cursor-pointer hover:shadow-premium-hover transition-all duration-300"
              onClick={handleNavigateToFiles}
            >
              <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} flex-shrink-0`}>
                <CatIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{formatBytes(stat.value)}</h4>
                <p className="text-[9px] text-slate-455 dark:text-slate-500">{stat.count} items</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Row 4: Main Content (Explorer & Activities Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2/3 width) - File Explorer tab panel */}
        <div className="lg:col-span-2 premium-card p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">File Explorer</h3>
              <p className="text-xs text-slate-400 font-medium">Quick access to feeds and bookmarks</p>
            </div>
            
            {/* Tab Toggles */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === 'recent'
                    ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Recent Files
              </button>
              <button
                onClick={() => setActiveTab('uploads')}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === 'uploads'
                    ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Recent Uploads
              </button>
              <button
                onClick={() => setActiveTab('favourite')}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === 'favourite'
                    ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Favourites
              </button>
              <button
                onClick={() => setActiveTab('pinned')}
                className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === 'pinned'
                    ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pinned
              </button>
            </div>
          </div>

          {/* List Contents (Expanded to show up to 8 items) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 min-h-[360px] flex flex-col justify-start">
            <AnimatePresence mode="wait">
              {tabItems.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-col items-center justify-center py-16 text-center flex-grow"
                >
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3 text-slate-400">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{EmptyStateDetail.title}</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                    {EmptyStateDetail.description}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="divide-y divide-slate-100 dark:divide-slate-800/80"
                >
                  {tabItems.map((file) => {
                    const { icon: FileIcon, color: iconColor, bg: iconBg } = getFileIcon(file.type);
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => viewFile(file)}
                        className="flex items-center justify-between py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-805/20 px-2 rounded-xl group transition-all duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className={`p-2 rounded-lg ${iconBg} ${iconColor} flex-shrink-0`}>
                            <FileIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block group-hover:text-primary transition-colors">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Updated {new Date(file.updatedAt || file.createdAt).toLocaleDateString()} by {file.owner?.name || 'You'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[10px] font-semibold text-slate-455 dark:text-slate-505">
                            {formatBytes(file.size)}
                          </span>
                          <button
                            onClick={(e) => handleDownloadFile(e, file)}
                            className="p-1.5 bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary rounded-lg text-slate-500 dark:text-slate-400 shadow-xs active:scale-95 transition-all duration-150"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column (1/3 width) - Activity feed and System Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Recent Activities */}
          <div className="premium-card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ActivityIcon className="w-4 h-4 text-emerald-500" />
                <span>Recent Activities</span>
              </span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-[11px] text-slate-400">No activity recorded yet.</div>
              ) : (
                activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 py-1">
                    <UserAvatar
                      name={act.user?.name}
                      avatar={act.user?.avatar}
                      size="xs"
                      className="rounded-full mt-0.5 border border-slate-100 dark:border-slate-850"
                    />
                    <div className="min-w-0 flex-grow">
                      <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{act.user?.name || 'Someone'}</span> {act.details}{' '}
                        <span className="font-semibold text-slate-850 dark:text-slate-200 truncate inline-block max-w-[120px] align-bottom">
                          {act.targetName}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
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

      </div>
    </motion.div>
  );
};

export default Dashboard;
