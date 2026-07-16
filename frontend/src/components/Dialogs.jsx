import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { useAllFoldersQuery } from '../hooks/useFolders';

export const BaseModal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slateBg-darker/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-10 text-left"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-605 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Create Folder Dialog
export const CreateFolderDialog = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDesc('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), desc.trim());
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Folder Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Invoices"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="premium-input"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description (Optional)</label>
          <textarea
            placeholder="Brief details about what this folder will hold..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="premium-input h-20 resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="premium-button-secondary py-2">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim()} className="premium-button-primary py-2 px-5">
            Create
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// Rename Dialog
export const RenameDialog = ({ isOpen, onClose, currentName, type, onSubmit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;
    onSubmit(name.trim());
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Rename ${type === 'file' ? 'File' : 'Folder'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="premium-input"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="premium-button-secondary py-2">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || name.trim() === currentName} className="premium-button-primary py-2 px-5">
            Save
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// Delete Dialog
export const DeleteDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-3 items-start p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Warning</p>
            <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="premium-button-secondary py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="premium-button-danger py-2 px-5"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// Move Dialog
export const MoveDialog = ({ isOpen, onClose, itemName, itemType, itemId, onMove }) => {
  const { data: allFolders = [], isLoading } = useAllFoldersQuery();
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const getAllowedFolders = () => {
    if (itemType === 'file') return allFolders;
    
    const childIds = new Set([itemId]);
    let expanded = true;
    
    while (expanded) {
      expanded = false;
      allFolders.forEach(f => {
        if (f.parentFolderId && childIds.has(f.parentFolderId) && !childIds.has(f.id)) {
          childIds.add(f.id);
          expanded = true;
        }
      });
    }

    return allFolders.filter(f => !childIds.has(f.id));
  };

  const allowedFolders = getAllowedFolders();

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Move "${itemName}"`}>
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a target directory below to move this {itemType}.
        </p>

        <div className="border border-slate-200 dark:border-slate-805 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
              selectedFolderId === null
                ? 'bg-primary/5 dark:bg-primary/10 text-primary font-semibold'
                : 'text-slate-700 dark:text-slate-305 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm">
              <Folder className="w-4 h-4" />
              <span>CloudVault (Root)</span>
            </div>
            {selectedFolderId === null && <Check className="w-4 h-4 text-primary" />}
          </button>

          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading directory tree...</div>
          ) : allowedFolders.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No other directories available</div>
          ) : (
            allowedFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all ${
                  selectedFolderId === folder.id
                    ? 'bg-primary/5 dark:bg-primary/10 text-primary font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2.5 text-sm pl-4">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <Folder className="w-4 h-4" style={{ color: folder.color }} />
                  <span className="truncate">{folder.name}</span>
                </div>
                {selectedFolderId === folder.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="premium-button-secondary py-2">
            Cancel
          </button>
          <button onClick={handleMove} className="premium-button-primary py-2 px-5">
            Move Here
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
