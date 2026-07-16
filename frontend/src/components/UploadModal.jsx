import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, File, AlertCircle, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import { useUploadFileMutation } from '../hooks/useFiles';
import { formatBytes } from '../services/mockData';

export const UploadModal = ({ isOpen, onClose, currentFolderId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const uploadMutation = useUploadFileMutation();
  const fileInputRef = useRef(null);

  // Clear queue on close
  useEffect(() => {
    if (!isOpen) {
      setQueue([]);
    }
  }, [isOpen]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (files) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));

    setQueue(prev => [...prev, ...newItems]);
  };

  // Trigger uploads sequentially
  useEffect(() => {
    const pendingItem = queue.find(item => item.status === 'pending');
    if (!pendingItem) return;

    setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'uploading' } : item));

    uploadMutation.mutate({
      file: pendingItem.file,
      parentFolderId: currentFolderId,
      onProgress: (progress) => {
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, progress } : item));
      }
    }, {
      onSuccess: () => {
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'success', progress: 100 } : item));
      },
      onError: () => {
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'error', errorMsg: 'Connection Timeout' } : item));
      }
    });
  }, [queue, uploadMutation, currentFolderId]);

  const handleRetry = (id) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'pending', progress: 0 } : item));
  };

  const handleRemove = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const isUploading = queue.some(item => item.status === 'uploading');
  const allCompleted = queue.length > 0 && queue.every(item => item.status === 'success');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isUploading ? undefined : onClose}
            className="absolute inset-0 bg-slateBg-darker/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-10 text-left"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Upload Files</span>
                {isUploading && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </h3>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-light/50 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-premium rounded-xl text-slate-400 dark:text-slate-500 mb-3 hover-scale">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                  Drag & Drop files here or <span className="text-primary hover:underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Supports multiple uploads (PDFs, DOCs, Sheets, MP4s, ZIPs up to 1GB)
                </p>
              </div>

              {queue.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Queue</h4>
                  <div className="space-y-2">
                    {queue.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-xl"
                      >
                        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-lg text-slate-400 flex-shrink-0">
                          <File className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs font-medium text-slate-850 dark:text-slate-200 truncate">{item.file.name}</p>
                            <p className="text-[10px] text-slate-455 flex-shrink-0">{formatBytes(item.file.size)}</p>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${
                                item.status === 'success'
                                  ? 'bg-success'
                                  : item.status === 'error'
                                  ? 'bg-danger'
                                  : 'bg-primary'
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.status === 'success' && <CheckCircle2 className="w-4.5 h-4.5 text-success" />}
                          {item.status === 'error' && (
                            <>
                              <button
                                onClick={() => handleRetry(item.id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-505 transition-colors"
                                title="Retry upload"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <span title={item.errorMsg} className="flex items-center text-danger">
                                <AlertCircle className="w-4.5 h-4.5" />
                              </span>
                            </>
                          )}
                          {item.status !== 'uploading' && (
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="p-1 hover:bg-red-500/10 hover:text-danger rounded-lg text-slate-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center p-4 bg-success/5 border border-success/10 rounded-xl text-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-success mb-2" />
                  <p className="text-sm font-semibold text-success-dark dark:text-success-light">All uploads completed successfully!</p>
                  <p className="text-xs text-slate-500 mt-1">Files have been indexed in your database.</p>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="premium-button-secondary py-2"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default UploadModal;
