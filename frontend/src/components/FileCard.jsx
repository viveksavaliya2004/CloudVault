import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, Video, Play,
  MoreVertical, Star, Pin, Lock, Workflow
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import JSZip from 'jszip';
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

// Smart subcomponent to generate realistic Word Document (.docx / .doc) thumbnails
const DynamicWordFallback = ({ file }) => {
  const titleClean = (file?.name || 'Document').replace(/\.(docx?|doc)$/i, '');

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-2 font-sans select-none overflow-hidden border border-blue-100 dark:border-blue-900/40">
      {/* Top Word Ribbon Header */}
      <div className="bg-[#185ABD] text-white p-1.5 -mx-2 -mt-2 mb-1 flex items-center justify-between rounded-t shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 bg-white text-[#185ABD] font-black text-[9px] rounded flex items-center justify-center shadow-2xs flex-shrink-0">
            W
          </div>
          <span className="text-[8.5px] font-bold truncate text-white tracking-wide">
            {titleClean}
          </span>
        </div>
        <span className="text-[6.5px] bg-blue-700/80 px-1 py-0.5 rounded font-mono font-semibold flex-shrink-0">
          DOCX
        </span>
      </div>

      {/* Word Page Content Area */}
      <div className="flex-1 space-y-1 px-0.5 text-[6.5px] text-slate-600 dark:text-slate-300">
        <div className="font-bold text-[8px] text-blue-950 dark:text-blue-200 border-b border-slate-100 dark:border-slate-800 pb-0.5 truncate">
          {titleClean}
        </div>
        
        {/* Paragraph text preview simulation lines */}
        <div className="space-y-1 text-slate-400 py-0.5">
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs w-full" />
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs w-11/12" />
          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-xs w-4/5" />
        </div>

        <div className="pt-0.5 space-y-0.5 text-[6px]">
          <div className="font-semibold text-blue-800 dark:text-blue-400">1. Executive Overview</div>
          <div className="pl-1 space-y-0.5 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="truncate">Project scope and specifications</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="truncate">Implementation deliverables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between text-[6.5px] text-slate-400">
        <span className="font-medium text-slate-500">Microsoft Word</span>
        <span className="font-bold text-blue-600">.DOCX</span>
      </div>
    </div>
  );
};

