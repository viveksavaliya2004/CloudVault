import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Image as ImageIcon, FileSpreadsheet,
  MoreVertical, Star, Pin, Lock, Workflow
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { BACKEND_URL } from '../services/api';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

// Smart subcomponent to generate realistic, unique PDF page previews tailored to each file
const DynamicPdfFallback = ({ file }) => {
  const name = (file?.name || 'Document').toLowerCase();
  const titleClean = (file?.name || 'Document').replace(/\.pdf$/i, '');

  // 1. Aadhaar / ID Card / Licence preview layout
  if (['aadhaar', 'id', 'card', 'dl', 'licence', 'license', 'pan', 'passport'].some(k => name.includes(k))) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-1 font-sans select-none overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 via-white to-emerald-600 h-2.5 rounded-t w-full flex items-center justify-between px-1 shadow-2xs">
          <span className="text-[6px] font-bold text-slate-800 tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="text-[5px] font-extrabold text-slate-700">UIDAI</span>
        </div>

        <div className="py-1 px-0.5 flex-1 flex flex-col justify-between">
          <div className="flex items-start gap-1">
            <div className="w-7 h-8 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <div className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-500" />
            </div>
            <div className="min-w-0 flex-1 text-[7px] text-slate-700 dark:text-slate-200 leading-tight space-y-0.5">
              <div className="font-bold truncate text-[7.5px] text-slate-900 dark:text-white">{titleClean}</div>
              <div className="text-[6px] text-slate-500">DOB: 12/08/2004</div>
              <div className="text-[5.5px] text-slate-400 truncate">ID: 8932 **** ****</div>
            </div>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 flex items-center justify-center px-1 my-0.5">
            <div className="h-1.5 w-full bg-slate-800/40 rounded-xs" />
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-0.5 flex items-center justify-between text-[6px] text-slate-400">
          <span>Identity Document</span>
          <span className="font-bold text-red-600">PDF</span>
        </div>
      </div>
    );
  }

  // 2. Marksheet / Examination Result preview layout
  if (['marksheet', '10', '12', 'result', 'board', 'grade', 'score', 'certificate'].some(k => name.includes(k))) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-1 font-sans select-none overflow-hidden border border-slate-200/80">
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-0.5">
          <div className="text-[7px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-tight truncate">
            GUJARAT EDUCATION BOARD
          </div>
          <div className="text-[5.5px] font-semibold text-slate-500">STATEMENT OF MARKS</div>
        </div>

        <div className="py-0.5 flex-1 flex flex-col justify-between text-[6px]">
          <div className="font-semibold text-[7px] text-slate-800 dark:text-slate-200 truncate">{titleClean}</div>

          <div className="border border-slate-300 dark:border-slate-700 rounded overflow-hidden my-0.5">
            <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 text-[5.5px] font-bold text-slate-600 dark:text-slate-300 p-0.5 border-b">
              <span>SUBJECT</span>
              <span>MAX</span>
              <span>OBT</span>
              <span>GRADE</span>
            </div>
            <div className="grid grid-cols-4 text-[5px] p-0.5 text-slate-600 dark:text-slate-400 border-b border-slate-100">
              <span className="truncate">ENGLISH</span>
              <span>100</span>
              <span className="font-bold text-slate-800">088</span>
              <span className="text-emerald-600 font-bold">A1</span>
            </div>
            <div className="grid grid-cols-4 text-[5px] p-0.5 text-slate-600 dark:text-slate-400">
              <span className="truncate font-semibold">MATHS</span>
              <span>100</span>
              <span className="font-bold text-slate-800">095</span>
              <span className="text-emerald-600 font-bold">A1</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-0.5 flex items-center justify-between text-[6px] text-slate-400">
          <span className="font-semibold text-emerald-700">PASS - FIRST CLASS</span>
          <span className="font-bold text-red-600">PDF</span>
        </div>
      </div>
    );
  }

  // 3. Resume / CV preview layout
  if (['resume', 'cv', 'savaliya', 'bio', 'profile', 'job'].some(k => name.includes(k))) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-1.5 font-sans select-none overflow-hidden">
        <div>
          <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">
            <div className="font-extrabold text-[8.5px] text-slate-900 dark:text-white truncate">
              {titleClean.toUpperCase()}
            </div>
            <div className="text-[6px] text-slate-500 font-medium">Software Engineer • Developer</div>
          </div>

          <div className="pt-1 space-y-0.5 text-[6px] text-slate-600 dark:text-slate-300">
            <div>
              <div className="font-bold text-[7px] text-blue-900 dark:text-blue-300">Education</div>
              <div className="text-[5.5px] text-slate-400 pl-1">• B.Tech Computer Science</div>
            </div>
            <div>
              <div className="font-bold text-[7px] text-blue-900 dark:text-blue-300">Experience</div>
              <div className="text-[5.5px] text-slate-400 pl-1">• Full Stack Web Developer</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-0.5 flex items-center justify-between text-[6px] text-slate-400">
          <span>Curriculum Vitae</span>
          <span className="font-bold text-red-600">PDF</span>
        </div>
      </div>
    );
  }

  // 4. Dynamic PDF preview sheet generated uniquely for filename
  const strHash = titleClean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sections = [
    ['Executive Overview', 'Key Architecture & Deliverables', 'System Specifications'],
    ['1. Introduction & Objectives', '2. Core Implementation Strategy', '3. Next Steps & Timeline'],
    ['Database Schema Definition', 'API Endpoints & Integration', 'Security & Access Protocols']
  ];
  const sectionList = sections[strHash % sections.length];

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-1.5 font-sans select-none overflow-hidden">
      <div>
        <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5 flex items-center justify-between">
          <div className="font-bold text-[8px] text-slate-900 dark:text-white truncate flex-1 pr-1">
            {titleClean}
          </div>
          <div className="w-2.5 h-2.5 bg-red-600 rounded text-[5px] text-white font-bold flex items-center justify-center">
            PDF
          </div>
        </div>

        <div className="pt-1 space-y-0.5 text-[6px] text-slate-600 dark:text-slate-300">
          <div className="font-bold text-[7px] text-slate-800 dark:text-slate-200">
            {sectionList[0]}
          </div>
          <div className="text-[6px] text-slate-400 space-y-0.5 pl-1">
            <div>• {sectionList[1]}</div>
            <div>• {sectionList[2]}</div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-0.5 flex items-center justify-between text-[6px] text-slate-400">
        <span>CloudVault PDF</span>
        <span className="font-bold text-red-600">PDF</span>
      </div>
    </div>
  );
};

