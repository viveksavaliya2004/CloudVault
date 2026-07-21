import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, FileText, Image as ImageIcon, Video,
  Music, File, HelpCircle, FileCode, Check, Copy,
  Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import api, { USE_MOCK } from '../services/api';
import { formatBytes } from '../services/mockData';

const FileViewerContext = createContext();

export const FileViewerProvider = ({ children }) => {
  const [viewedFile, setViewedFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const viewFile = (file) => {
    setViewedFile(file);
    setTextContent('');
    setImageZoom(1);
    setImageRotation(0);
    setIsFullscreen(false);
  };

  const closeViewer = () => {
    setViewedFile(null);
    setTextContent('');
    setImageZoom(1);
    setImageRotation(0);
    setIsFullscreen(false);
  };

  const getFileExtension = (filename) => {
    return (filename || '').split('.').pop()?.toLowerCase() || '';
  };

  const isTextOrCode = (file) => {
    if (!file) return false;
    const ext = getFileExtension(file.name);
    return ['txt', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'md', 'py', 'go', 'sh', 'xml', 'yaml', 'yml'].includes(ext) || file.type === 'document';
  };

  // Fetch text/code content if the file is previewable as text
  useEffect(() => {
    if (!viewedFile) return;

    const ext = getFileExtension(viewedFile.name);
    const isTxt = ['txt', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'md', 'py', 'go', 'sh', 'xml', 'yaml', 'yml'].includes(ext);

    if (isTxt && !USE_MOCK) {
      setLoadingText(true);
      api.get(`/files/${viewedFile.id}/view`, { responseType: 'text' })
        .then(res => {
          setTextContent(res.data);
          setLoadingText(false);
        })
        .catch(err => {
          console.error('Failed to load text file:', err);
          setTextContent('Failed to load document content. Please try downloading the file.');
          setLoadingText(false);
        });
    } else if (isTxt && USE_MOCK) {
      setLoadingText(true);
      setTimeout(() => {
        setTextContent(`// Mock File: ${viewedFile.name}\n// Size: ${formatBytes(viewedFile.size)}\n\nfunction initializeCloudVault() {\n  console.log("Welcome to secure cloud storage!");\n  return {\n    status: "online",\n    encrypted: true\n  };\n}\n\nexport default initializeCloudVault;`);
        setLoadingText(false);
      }, 500);
    }
  }, [viewedFile]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewedFile) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) setIsFullscreen(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewedFile]);

  const handleDownload = useCallback(() => {
    if (!viewedFile) return;

    if (USE_MOCK) {
      const blob = new Blob(['CloudVault Mock File Data'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = viewedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return;
    }

    const token = localStorage.getItem('accessToken');
    const a = document.createElement('a');
    a.href = `/api/files/${viewedFile.id}/download?token=${token}`;
    a.download = viewedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [viewedFile]);

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Get stream/view URL with auth token query parameter
  const getStreamUrl = () => {
    if (!viewedFile) return '';
    if (USE_MOCK) {
      if (viewedFile.type === 'image') {
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop';
      }
      if (viewedFile.type === 'video') {
        return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }
      if (viewedFile.type === 'audio') {
        return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      }
      if (viewedFile.type === 'pdf') {
        return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }
      return '';
    }
    const token = localStorage.getItem('accessToken');
    return `/api/files/${viewedFile.id}/view?token=${token}`;
  };

  const getFileIcon = (type) => {
    const iconClass = 'w-4 h-4 sm:w-5 sm:h-5';
    switch (type) {
      case 'image':
        return <ImageIcon className={`${iconClass} text-emerald-500`} />;
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'video':
        return <Video className={`${iconClass} text-violet-500`} />;
      case 'audio':
        return <Music className={`${iconClass} text-pink-500`} />;
      case 'zip':
        return <FileCode className={`${iconClass} text-amber-500`} />;
      default:
        return <File className={`${iconClass} text-slate-500`} />;
    }
  };

  const getLanguageLabel = (ext) => {
    const langMap = {
      js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX',
      json: 'JSON', html: 'HTML', css: 'CSS', md: 'Markdown',
      py: 'Python', go: 'Go', sh: 'Shell', xml: 'XML',
      yaml: 'YAML', yml: 'YAML', txt: 'Plain Text'
    };
    return langMap[ext] || ext.toUpperCase();
  };

  const renderContent = () => {
    if (!viewedFile) return null;

    const streamUrl = getStreamUrl();
    const extension = getFileExtension(viewedFile.name);

    // Check if it's text/code
    const isTxt = ['txt', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'md', 'py', 'go', 'sh', 'xml', 'yaml', 'yml'].includes(extension);

    if (isTxt) {
      if (loadingText) {
        return (
          <div className="flex flex-col items-center justify-center h-60 sm:h-80 text-slate-400">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs">Loading document contents...</p>
          </div>
        );
      }
      return (
        <div className="relative w-full h-full bg-slate-950 text-slate-200 rounded-xl overflow-hidden border border-slate-800 text-left font-mono text-xs flex flex-col">
          {/* Code header bar */}
          <div className="flex flex-wrap justify-between items-center bg-slate-900/80 backdrop-blur-sm px-3 sm:px-4 py-2 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                {getLanguageLabel(extension)}
              </span>
            </div>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-slate-800 text-[10px] cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          {/* Code body with line numbers */}
          <div className="overflow-auto flex-grow max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh]">
            <table className="w-full">
              <tbody>
                {textContent.split('\n').map((line, i) => (
                  <tr key={i} className="hover:bg-slate-900/50">
                    <td className="text-right pr-4 pl-3 py-0 text-slate-600 select-none w-[1%] whitespace-nowrap text-[10px]">
                      {i + 1}
                    </td>
                    <td className="pr-4 py-0 whitespace-pre-wrap break-all select-text selection:bg-primary/30 text-[11px] sm:text-xs">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    switch (viewedFile.type) {
      case 'image':
        return (
          <div className="relative flex justify-center items-center p-2 overflow-auto"
            style={{ maxHeight: isFullscreen ? '85vh' : '65vh' }}
          >
            <img
              src={streamUrl}
              alt={viewedFile.name}
              className="object-contain rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                maxWidth: '100%',
                maxHeight: isFullscreen ? '80vh' : '60vh',
              }}
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-2xl"
            style={{ height: isFullscreen ? '82vh' : 'clamp(300px, 60vh, 75vh)' }}
          >
            <iframe
              src={streamUrl}
              title={viewedFile.name}
              className="w-full h-full border-none"
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative flex justify-center items-center rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-900"
            style={{ maxHeight: isFullscreen ? '82vh' : '65vh' }}
          >
            <video
              src={streamUrl}
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: isFullscreen ? '80vh' : '60vh' }}
            />
          </div>
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-8 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 max-w-sm mx-auto shadow-xl">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-5 sm:p-6 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-full text-pink-500 border border-pink-500/20">
                <Music className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 text-center truncate w-full px-2">{viewedFile.name}</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6">{formatBytes(viewedFile.size)}</p>
            <audio
              src={streamUrl}
              controls
              autoPlay
              className="w-full max-w-[280px]"
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 max-w-sm mx-auto">
            <div className="p-4 bg-slate-100 dark:bg-slate-800/60 text-slate-400 rounded-2xl mb-5">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate w-full text-center">{viewedFile.name}</h4>
            <p className="text-[11px] text-slate-400 mt-1.5 mb-6 text-center leading-relaxed max-w-[260px]">
              Preview is not available for this file type. Download it to view on your device.
            </p>
            <button
              onClick={handleDownload}
              className="premium-button-primary py-2.5 px-6 flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        );
    }
  };

  // Determine if we should show image tools
  const showImageTools = viewedFile?.type === 'image';

  return (
    <FileViewerContext.Provider value={{ viewedFile, viewFile, closeViewer }}>
      {children}

      <AnimatePresence>
        {viewedFile && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeViewer}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className={`relative w-full z-10 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
                isFullscreen
                  ? 'max-w-[98vw] max-h-[96vh]'
                  : viewedFile.type === 'pdf' || viewedFile.type === 'video' || isTextOrCode(viewedFile)
                    ? 'max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh]'
                    : 'max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
                {/* File info */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2 sm:pr-4">
                  <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-shrink-0">
                    {getFileIcon(viewedFile.type)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[350px]" title={viewedFile.name}>
                      {viewedFile.name}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-medium">
                      {formatBytes(viewedFile.size)} • {viewedFile.owner?.name || 'Owner'}
                    </p>
                  </div>
                </div>

                {/* Actions toolbar */}
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  {/* Image-specific tools */}
                  {showImageTools && (
                    <>
                      <button
                        onClick={() => setImageZoom(z => Math.max(0.25, z - 0.25))}
                        className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="hidden sm:block text-[10px] text-slate-400 font-bold min-w-[36px] text-center tabular-nums">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                        className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImageRotation(r => r + 90)}
                        className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Rotate"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    </>
                  )}

                  {/* Fullscreen toggle */}
                  <button
                    onClick={() => setIsFullscreen(prev => !prev)}
                    className="hidden sm:flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={closeViewer}
                    className="flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Close Preview (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewport Content */}
              <div className="p-3 sm:p-4 md:p-5 overflow-y-auto flex-grow bg-slate-50/50 dark:bg-slate-950/20">
                {renderContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FileViewerContext.Provider>
  );
};

export const useFileViewer = () => {
  const context = useContext(FileViewerContext);
  if (context === undefined) {
    throw new Error('useFileViewer must be used within a FileViewerProvider');
  }
  return context;
};
export default FileViewerContext;