// Smart subcomponent to generate realistic ZIP / Archive file thumbnails
const DynamicZipFallback = ({ file }) => {
  const titleClean = (file?.name || 'Archive').replace(/\.(zip|rar|7z|gz|tar)$/i, '');
  const ext = ((file?.name || '').split('.').pop() || 'ZIP').toUpperCase();

  return (
    <div className="w-full h-full bg-slate-900 text-white rounded flex flex-col justify-between p-2 font-sans select-none overflow-hidden border border-amber-500/30">
      {/* Top Zip Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white p-1.5 -mx-2 -mt-2 mb-1 flex items-center justify-between rounded-t shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileArchive className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
          <span className="text-[8.5px] font-bold truncate text-amber-50 tracking-wide">
            {titleClean}
          </span>
        </div>
        <span className="text-[6.5px] bg-amber-900/90 text-amber-200 px-1 py-0.5 rounded font-mono font-bold flex-shrink-0">
          {ext}
        </span>
      </div>

      {/* Archive Files Tree Simulation */}
      <div className="flex-1 space-y-1 py-0.5 px-0.5 text-[6.5px] font-mono">
        <div className="flex items-center justify-between text-[6px] text-amber-400 font-bold border-b border-slate-800 pb-0.5">
          <span>ARCHIVE CONTENTS</span>
          <span>COMPRESSED</span>
        </div>
        
        <div className="space-y-0.5 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-semibold truncate">📁 {titleClean}/</span>
            <span className="text-slate-500">DIR</span>
          </div>
          <div className="flex items-center justify-between pl-2">
            <span className="text-slate-300 truncate">📄 document.docx</span>
            <span className="text-emerald-400 font-bold">2.4 MB</span>
          </div>
          <div className="flex items-center justify-between pl-2">
            <span className="text-slate-300 truncate">🖼️ preview.png</span>
            <span className="text-emerald-400 font-bold">850 KB</span>
          </div>
          <div className="flex items-center justify-between pl-2">
            <span className="text-slate-300 truncate">⚙️ setup.config</span>
            <span className="text-slate-400">12 KB</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 pt-1 flex items-center justify-between text-[6.5px]">
        <span className="text-amber-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          Compressed Archive
        </span>
        <span className="font-bold text-amber-400">.{ext}</span>
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

// Subcomponent to render Page 1 of any Word (.docx / .doc) Document as actual Thumbnail / Page HTML Preview
const DocxThumbnail = ({ docUrl, file, fallback }) => {
  const [htmlContent, setHtmlContent] = useState(null);
  const [thumbImgUrl, setThumbImgUrl] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    const extractDocxPreview = async () => {
      if (!docUrl) {
        if (isMounted) setStatus('error');
        return;
      }

      try {
        setStatus('loading');
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(docUrl, { headers });
        if (!response.ok) throw new Error('Failed to fetch docx file');

        const arrayBuffer = await response.arrayBuffer();

        // 1. Check if Word embedded an actual thumbnail image inside docProps/thumbnail.jpeg
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const thumbFile = zip.file('docProps/thumbnail.jpeg') || zip.file('docProps/thumbnail.wmf') || zip.file('docProps/thumbnail.png');
          
          if (thumbFile) {
            const base64 = await thumbFile.async('base64');
            const mime = thumbFile.name.endsWith('.wmf') ? 'image/wmf' : thumbFile.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
            if (isMounted) {
              setThumbImgUrl(`data:${mime};base64,${base64}`);
              setStatus('success');
              return;
            }
          }
        } catch (zipErr) {
          console.warn('Zip thumbnail extraction skipped:', zipErr?.message);
        }

        // 2. Convert actual DOCX Page 1 content (text, headings, tables, formatting) to HTML via mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (isMounted && result.value) {
          setHtmlContent(result.value);
          setStatus('success');
        } else if (isMounted) {
          setStatus('error');
        }
      } catch (err) {
        console.warn('Docx thumbnail error:', err?.message || err);
        if (isMounted) setStatus('error');
      }
    };

    extractDocxPreview();

    return () => {
      isMounted = false;
    };
  }, [docUrl]);

  if (status === 'error' || (!htmlContent && !thumbImgUrl && status !== 'loading')) {
    return fallback;
  }

  if (thumbImgUrl) {
    return (
      <img
        src={thumbImgUrl}
        alt={file?.name || 'Word Document'}
        className="w-full h-full object-cover object-top rounded-xl group-hover:scale-103 transition-all duration-300"
      />
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-2 font-sans select-none overflow-hidden border border-slate-200/80 dark:border-slate-800 relative">
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 text-slate-400 z-10">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
          <span className="text-[8px] font-medium">Loading Page 1...</span>
        </div>
      )}

      {/* Real Page 1 HTML preview container scaled down like a document page */}
      <div className="w-full flex-1 overflow-hidden pointer-events-none text-[7.5px] leading-snug text-slate-800 dark:text-slate-200 font-serif">
        <div
          className="prose prose-xs max-w-none space-y-1 [&_h1]:text-[10px] [&_h1]:font-bold [&_h1]:text-blue-900 [&_h1]:mb-1 [&_h2]:text-[9px] [&_h2]:font-semibold [&_h2]:text-blue-800 [&_p]:text-[7.5px] [&_p]:text-slate-700 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-2 [&_li]:text-[7px] [&_img]:max-h-16 [&_img]:object-contain [&_table]:border-collapse [&_td]:border [&_td]:p-0.5 [&_td]:text-[6px]"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between text-[6.5px] text-slate-400 mt-1 flex-shrink-0">
        <span className="font-semibold text-blue-700 dark:text-blue-400">Microsoft Word</span>
        <span className="font-bold text-blue-600">.DOCX</span>
      </div>
    </div>
  );
};

