import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, File, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useUploadFileMutation } from '../hooks/useFiles';
import { formatBytes } from '../services/mockData';

// SVG Animated Checkmark Component
const AnimatedCheck = () => {
  return (
    <svg
      className="w-14 h-14 text-emerald-500"
      viewBox="0 0 52 52"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="23"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.path
        d="M14 27l8 8 16-16"
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
};

export const UploadModal = ({ isOpen, onClose, currentFolderId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const uploadMutation = useUploadFileMutation();
  const fileInputRef = useRef(null);
  const queueRef = useRef([]);
  queueRef.current = queue;

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

  const startNextUpload = () => {
    const pendingItem = queueRef.current.find(item => item.status === 'pending');
    if (!pendingItem) return;

    setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'uploading', progress: 0 } : item));

    uploadMutation.mutate({
      file: pendingItem.file,
      parentFolderId: currentFolderId,
      onProgress: (progress, statusInfo) => {
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, progress, statusText: statusInfo?.statusText || '' } : item));
      },
      signal: pendingItem.abortController?.signal
    }, {
      onSuccess: () => {
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'success', progress: 100 } : item));
        setTimeout(startNextUpload, 50);
      },
      onError: (err) => {
        const errorMsg = err?.response?.data?.message || 'Upload failed';
        setQueue(prev => prev.map(item => item.id === pendingItem.id ? { ...item, status: 'error', errorMsg } : item));
        setTimeout(startNextUpload, 50);
      }
    });
  };

  const addFilesToQueue = (files) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      progress: 0,
      status: 'pending',
      abortController: new AbortController()
    }));

    const isCurrentlyUploading = queueRef.current.some(item => item.status === 'uploading');

    setQueue(prev => [...prev, ...newItems]);

    if (!isCurrentlyUploading) {
      setTimeout(startNextUpload, 50);
    }
  };

  const handleRetry = (id) => {
    const isCurrentlyUploading = queueRef.current.some(item => item.status === 'uploading');

    setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'pending', progress: 0, abortController: new AbortController() } : item));

    if (!isCurrentlyUploading) {
      setTimeout(startNextUpload, 50);
    }
  };

  const handleRemove = (id) => {
    const item = queue.find(q => q.id === id);
    if (item && item.status === 'uploading' && item.abortController) {
      item.abortController.abort();
    }
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const isUploading = queue.some(item => item.status === 'uploading');
  const allCompleted = queue.length > 0 && queue.every(item => item.status === 'success');

  // Auto-close modal after successful upload
  useEffect(() => {
    if (allCompleted) {
      const timer = setTimeout(() => {
        onClose();
      }, 2200); // Expanded slightly so user can enjoy the animated success tick
      return () => clearTimeout(timer);
    }
  }, [allCompleted, onClose]);

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
              {queue.length === 0 && (
                <motion.div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-9 text-center cursor-pointer transition-all duration-300 ${
                    dragActive
                      ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(26,115,232,0.2)]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 bg-slate-50/50 dark:bg-slate-950/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden"
                  />
                  
                  <motion.div
                    animate={dragActive ? { y: -5, scale: 1.12 } : { y: 0, scale: 1 }}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-premium rounded-2xl text-slate-450 dark:text-slate-500 mb-3 transition-shadow group-hover:shadow-md"
                  >
                    <UploadCloud className="w-8 h-8 text-primary" />
                  </motion.div>

                  <p className="text-sm font-bold text-slate-800 dark:text-slate-250">
                    Drag & Drop files here or <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-semibold">
                    Supports multiple uploads (PDFs, DOCs, Sheets, MP4s, ZIPs up to 1GB)
                  </p>
                </motion.div>
              )}

              {queue.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Queue</h4>
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
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.file.name}</p>
                            <p className="text-[10px] text-slate-455 font-semibold flex-shrink-0">{formatBytes(item.file.size)}</p>
                          </div>
                          
                          {item.statusText && (
                            <p className="text-[10px] text-primary font-bold animate-pulse mb-1 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-primary animate-ping"></span>
                              <span>{item.statusText}</span>
                            </p>
                          )}
                          
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
                          {item.status === 'success' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-success"
                            >
                              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
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
                          {item.status !== 'success' && (
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="p-1 hover:bg-red-500/10 hover:text-danger rounded-lg text-slate-450 transition-colors"
                              title={item.status === 'uploading' ? "Cancel upload" : "Remove from queue"}
                            >
                              {item.status === 'uploading' ? (
                                <X className="w-3.5 h-3.5" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
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
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex flex-col items-center justify-center p-6 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl text-center"
                >
                  <div className="mb-2.5">
                    <AnimatedCheck />
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-450">All uploads completed successfully!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Files have been indexed in your database.</p>
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
