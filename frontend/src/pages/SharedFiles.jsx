import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Eye, Edit, Calendar } from 'lucide-react';
import { useSharedQuery, useRenameFileMutation, useDeleteFileMutation, useToggleFavoriteMutation, useTogglePinMutation, useToggleLockMutation, useToggleArchiveMutation, useMoveFileMutation, useDuplicateFileMutation, useDownloadFileMutation } from '../hooks/useFiles';
import { Skeleton, EmptyState, ErrorState } from '../components/UI';
import { FileCard } from '../components/FileCard';
import { ContextMenu } from '../components/ContextMenu';
import { RenameDialog, DeleteDialog, MoveDialog } from '../components/Dialogs';

export const SharedFiles = () => {
  const { data, isLoading, isError, refetch } = useSharedQuery();
  const [activeTab, setActiveTab] = useState('withMe');

  const renameFileMutation = useRenameFileMutation();
  const deleteFileMutation = useDeleteFileMutation();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const togglePinMutation = useTogglePinMutation();
  const toggleLockMutation = useToggleLockMutation();
  const toggleArchiveMutation = useToggleArchiveMutation();
  const moveFileMutation = useMoveFileMutation();
  const duplicateFileMutation = useDuplicateFileMutation();
  const downloadFileMutation = useDownloadFileMutation();

  const [contextMenu, setContextMenu] = useState(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      item: file
    });
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page-container">
        <ErrorState message="Failed to load shared items." onRetry={refetch} />
      </div>
    );
  }

  const { sharedWithMe = [], sharedByMe = [] } = data;
  const currentItems = activeTab === 'withMe' ? sharedWithMe : sharedByMe;

  return (
    <div className="page-container space-y-6 select-none text-left">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-500" />
          <span>Shared Access</span>
        </h1>
        <p className="text-xs text-slate-400">View and manage documents shared across your organization teams</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('withMe')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider relative transition-colors ${
            activeTab === 'withMe' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Shared with me</span>
          {activeTab === 'withMe' && (
            <motion.div layoutId="sharedTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('byMe')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider relative transition-colors ${
            activeTab === 'byMe' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Shared by me</span>
          {activeTab === 'byMe' && (
            <motion.div layoutId="sharedTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {currentItems.length === 0 ? (
            <EmptyState
              title={activeTab === 'withMe' ? "Nothing shared with you yet" : "You haven't shared any files"}
              description={activeTab === 'withMe' ? "Documents shared with you by colleagues will show up here." : "Right click files in your drive, toggle lock/sharing state to distribute access."}
              icon={<Share2 className="w-8 h-8 text-indigo-300 dark:text-indigo-950" />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentItems.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="absolute bottom-[85px] left-3 z-10 flex gap-1 items-center">
                    {activeTab === 'withMe' ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white py-0.5 px-2 rounded-full shadow-sm">
                        <Eye className="w-2.5 h-2.5" />
                        <span>{file.permission}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white py-0.5 px-2 rounded-full shadow-sm">
                        <Edit className="w-2.5 h-2.5" />
                        <span>Shared</span>
                      </span>
                    )}

                    {file.expiration && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-white py-0.5 px-2 rounded-full shadow-sm">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>Expires soon</span>
                      </span>
                    )}
                  </div>

                  <FileCard
                    file={file}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onDoubleClick={(f) => downloadFileMutation.mutate({ id: f.id, name: f.name })}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={contextMenu.isOpen}
          onClose={() => setContextMenu(prev => prev ? { ...prev, isOpen: false } : null)}
          targetItem={contextMenu.item}
          targetType="file"
          onRename={() => setRenameOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onMove={() => setMoveOpen(true)}
          onCopy={() => duplicateFileMutation.mutate(contextMenu.item.id)}
          onDuplicate={() => duplicateFileMutation.mutate(contextMenu.item.id)}
          onDownload={() => downloadFileMutation.mutate({ id: contextMenu.item.id, name: contextMenu.item.name })}
          onToggleFavorite={() => toggleFavoriteMutation.mutate(contextMenu.item.id)}
          onTogglePin={() => togglePinMutation.mutate(contextMenu.item.id)}
          onToggleLock={() => toggleLockMutation.mutate(contextMenu.item.id)}
          onToggleArchive={() => toggleArchiveMutation.mutate(contextMenu.item.id)}
        />
      )}

      {contextMenu && (
        <>
          <RenameDialog
            isOpen={renameOpen}
            onClose={() => setRenameOpen(false)}
            currentName={contextMenu.item.name}
            type="file"
            onSubmit={(newName) => renameFileMutation.mutate({ id: contextMenu.item.id, newName })}
          />

          <DeleteDialog
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={() => deleteFileMutation.mutate({ id: contextMenu.item.id })}
            title="Move file to Trash?"
            message={`Are you sure you want to delete "${contextMenu.item.name}"? This file will be archived/trashed.`}
          />

          <MoveDialog
            isOpen={moveOpen}
            onClose={() => setMoveOpen(false)}
            itemName={contextMenu.item.name}
            itemType="file"
            itemId={contextMenu.item.id}
            onMove={(targetFolderId) => moveFileMutation.mutate({ id: contextMenu.item.id, targetFolderId })}
          />
        </>
      )}
    </div>
  );
};
export default SharedFiles;