// Subcomponent to render real Video frame preview or video player thumbnail
const VideoThumbnail = ({ videoUrl, file, fallback }) => {
  const videoRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0.5; // Seek to 0.5 seconds for video frame preview
    }
  }, [videoUrl]);

  if (hasError || !videoUrl) {
    return fallback;
  }

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden group select-none rounded-xl">
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        muted
        playsInline
        onError={() => setHasError(true)}
        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Play Button Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 flex items-center justify-center transition-colors">
        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-4 h-4 fill-purple-600 dark:fill-purple-400 translate-x-0.5" />
        </div>
      </div>

      <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[7.5px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
        {file?.name?.split('.').pop()?.toUpperCase() || 'MP4'}
      </div>
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
    if (type === 'video' || ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'].includes(ext) || file.mimeType?.startsWith('video/')) {
      return { label: 'VIDEO', bgColor: 'bg-purple-600', textColor: 'text-white', icon: Video, accentColor: '#9333EA' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || type === 'zip') {
      return { label: 'ZIP', bgColor: 'bg-amber-600', textColor: 'text-white', icon: FileArchive, accentColor: '#D97706' };
    }
    if (['doc', 'docx'].includes(ext) || (type === 'document' && (ext === 'doc' || ext === 'docx'))) {
      return { label: 'WORD', bgColor: 'bg-blue-600', textColor: 'text-white', icon: FileText, accentColor: '#2563EB' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || (type === 'document' && file.name?.toLowerCase().includes('sheet'))) {
      return { label: 'XLS', bgColor: 'bg-emerald-700', textColor: 'text-white', icon: FileSpreadsheet, accentColor: '#059669' };
    }
    if (['drawio', 'diagram', 'vsdx'].includes(ext) || file.name?.toLowerCase().includes('diagram')) {
      return { label: 'DIAGRAM', bgColor: 'bg-amber-600', textColor: 'text-white', icon: Workflow, accentColor: '#D97706' };
    }
    if (type === 'document' || ['txt', 'rtf'].includes(ext)) {
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

  const getDocUrl = () => {
    if (file.url) return file.url;
    if (file.storagePath) return file.storagePath;
    if (file._id || file.id) return `${BACKEND_URL}/api/files/${file._id || file.id}/view`;
    return null;
  };

  const getVideoUrl = () => {
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
  const docUrl = getDocUrl();
  const videoUrl = getVideoUrl();
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const isImageType = file.type === 'image' || ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp'].includes(ext);
  const isVideoType = file.type === 'video' || ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'].includes(ext) || file.mimeType?.startsWith('video/');

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
        ) : isVideoType ? (
          <VideoThumbnail
            videoUrl={videoUrl}
            file={file}
            fallback={
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1.5 p-3 select-none">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-2xs">
                  <Video className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {ext.toUpperCase()} Video
                </span>
              </div>
            }
          />
        ) : file.type === 'pdf' || ext === 'pdf' ? (
          <PdfThumbnail
            pdfUrl={pdfUrl}
            fallback={<DynamicPdfFallback file={file} />}
          />
        ) : badgeInfo.label === 'WORD' || ['doc', 'docx'].includes(ext) ? (
          <DocxThumbnail
            docUrl={docUrl}
            file={file}
            fallback={
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-2.5 font-sans select-none overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <div className="font-bold text-[9px] text-slate-900 dark:text-slate-100 truncate pr-1">
                    {file.name.replace(/\.[^/.]+$/, '')}
                  </div>
                  <span className="text-[6.5px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded uppercase">
                    {ext || 'DOC'}
                  </span>
                </div>
                <div className="flex-1 py-2 space-y-1.5 opacity-60">
                  <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-full" />
                  <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-11/12" />
                  <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-4/5" />
                  <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-2/3" />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between text-[7px] text-slate-400">
                  <span>Document</span>
                  <span className="font-semibold text-blue-600">.{ext || 'doc'}</span>
                </div>
              </div>
            }
          />
        ) : badgeInfo.label === 'ZIP' || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ? (
          /* Clean ZIP Icon Symbol - No complex thumbnail generated for ZIP files */
          <div className="w-full h-full bg-slate-50 dark:bg-slate-900/60 flex flex-col items-center justify-center gap-1.5 p-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-2xs">
              <FileArchive className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {ext.toUpperCase()} Archive
            </span>
          </div>
        ) : (
          /* Clean Document Paper Preview with actual file title */
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded flex flex-col justify-between p-2.5 font-sans select-none overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between">
              <div className="font-bold text-[9px] text-slate-900 dark:text-slate-100 truncate pr-1">
                {file.name.replace(/\.[^/.]+$/, '')}
              </div>
              <span className="text-[6.5px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded uppercase">
                {ext || 'DOC'}
              </span>
            </div>
            <div className="flex-1 py-2 space-y-1.5 opacity-60">
              <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-full" />
              <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-11/12" />
              <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-4/5" />
              <div className="h-1 bg-slate-300 dark:bg-slate-700 rounded-xs w-2/3" />
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between text-[7px] text-slate-400">
              <span>Document</span>
              <span className="font-semibold text-blue-600">.{ext || 'doc'}</span>
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
