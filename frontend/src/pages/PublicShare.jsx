import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, File, Lock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiService, USE_MOCK } from '../services/api';
import { formatBytes } from '../services/mockData';
import { Loader } from '../components/UI';

export const PublicShare = () => {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  
  // Password state
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchShareDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.shared.getPublicInfo(shareId);
        const data = response.data.data;
        
        setFileInfo(data.file);
        setOwnerName(data.ownerName);
        setIsProtected(data.isPasswordProtected);
        
        // If mock, simulate lock bypass if wrong password is not submitted
        if (USE_MOCK && !data.isPasswordProtected) {
          setPasswordVerified(true);
        }
      } catch (err) {
        console.error(err);
        const msg = err?.response?.data?.message || 'Shared link not found or has been revoked.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchShareDetails();
  }, [shareId]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    try {
      setVerifying(true);
      setPasswordError('');
      
      await apiService.shared.verifyPublicPassword(shareId, password);
      
      setPasswordVerified(true);
    } catch (err) {
      console.error(err);
      setPasswordError('Incorrect password. Access denied.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    // Generate absolute endpoint URL and trigger browser native download
    const url = `/api/files/shared/public/${shareId}/download?password=${encodeURIComponent(password)}`;
    
    // In mock mode, alert success
    if (USE_MOCK) {
      const blob = new Blob(['CloudVault Mock Shared File Data'], { type: 'text/plain' });
      const mockUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = mockUrl;
      a.download = fileInfo?.name || 'mock_file.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(mockUrl);
      return;
    }
    
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slateBg-light dark:bg-slateBg-darker p-4">
        <Loader size="lg" />
        <p className="text-xs font-bold text-slate-500 mt-4 animate-pulse">Loading sharing details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slateBg-light dark:bg-slateBg-darker p-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden p-8 text-center"
      >
        <div className="flex flex-col items-center">
          {/* Logo / Header */}
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black mb-4">
            CV
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">CloudVault Sharing</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Day 10 Access Point</p>
          
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800/80 my-6" />

          {error ? (
            /* Error State (revoked or expired link) */
            <div className="space-y-4 py-4 w-full">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Access Denied</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
                  {error}
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="premium-button-secondary text-xs font-semibold px-4 py-2 mt-2"
              >
                Retry
              </button>
            </div>
          ) : isProtected && !passwordVerified ? (
            /* Password Protection Screen */
            <div className="w-full space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Password Required</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  Shared by {ownerName || 'someone'}
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5 mt-4">
                <div className="relative text-left">
                  <input
                    type="password"
                    placeholder="Enter access password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary font-semibold"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                {passwordError && (
                  <p className="text-[10px] text-red-500 font-bold text-left px-1">{passwordError}</p>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="premium-button-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {verifying ? 'Verifying...' : 'Unlock File'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* File Download Landing screen */
            <div className="w-full space-y-6">
              {/* File Info Card */}
              <div className="flex items-center gap-3.5 p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-left">
                <div className="p-3 bg-primary/10 text-primary rounded-xl flex-shrink-0">
                  <File className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-grow">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">
                    {fileInfo?.name || 'Shared File'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Size: {formatBytes(fileInfo?.size || 0)}
                  </p>
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 py-1.5 px-3 rounded-xl justify-center">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified CloudVault Encryption Shield</span>
              </div>

              {/* Owner attribution */}
              <p className="text-xs text-slate-450 font-semibold">
                Uploaded and shared by <span className="font-bold text-slate-800 dark:text-slate-200">{ownerName}</span>
              </p>

              {/* Download Action */}
              <button
                onClick={handleDownload}
                className="premium-button-primary w-full py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 animate-pulse hover:animate-none"
              >
                <Download className="w-4 h-4" />
                <span>Download Now</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PublicShare;