// Subcomponent to render Page 1 of any PDF as actual Canvas Thumbnail
const PdfThumbnail = ({ pdfUrl, fallback }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const renderPdfThumbnail = async () => {
      try {
        setStatus('loading');
        let arrayBuffer = null;

        if (pdfUrl) {
          try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(pdfUrl, { headers });
            if (res.ok) {
              arrayBuffer = await res.arrayBuffer();
            }
          } catch (fetchErr) {
            console.warn('PDF fetch URL error:', fetchErr);
          }
        }

        let loadingTask;
        if (arrayBuffer) {
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (pdfUrl && !pdfUrl.startsWith('/api/') && !pdfUrl.includes('/api/')) {
          loadingTask = pdfjsLib.getDocument(pdfUrl);
        } else {
          loadingTask = pdfjsLib.getDocument(SAMPLE_PDF_DATA_URL);
        }

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const desiredWidth = 280;
        const scale = desiredWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        if (isMounted) {
          setStatus('success');
        }
      } catch (err) {
        console.warn('PDF page 1 thumbnail render fallback:', err?.message || err);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    renderPdfThumbnail();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  if (status === 'error') {
    return fallback;
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-0 relative overflow-hidden select-none">
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 text-slate-400 z-10">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-1" />
          <span className="text-[8px] font-medium">Loading...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover object-top rounded-xl group-hover:scale-103 transition-all duration-300 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export const FileCard = ({ file, onContextMenu, onDoubleClick, badge }) => {
  const [imageError, setImageError] = useState(false);

  const handleRightClick = (e) => {
    e.preventDefault();
    onContextMenu?.(e, file);
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    onContextMenu?.(e, file);
  };

  const getFileTypeBadge = () => {
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const type = file.type || '';

    if (type === 'pdf' || ext === 'pdf') {
      return { label: 'PDF', bgColor: 'bg-red-600', textColor: 'text-white', icon: FileText, accentColor: '#EF4444' };
    }
    if (type === 'image' || ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(ext)) {
      return { label: 'IMG', bgColor: 'bg-emerald-600', textColor: 'text-white', icon: ImageIcon, accentColor: '#10B981' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || (type === 'document' && file.name?.toLowerCase().includes('sheet'))) {
      return { label: 'XLS', bgColor: 'bg-emerald-700', textColor: 'text-white', icon: FileSpreadsheet, accentColor: '#059669' };
    }
    if (['drawio', 'diagram', 'vsdx'].includes(ext) || file.name?.toLowerCase().includes('diagram')) {
      return { label: 'DIAGRAM', bgColor: 'bg-amber-600', textColor: 'text-white', icon: Workflow, accentColor: '#D97706' };
    }
    if (type === 'document' || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return { label: 'DOC', bgColor: 'bg-blue-600', textColor: 'text-white', icon: FileText, accentColor: '#2563EB' };
    }
    return { label: 'FILE', bgColor: 'bg-blue-600', textColor: 'text-white', icon: FileText, accentColor: '#2563EB' };
  };

  const badgeInfo = getFileTypeBadge();
  const BadgeIcon = badgeInfo.icon;

  const getImageUrl = () => {
    if (file.url) return file.url;
    if (file.thumbnail) return file.thumbnail;
    if (file.thumbnailPath) return file.thumbnailPath;
    if (file.storagePath && file.type === 'image') return file.storagePath;
    return null;
  };

  const getPdfUrl = () => {
    if (file.url) return file.url;
    if (file.storagePath) return file.storagePath;
    if (file._id || file.id) return `${BACKEND_URL}/api/files/${file._id || file.id}/view`;
    return null;
  };

  const getPngThumbnailUrl = () => {
    const thumb = file.thumbnailUrl || file.thumbnailPath || file.thumbnail;
    if (thumb && (thumb.includes('/uploads/thumbnails/') || ['png', 'jpg', 'jpeg', 'webp'].some(ext => thumb.toLowerCase().endsWith(ext)))) {
      return thumb;
    }
    return null;
  };

  const pngThumbUrl = getPngThumbnailUrl();
  const imageUrl = getImageUrl();
  const pdfUrl = getPdfUrl();
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const isImageType = file.type === 'image' || ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(ext);

  const formattedDate = new Date(file.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onContextMenu={handleRightClick}
      onDoubleClick={() => onDoubleClick?.(file)}
      className="bg-[#f0f4f9] dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer group relative text-left select-none min-h-[220px]"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-6 h-6 ${badgeInfo.bgColor} text-white rounded-md flex items-center justify-center flex-shrink-0 shadow-2xs`}>
            <BadgeIcon className="w-3.5 h-3.5" />
          </div>
          <h4
            className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors"
            title={file.name}
          >
            {file.name}
          </h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {file.isPinned && <Pin className="w-3 h-3 text-primary rotate-45" />}
          {file.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
          {file.isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
          {badge}
          <button
            onClick={handleOptionsClick}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MIDDLE PREVIEW CONTAINER (Google Drive Exact Fit Thumbnail Frame) */}
      <div className="relative w-full h-36 bg-white dark:bg-slate-850 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex items-center justify-center select-none group-hover:shadow-sm transition-all p-0">
        {pngThumbUrl && !imageError ? (
          <img
            src={pngThumbUrl}
            alt={file.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top rounded-xl group-hover:scale-103 transition-transform duration-300"
          />
        ) : isImageType && imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={file.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top rounded-xl group-hover:scale-103 transition-transform duration-300"
          />
        ) : file.type === 'pdf' || ext === 'pdf' ? (
          <PdfThumbnail
            pdfUrl={pdfUrl}
            fallback={<DynamicPdfFallback file={file} />}
          />
        ) : badgeInfo.label === 'DIAGRAM' ? (
          <div className="w-full h-full p-2.5 flex flex-col justify-between text-[8px] text-slate-500">
            <div className="font-semibold text-[9px] text-slate-800 dark:text-slate-100 truncate border-b pb-0.5">
              {file.name}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-1 py-1.5 items-center justify-center">
              <div className="p-1 border border-amber-400 bg-amber-50 rounded text-center text-[7px] font-medium text-amber-700">Start</div>
              <div className="h-0.5 bg-slate-300 w-full" />
              <div className="p-1 border border-blue-400 bg-blue-50 rounded text-center text-[7px] font-medium text-blue-700">Process</div>
            </div>
            <div className="text-[7px] text-slate-400 text-right">Diagram</div>
          </div>
        ) : (
          <div className="w-full h-full p-2.5 flex flex-col justify-between text-[8px] text-slate-600 dark:text-slate-300 font-sans leading-tight">
            <div className="space-y-1">
              <div className="font-bold text-[9.5px] text-slate-900 dark:text-slate-100 truncate border-b border-slate-100 dark:border-slate-800 pb-1">
                {file.name.replace(/\.[^/.]+$/, '')}
              </div>
              <div className="font-semibold text-[8px] text-slate-700 dark:text-slate-200 pt-0.5">
                CloudVault - Enterprise Platform
              </div>
              <div className="text-[7.5px] text-slate-400 space-y-0.5">
                <div>An enterprise-grade file management platform.</div>
                <div className="font-medium text-slate-600 dark:text-slate-300 pt-0.5">Tech Stack</div>
                <div>• Node.js / Express / MongoDB</div>
                <div>• React / Tailwind CSS</div>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[7px] text-slate-400">
              <span>Google Docs Document</span>
              <span className="font-semibold text-blue-600">DOC</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#0b57d0] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-2xs">
            {(file.owner?.name || 'V').charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-slate-600 dark:text-slate-400 font-medium text-[11px]">
            You opened • {formattedDate}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default FileCard;
