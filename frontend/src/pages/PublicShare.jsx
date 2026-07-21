import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, FileText, Lock, AlertTriangle, ShieldCheck, ArrowRight,
  Image as ImageIcon, Video, Music, File,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2
} from 'lucide-react';
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

  // Text preview state
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  // Zoom & fullscreen state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isImage = fileInfo?.mimeType?.startsWith('image/');
  const isPdf = fileInfo?.mimeType === 'application/pdf';
  const isVideo = fileInfo?.mimeType?.startsWith('video/');
  const isAudio = fileInfo?.mimeType?.startsWith('audio/');
  const isText = fileInfo?.mimeType?.startsWith('text/') ||
    ['.txt', '.js', '.json', '.html', '.css', '.md'].includes(fileInfo?.extension);
  const hasPreview = isImage || isPdf || isVideo || isAudio || isText;

  const previewUrl = `/api/files/shared/public/${shareId}/download?password=${encodeURIComponent(password)}&inline=true`;

  useEffect(() => {
    if (isText && (passwordVerified || !isProtected)) {
      const fetchText = async () => {
        try {
          setTextLoading(true);
          const res = await fetch(previewUrl);
          const text = await res.text();
          setTextContent(text);
        } catch {
          setTextContent('Failed to load text preview.');
        } finally {
          setTextLoading(false);
        }
      };
      fetchText();
    }
  }, [isText, passwordVerified, isProtected, previewUrl]);

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
    const url = `/api/files/shared/public/${shareId}/download?password=${encodeURIComponent(password)}`;

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

  const getFileIcon = () => {
    const cls = 'w-5 h-5';
    if (isImage) return <ImageIcon className={`${cls} text-emerald-500`} />;
    if (isPdf) return <FileText className={`${cls} text-red-500`} />;
    if (isVideo) return <Video className={`${cls} text-violet-500`} />;
    if (isAudio) return <Music className={`${cls} text-pink-500`} />;
    return <File className={`${cls} text-primary`} />;
  };

  const getFileTypeLabel = () => {
    if (isImage) return 'Image';
    if (isPdf) return 'PDF Document';
    if (isVideo) return 'Video';
    if (isAudio) return 'Audio';
    if (isText) return 'Text File';
    return 'File';
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Loader size="lg" />
        <p className="text-xs font-bold text-slate-500 mt-4 animate-pulse">Loading sharing details...</p>
      </div>
    );
  }

  // Unlocked and ready to show preview
  const showPreview = !error && (passwordVerified || !isProtected);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/3 pointer-events-none" />
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/8 dark:bg-primary/3 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-48 h-48 rounded-full bg-violet-500/8 dark:bg-violet-500/3 blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-tr from-primary to-violet-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-primary/20">
            CV
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-white">CloudVault</span>
            <span className="text-[10px] text-slate-400 font-semibold ml-2">Secure Sharing</span>
          </div>
        </div>
        {showPreview && (
          <button
            onClick={handleDownload}
            className="premium-button-primary py-2 px-4 sm:px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-3 sm:p-6 md:p-8">
        {error ? (
          /* Error State */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Access Denied</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-semibold">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="premium-button-secondary text-xs font-semibold px-5 py-2.5 mt-5 cursor-pointer"
            >
              Retry
            </button>
          </motion.div>

        ) : isProtected && !passwordVerified ? (
          /* Password Protection Screen */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-8 text-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Password Required</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1.5">
              Shared by <span className="font-bold text-slate-600 dark:text-slate-300">{ownerName || 'someone'}</span>
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 mt-6 text-left">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter access password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary font-semibold"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {passwordError && (
                <p className="text-[10px] text-red-500 font-bold px-1">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="premium-button-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {verifying ? 'Verifying...' : 'Unlock File'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>

        ) : (
          /* Unlocked File View — Full Width Preview */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full ${hasPreview ? (isFullscreen ? 'max-w-[98vw]' : 'max-w-5xl') : 'max-w-md'} transition-all duration-300`}
          >
            {/* Preview Panel */}
            {hasPreview && (
              <div className="w-full">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                  {/* Preview header bar */}
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0">
                        {getFileIcon()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate" title={fileInfo?.name}>
                          {fileInfo?.name}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                          {getFileTypeLabel()} • {formatBytes(fileInfo?.size || 0)} • Shared by {ownerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      {/* Image zoom/rotate tools */}
                      {isImage && (
                        <>
                          <button
                            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                            className="hidden sm:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <span className="hidden sm:block text-[10px] text-slate-500 font-bold min-w-[36px] text-center tabular-nums select-none">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                            className="hidden sm:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRotation(r => r + 90)}
                            className="hidden sm:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                        </>
                      )}

                      {/* Fullscreen toggle */}
                      <button
                        onClick={() => setIsFullscreen(f => !f)}
                        className="hidden sm:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>

                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md ml-1">
                        <ShieldCheck className="w-3 h-3" />
                        Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Preview content */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/30">
                    {isImage && (
                      <div className="flex items-center justify-center p-3 sm:p-4 overflow-auto" style={{ minHeight: '200px', maxHeight: isFullscreen ? '85vh' : '75vh' }}>
                        <img
                          src={previewUrl}
                          alt={fileInfo?.name}
                          className="object-contain rounded-lg shadow-md transition-transform duration-200"
                          style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            maxWidth: '100%',
                            maxHeight: isFullscreen ? '80vh' : '70vh',
                          }}
                        />
                      </div>
                    )}

                    {isPdf && (
                      <div className="w-full" style={{ height: isFullscreen ? '85vh' : 'clamp(350px, 75vh, 800px)' }}>
                        <iframe src={previewUrl} className="w-full h-full border-none" title={fileInfo?.name} />
                      </div>
                    )}

                    {isVideo && (
                      <div className="w-full bg-black flex items-center justify-center">
                        <video controls className="w-full" style={{ maxHeight: '75vh' }} src={previewUrl} />
                      </div>
                    )}

                    {isAudio && (
                      <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-6">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
                          <div className="relative p-5 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-full text-pink-500 border border-pink-500/20">
                            <Music className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                        </div>
                        <audio controls className="w-full max-w-sm" src={previewUrl} />
                      </div>
                    )}

                    {isText && (
                      <div className="overflow-auto bg-slate-950 text-slate-200 font-mono text-[11px] sm:text-xs" style={{ maxHeight: '70vh' }}>
                        {textLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Loading preview...</span>
                          </div>
                        ) : (
                          <table className="w-full">
                            <tbody>
                              {textContent.split('\n').map((line, i) => (
                                <tr key={i} className="hover:bg-slate-900/50">
                                  <td className="text-right pr-4 pl-3 py-0 text-slate-600 select-none w-[1%] whitespace-nowrap text-[10px]">
                                    {i + 1}
                                  </td>
                                  <td className="pr-4 py-0 whitespace-pre-wrap break-all select-text text-[11px]">
                                    {line || ' '}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback for non-previewable files */}
            {!hasPreview && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xl p-8 text-center">
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 text-slate-400 rounded-2xl mx-auto w-fit mb-5">
                  {getFileIcon()}
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{fileInfo?.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 mb-1">
                  {formatBytes(fileInfo?.size || 0)} • Shared by {ownerName}
                </p>
                <p className="text-[10px] text-slate-400 mb-6">
                  Preview not available. Download to view this file.
                </p>
                <button
                  onClick={handleDownload}
                  className="premium-button-primary py-3 px-6 text-xs font-bold flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PublicShare;
