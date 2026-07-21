import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderPlus, Upload, Grid, List, HardDrive
} from 'lucide-react';
import {
  useFolderContentsQuery,
  useCreateFolderMutation,
  useRenameFolderMutation,
  useDeleteFolderMutation,
  useMoveFolderMutation,
  useAllFoldersQuery
} from '../hooks/useFolders';
import {
  useRenameFileMutation,
  useDeleteFileMutation,
  useToggleFavoriteMutation,
  useTogglePinMutation,
  useToggleLockMutation,
  useToggleArchiveMutation,
  useMoveFileMutation,
  useDuplicateFileMutation,
  useDownloadFileMutation,
  useAllFilesQuery
} from '../hooks/useFiles';
import { Breadcrumb, EmptyState, ErrorState } from '../components/UI';
import { FolderCard } from '../components/FolderCard';
import { FileCard } from '../components/FileCard';
import { FileTable } from '../components/FileTable';
import { ContextMenu } from '../components/ContextMenu';
import { CreateFolderDialog, RenameDialog, DeleteDialog, MoveDialog } from '../components/Dialogs';
import { UploadModal } from '../components/UploadModal';
import { ShareModal } from '../components/ShareModal';
import { useFileViewer } from '../context/FileViewerContext';

export const MyFiles = () => {
  const { viewFile } = useFileViewer();
  const { folderId = null } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchFilter = searchParams.get('search') || '';

  const [viewMode, setViewMode] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shareOpen, setShareOpen] = useState(false);

  const { data: contents, isLoading, isError, refetch } = useFolderContentsQuery(folderId);
  const { data: allFolders = [] } = useAllFoldersQuery();
  const { data: allFiles = [] } = useAllFilesQuery();

  const createFolderMutation = useCreateFolderMutation();
  const renameFolderMutation = useRenameFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const moveFolderMutation = useMoveFolderMutation();

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

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleNavigateFolder = (id) => {
    if (id) {
      navigate(`/folder/${id}`);
    } else {
      navigate('/files');
    }
  };

  const buildBreadcrumbsPath = () => {
    const crumbs = [];
    let currentId = folderId;
    while (currentId) {
      const folder = allFolders.find(f => f.id === currentId);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentFolderId;
      } else {
        break;
      }
    }
    return crumbs;
  };

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

  const handleCreateFolder = (name, description) => {
    createFolderMutation.mutate({ name, parentFolderId: folderId, description });
  };

  const handleRenameSubmit = (newName) => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    if (type === 'file') {
      renameFileMutation.mutate({ id: item.id, newName });
    } else {
      renameFolderMutation.mutate({ id: item.id, newName });
    }
  };

  const handleDeleteConfirm = () => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    if (type === 'file') {
      deleteFileMutation.mutate({ id: item.id });
    } else {
      deleteFolderMutation.mutate({ id: item.id });
    }
  };

  const handleMoveSubmit = (targetFolderId) => {
    if (!contextMenu) return;
    const { item, type } = contextMenu;
    if (type === 'file') {
      moveFileMutation.mutate({ id: item.id, targetFolderId });
    } else {
      moveFolderMutation.mutate({ id: item.id, targetFolderId });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-6">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !contents) {
    return (
      <div className="page-container">
        <ErrorState message="Failed to load files and folders." onRetry={refetch} />
      </div>
    );
  }

  let renderedFiles = contents.files;
  let renderedFolders = contents.folders;

  if (searchFilter) {
    renderedFiles = allFiles.filter(f => !f.isDeleted && f.name.toLowerCase().includes(searchFilter.toLowerCase()));
    renderedFolders = allFolders.filter(f => !f.isDeleted && f.name.toLowerCase().includes(searchFilter.toLowerCase()));
  }

  if (typeFilter !== 'all') {
    renderedFiles = renderedFiles.filter(f => f.type === typeFilter);
    if (typeFilter !== 'folder') {
      renderedFolders = [];
    }
  }

  const breadcrumbs = buildBreadcrumbsPath();

  return (
    <div className="page-container space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {searchFilter ? (
          <div>
            <h1 className="text-xl font-bold">Search Results</h1>
            <p className="text-xs text-slate-400">Displaying results for "{searchFilter}"</p>
          </div>
        ) : (
          <Breadcrumb items={breadcrumbs} onNavigate={handleNavigateFolder} />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateFolderOpen(true)}
            className="premium-button-secondary py-2 text-xs"
          >
            <FolderPlus className="w-4 h-4 text-slate-505" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="premium-button-primary py-2 text-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3.5 bg-white/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {['all', 'pdf', 'image', 'video', 'document', 'zip'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {type === 'all' ? 'All Assets' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3.5 ml-auto flex-shrink-0">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {renderedFiles.length === 0 && renderedFolders.length === 0 ? (
        <EmptyState
          title={searchFilter ? "No search results" : "This folder is empty"}
          description={searchFilter ? "We couldn't find any file or folder matching your query." : "Drag & drop files or click 'Upload File' to get started."}
          icon={<HardDrive className="w-8 h-8 text-slate-400" />}
          action={searchFilter ? undefined : { label: "Upload a file", onClick: () => setUploadOpen(true) }}
        />
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {renderedFolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-405 uppercase tracking-wider">Folders</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {renderedFolders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onNavigate={handleNavigateFolder}
                    onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                  />
                ))}
              </div>
            </div>
          )}

          {renderedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-405 uppercase tracking-wider">Files</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {renderedFiles.map(file => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onContextMenu={(e) => handleContextMenu(e, file, 'file')}
                    onDoubleClick={(f) => viewFile(f)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <FileTable
          files={renderedFiles}
          folders={renderedFolders}
          onNavigateFolder={handleNavigateFolder}
          onContextMenu={handleContextMenu}
          onDoubleClickFile={(f) => viewFile(f)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={contextMenu.isOpen}
          onClose={() => setContextMenu(prev => prev ? { ...prev, isOpen: false } : null)}
          targetItem={contextMenu.item}
          targetType={contextMenu.type}
          onRename={() => setRenameOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onMove={() => setMoveOpen(true)}
          onCopy={contextMenu.type === 'file' ? () => duplicateFileMutation.mutate(contextMenu.item.id) : undefined}
          onDuplicate={contextMenu.type === 'file' ? () => duplicateFileMutation.mutate(contextMenu.item.id) : undefined}
          onDownload={contextMenu.type === 'file' ? () => downloadFileMutation.mutate({ id: contextMenu.item.id, name: contextMenu.item.name }) : undefined}
          onToggleFavorite={contextMenu.type === 'file' ? () => toggleFavoriteMutation.mutate(contextMenu.item.id) : undefined}
          onTogglePin={contextMenu.type === 'file' ? () => togglePinMutation.mutate(contextMenu.item.id) : undefined}
          onToggleLock={contextMenu.type === 'file' ? () => toggleLockMutation.mutate(contextMenu.item.id) : undefined}
          onToggleArchive={contextMenu.type === 'file' ? () => toggleArchiveMutation.mutate(contextMenu.item.id) : undefined}
          onShare={contextMenu.type === 'file' ? () => setShareOpen(true) : undefined}
          onView={contextMenu.type === 'file' ? () => viewFile(contextMenu.item) : undefined}
        />
      )}

      <CreateFolderDialog
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {contextMenu && (
        <>
          <RenameDialog
            isOpen={renameOpen}
            onClose={() => setRenameOpen(false)}
            currentName={contextMenu.item.name}
            type={contextMenu.type}
            onSubmit={handleRenameSubmit}
          />

          <DeleteDialog
            isOpen={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={handleDeleteConfirm}
            title={contextMenu.type === 'file' ? "Move file to Trash?" : "Move folder to Trash?"}
            message={
              contextMenu.type === 'file'
                ? `Are you sure you want to delete "${contextMenu.item.name}"? It will be kept in Recycle Bin for 30 days.`
                : `Are you sure you want to delete "${contextMenu.item.name}"? All files inside this folder will also be moved to Recycle Bin.`
            }
          />

          <MoveDialog
            isOpen={moveOpen}
            onClose={() => setMoveOpen(false)}
            itemName={contextMenu.item.name}
            itemType={contextMenu.type}
            itemId={contextMenu.item.id}
            onMove={handleMoveSubmit}
          />
        </>
      )}

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentFolderId={folderId}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        file={contextMenu?.item}
      />
    </div>
  );
};
export default MyFiles;
