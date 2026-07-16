import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Image as ImageIcon, Video, FileArchive, File,
  MoreVertical, Star, Pin, Lock, Calendar
} from 'lucide-react';
import { formatBytes } from '../services/mockData';
import { UserAvatar } from './UI';

export const FileCard = ({ file, onContextMenu, onDoubleClick }) => {
  const handleRightClick = (e) => {
    e.preventDefault();
    onContextMenu(e, file);
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    onContextMenu(e, file);
  };

  const getFileIconInfo = (type) => {
    switch (type) {
      case 'image':
        return { icon: ImageIcon, color: '#10B981', bg: 'bg-emerald-500/10' };
      case 'pdf':
        return { icon: FileText, color: '#EF4444', bg: 'bg-red-500/10' };
      case 'video':
        return { icon: Video, color: '#7C3AED', bg: 'bg-violet-500/10' };
      case 'zip':
        return { icon: FileArchive, color: '#F59E0B', bg: 'bg-amber-500/10' };
      case 'document':
        return { icon: FileText, color: '#3B82F6', bg: 'bg-blue-500/10' };
      default:
        return { icon: File, color: '#6B7280', bg: 'bg-gray-500/10' };
    }
  };

  const { icon: FileIcon, color: iconColor, bg: iconBg } = getFileIconInfo(file.type);

  const formattedDate = new Date(file.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onContextMenu={handleRightClick}
      onDoubleClick={() => onDoubleClick?.(file)}
      className="glass-card cursor-pointer group flex flex-col rounded-xl overflow-hidden relative select-none text-left"
    >
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        {file.isPinned && (
          <div className="bg-primary/20 backdrop-blur-md text-primary dark:text-primary-light p-1 rounded-lg">
            <Pin className="w-3 h-3 rotate-45 fill-primary" />
          </div>
        )}
        {file.isLocked && (
          <div className="bg-slate-900/40 backdrop-blur-md text-white p-1 rounded-lg">
            <Lock className="w-3 h-3" />
          </div>
        )}
      </div>

      <button
        onClick={handleOptionsClick}
        className="absolute top-3 right-3 z-10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="w-4.5 h-4.5" />
      </button>

      <div className="h-28 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100/30 dark:group-hover:bg-slate-950/40 transition-colors">
        {file.type === 'image' ? (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop"
              alt={file.name}
              className="w-full h-full object-cover rounded-lg filter brightness-95 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className={`p-4.5 rounded-2xl ${iconBg}`}>
            <FileIcon className="w-9 h-9" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-grow">
        <div className="flex items-start gap-1 justify-between">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary dark:group-hover:text-white transition-colors" title={file.name}>
            {file.name}
          </h4>
          {file.isFavorite && (
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mt-0.5 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          <span>{formatBytes(file.size)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-2.5" />

        <div className="flex items-center gap-2">
          <UserAvatar
            name={file.owner.name}
            avatar={file.owner.avatar}
            size="xs"
            className="rounded-full"
          />
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
            {file.owner.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
export default FileCard;
