import React from 'react';
import { Folder, MoreVertical, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserAvatar } from './UI';

export const FolderCard = ({ folder, onNavigate, onContextMenu }) => {
  const handleRightClick = (e) => {
    e.preventDefault();
    onContextMenu(e, folder);
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    onContextMenu(e, folder);
  };

  const formattedDate = new Date(folder.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onNavigate(folder.id)}
      onContextMenu={handleRightClick}
      className="glass-card cursor-pointer group flex flex-col p-4 rounded-xl relative select-none text-left"
    >
      <button
        onClick={handleOptionsClick}
        className="absolute top-3.5 right-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-2.5">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: `${folder.color}15` }}
        >
          <Folder className="w-6 h-6" style={{ color: folder.color || '#3B82F6' }} />
        </div>
        <div className="min-w-0 pr-6 mt-0.5">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary dark:group-hover:text-white transition-colors">
            {folder.name}
          </h4>
          {folder.description ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {folder.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
              No description
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-2.5" />

      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <UserAvatar
            name={folder.owner.name}
            avatar={folder.owner.avatar}
            size="xs"
            className="rounded-full"
          />
          <span className="truncate max-w-[80px]">{folder.owner.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </motion.div>
  );
};
export default FolderCard;
