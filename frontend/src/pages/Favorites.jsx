import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useFavoritesQuery, useRenameFileMutation, useDeleteFileMutation, useToggleFavoriteMutation, useTogglePinMutation, useToggleLockMutation, useToggleArchiveMutation, useMoveFileMutation, useDuplicateFileMutation, useDownloadFileMutation } from '../hooks/useFiles';
import { Skeleton, EmptyState, ErrorState } from '../components/UI';
import { FileCard } from '../components/FileCard';
import { ContextMenu } from '../components/ContextMenu';
import { RenameDialog, DeleteDialog, MoveDialog } from '../components/Dialogs';
import { ShareModal } from '../components/ShareModal';
import { useFileViewer } from '../context/FileViewerContext';

export const Favorites = () => {
  const { viewFile } = useFileViewer();
  const { data, isLoading, isError, refetch } = useFavoritesQuery();
  const [shareOpen, setShareOpen] = useState(false);

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
        <ErrorState message="Failed to load favorites." onRetry={refetch} />
      </div>
    );
  }

  const { files = [] } = data;

  return (
    <div className="page-container space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span>Favorites</span>
        </h1>
        <p className="text-xs text-slate-455">Quickly locate files that you have starred or bookmarked</p>
      </div>

      {files.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Star your important files by right-clicking on them and choosing 'Star' to show them in this view."
          icon={<Star className="w-8 h-8 text-amber-400 fill-amber-400/20" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map(file => (
            <FileCard
              key={file.id}
              file={file}
              onContextMenu={(e) => handleContextMenu(e, file)}
              onDoubleClick={(f) => viewFile(f)}
            />
          ))}
        </div>
      )}

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
          onShare={() => setShareOpen(true)}
          onView={() => viewFile(contextMenu.item)}
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
            message={`Are you sure you want to move "${contextMenu.item.name}" to Recycle Bin?`}
          />

          <MoveDialog
            isOpen={moveOpen}
            onClose={() => setMoveOpen(false)}
            itemName={contextMenu.item.name}
            itemType="file"
            itemId={contextMenu.item.id}
            onMove={(targetFolderId) => moveFileMutation.mutate({ id: contextMenu.item.id, targetFolderId })}
          />

          <ShareModal
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            file={contextMenu.item}
          />
        </>
      )}
    </div>
  );
};
export default Favorites;
