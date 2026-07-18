import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Link2, Calendar, Lock, ShieldAlert, Trash2, Check, Copy } from 'lucide-react';
import { useShareFileMutation, useFileSharesQuery, useRevokeShareMutation } from '../hooks/useFiles';
import { formatBytes } from '../services/mockData';

export const ShareModal = ({ isOpen, onClose, file }) => {
  const [activeTab, setActiveTab] = useState('people');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: shares = [], refetch } = useFileSharesQuery(file?.id);
  const shareMutation = useShareFileMutation();
  const revokeMutation = useRevokeShareMutation(file?.id);

  // Find if there is an active public share
  const publicShare = shares.find(s => s.sharedWith === null);

  useEffect(() => {
    if (publicShare) {
      setIsPublic(true);
      setExpiresAt(publicShare.expiresAt ? new Date(publicShare.expiresAt).toISOString().split('T')[0] : '');
    } else {
      setIsPublic(false);
      setExpiresAt('');
      setPassword('');
    }
  }, [publicShare, isOpen]);

  const handleShareWithPerson = (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    shareMutation.mutate({
      id: file.id,
      data: {
        email: email.trim(),
        permission,
        isPublic: false
      }
    }, {
      onSuccess: () => {
        setEmail('');
        refetch();
      }
    });
  };

  const handleTogglePublicShare = () => {
    if (isPublic && publicShare) {
      // Revoke the public share link
      revokeMutation.mutate(publicShare._id, {
        onSuccess: () => {
          setIsPublic(false);
          refetch();
        }
      });
    } else {
      // Create a public share link
      shareMutation.mutate({
        id: file.id,
        data: {
          isPublic: true,
          permission: 'read',
          expiresAt: expiresAt || null,
          password: password || null
        }
      }, {
        onSuccess: () => {
          setIsPublic(true);
          refetch();
        }
      });
    }
  };

  const handleUpdatePublicSettings = (e) => {
    e.preventDefault();
    shareMutation.mutate({
      id: file.id,
      data: {
        isPublic: true,
        permission: 'read',
        expiresAt: expiresAt || null,
        password: password || null
      }
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleCopyLink = () => {
    if (!publicShare) return;
    const link = `${window.location.origin}/shared/public/${publicShare._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (shareId) => {
    revokeMutation.mutate(shareId, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  if (!file) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slateBg-darker/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-10 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
                  Share "{file.name}"
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Size: {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Toggles */}
            <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 px-3">
              <button
                onClick={() => setActiveTab('people')}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'people'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Share with People</span>
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'public'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Public Link</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {activeTab === 'people' ? (
                <div className="space-y-4">
                  {/* Enter Email Form */}
                  <form onSubmit={handleShareWithPerson} className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="email"
                        placeholder="Add friend's email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-3 pr-20 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-semibold"
                        required
                      />
                      <div className="absolute right-1.5 top-1.5">
                        <select
                          value={permission}
                          onChange={(e) => setPermission(e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                        >
                          <option value="read">Viewer</option>
                          <option value="write">Editor</option>
                          <option value="edit">Owner</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={shareMutation.isPending}
                      className="premium-button-primary px-3 text-xs flex-shrink-0"
                    >
                      Share
                    </button>
                  </form>

                  {/* List of active shares */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">People with access</h4>
                    
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {/* Owner list */}
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {file.owner?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {file.owner?.name || 'You'} (Owner)
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Owner of the file</p>
                          </div>
                        </div>
                      </div>

                      {/* Shares list */}
                      {shares.filter(s => s.sharedWith !== null).map(share => (
                        <div key={share._id} className="flex items-center justify-between py-1 group">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
                              {share.sharedWith?.name?.charAt(0) || 'U'}
                            </span>
                            <div className="min-w-0 max-w-[200px]">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {share.sharedWith?.name || 'User'}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate">{share.sharedWith?.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg text-slate-505 font-bold capitalize">
                              {share.permission === 'read' ? 'Viewer' : share.permission === 'write' ? 'Editor' : 'Co-owner'}
                            </span>
                            <button
                              onClick={() => handleRevoke(share._id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Revoke access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {shares.filter(s => s.sharedWith !== null).length === 0 && (
                        <p className="text-[10px] text-slate-400 italic py-2">No users have private access to this file yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Public Link Toggle Card */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${isPublic ? 'bg-primary/10 text-primary' : 'bg-slate-200/50 dark:bg-slate-850 text-slate-400'}`}>
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Public Link Access</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          {isPublic ? 'Anyone with link can view/download' : 'Link access is disabled'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePublicShare}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-all duration-350 cursor-pointer ${
                        isPublic ? 'bg-primary justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.span layout className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  {isPublic && publicShare ? (
                    <motion.form
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleUpdatePublicSettings}
                      className="space-y-4 text-left"
                    >
                      {/* Public URL string copy area */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/shared/public/${publicShare._id}`}
                          className="flex-grow px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] bg-slate-50 dark:bg-slate-950/40 text-slate-505 select-all font-semibold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                          title="Copy Link"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500 animate-pulse" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                          Expiry Date (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary font-semibold"
                          />
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                      </div>

                      {/* Password Protection */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                          Password Protection (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter access password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary font-semibold"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={shareMutation.isPending}
                        className="premium-button-primary w-full py-2.5 text-xs font-bold"
                      >
                        Update Link Rules
                      </button>
                    </motion.form>
                  ) : (
                    <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <ShieldAlert className="w-8 h-8 text-slate-350 dark:text-slate-600 mb-2" />
                      <p className="text-xs font-bold text-slate-505">Link Sharing Inactive</p>
                      <p className="text-[10px] text-slate-400 max-w-[240px] mt-1 font-semibold leading-relaxed">
                        Toggle public link above to generate a unique view/download URL.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={onClose}
                className="premium-button-secondary py-2 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
