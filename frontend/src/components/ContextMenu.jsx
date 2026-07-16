import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Trash2, FolderSymlink, Copy, Files, Download,
  Star, Pin, Archive, Lock, Unlock, RotateCcw
} from 'lucide-react';

export const ContextMenu = ({
  x, y, isOpen, onClose, targetItem, targetType,
  onRename, onDelete, onMove, onCopy, onDuplicate, onDownload,
  onToggleFavorite, onTogglePin, onToggleLock, onToggleArchive, onRestore
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const getAdjustedPosition = () => {
    if (!isOpen) return { top: y, left: x };
    const menuWidth = 180;
    const menuHeight = targetItem.isDeleted ? 100 : 380;
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }
    
    return { top: Math.max(10, adjustedY), left: Math.max(10, adjustedX) };
  };

  const pos = getAdjustedPosition();

  const isFile = () => targetType === 'file';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          className="fixed z-50 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1.5 flex flex-col gap-0.5"
        >
          {targetItem.isDeleted ? (
            <>
              <button
                onClick={() => { onRestore?.(); onClose(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-primary" />
                <span>Restore Item</span>
              </button>
              <button
                onClick={() => { onDelete(true); onClose(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Permanently</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { onRename(); onClose(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => { onMove(); onClose(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
              >
                <FolderSymlink className="w-3.5 h-3.5 text-slate-400" />
                <span>Move to...</span>
              </button>

              {isFile() && (
                <>
                  <button
                    onClick={() => { onDuplicate?.(); onClose(); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <Files className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => { onDownload?.(); onClose(); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-850 my-1" />

                  <button
                    onClick={() => { onToggleFavorite?.(); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star className={`w-3.5 h-3.5 ${targetItem.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      <span>{targetItem.isFavorite ? 'Starred' : 'Star'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onTogglePin?.(); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Pin className={`w-3.5 h-3.5 ${targetItem.isPinned ? 'fill-primary text-primary rotate-45' : 'text-slate-400'}`} />
                      <span>{targetItem.isPinned ? 'Unpin' : 'Pin'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onToggleArchive?.(); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Archive className={`w-3.5 h-3.5 ${targetItem.isArchived ? 'text-primary' : 'text-slate-400'}`} />
                      <span>{targetItem.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { onToggleLock?.(); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {targetItem.isLocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Unlock File</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lock File</span>
                        </>
                      )}
                    </div>
                  </button>
                </>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-850 my-1" />

              <button
                onClick={() => { onDelete(false); onClose(); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Move to Trash</span>
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default ContextMenu;
