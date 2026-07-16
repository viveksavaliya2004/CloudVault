import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRecycleBinQuery, useEmptyRecycleBinMutation, useRestoreFileMutation, useDeleteFileMutation } from '../hooks/useFiles';
import { useRestoreFolderMutation, useDeleteFolderMutation } from '../hooks/useFolders';
import { Skeleton, EmptyState, ErrorState } from '../components/UI';
import { FolderCard } from '../components/FolderCard';
import { FileCard } from '../components/FileCard';
import { ContextMenu } from '../components/ContextMenu';
import { DeleteDialog } from '../components/Dialogs';

export const RecycleBin = () => {
  const { data, isLoading, isError, refetch } = useRecycleBinQuery();
  const emptyBinMutation = useEmptyRecycleBinMutation();

  const restoreFileMutation = useRestoreFileMutation();
  const deleteFileMutation = useDeleteFileMutation();
  const restoreFolderMutation = useRestoreFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();

  const [contextMenu, setContextMenu] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isOpen: true,
      item,
      type
    });
  };

  const handleRestore = () => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    if (type === 'file') {
      restoreFileMutation.mutate(item.id);
    } else {
      restoreFolderMutation.mutate(item.id);
    }
  };

  const handleDeleteConfirm = () => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    if (type === 'file') {
      deleteFileMutation.mutate({ id: item.id, permanent: true });
    } else {
      deleteFolderMutation.mutate({ id: item.id, permanent: true });
    }
  };

  const handleEmptyBin = () => {
    emptyBinMutation.mutate();
    setEmptyConfirmOpen(false);
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-8 w-40" />
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
        <ErrorState message="Failed to load Recycle Bin." onRetry={refetch} />
      </div>
    );
  }

  const { files = [], folders = [] } = data;
  const hasItems = files.length > 0 || folders.length > 0;

  return (
    <div className="page-container space-y-6 select-none text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Recycle Bin</span>
          </h1>
          <p className="text-xs text-slate-400">Items inside the recycle bin will be permanently deleted after 30 days</p>
        </div>
        
        {hasItems && (
          <button
            onClick={() => setEmptyConfirmOpen(true)}
            className="premium-button-danger py-2 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      {!hasItems ? (
        <EmptyState
          title="Recycle bin is empty"
          description="Deleted files and folders will show up here. You can restore them anytime within 30 days."
          icon={<Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />}
        />
      ) : (
        <div className="space-y-6">
          {folders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Deleted Folders</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onNavigate={() => {}}
                    onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                  />
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-455 dark:text-slate-505 uppercase tracking-wider">Deleted Files</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={contextMenu.isOpen}
          onClose={() => setContextMenu(prev => prev ? { ...prev, isOpen: false } : null)}
          targetItem={contextMenu.item}
          targetType={contextMenu.type}
          onRename={() => {}}
          onDelete={() => setDeleteOpen(true)}
          onMove={() => {}}
          onRestore={handleRestore}
        />
      )}

      {contextMenu && (
        <DeleteDialog
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete permanently?"
          message={`Are you sure you want to permanently delete "${contextMenu.item.name}"? This action is irreversible.`}
        />
      )}

      <DeleteDialog
        isOpen={emptyConfirmOpen}
        onClose={() => setEmptyConfirmOpen(false)}
        onConfirm={handleEmptyBin}
        title="Empty Recycle Bin?"
        message="Are you sure you want to permanently delete all files and folders in the Recycle Bin? This action is permanent and cannot be undone."
      />
    </div>
  );
};
export default RecycleBin;
