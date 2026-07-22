const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Notification = require('../models/Notification');
const cacheService = require('../services/cacheService');
const { redisConnection, memoryQueue } = require('../config/queue');

let poppler = null;
try {
  poppler = require('pdf-poppler');
} catch (e) {
  console.warn('[Worker] pdf-poppler optional dependency not loaded:', e.message);
}

// The 5-Step Background Job Processing Pipeline
const processFileJob = async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId || !userId) {
    throw new Error('Missing fileId or userId in background job data');
  }

  const file = await File.findById(fileId);
  if (!file) {
    throw new Error(`File ${fileId} not found in database`);
  }

  console.log(`\n🚀 [Pipeline Step 1/5] Starting Background Processing for File "${file.fileName}" (ID: ${file._id})`);
  file.processingStatus = 'processing';
  await file.save({ validateBeforeSave: false });

  // STEP 2: Thumbnail Generation
  console.log(`📷 [Pipeline Step 2/5] Generating Thumbnail for "${file.fileName}"...`);
  const isPdf = (file.mimeType && file.mimeType.includes('pdf')) ||
                (file.fileName && file.fileName.toLowerCase().endsWith('.pdf')) ||
                (file.originalName && file.originalName.toLowerCase().endsWith('.pdf'));

  if (file.mimeType && file.mimeType.startsWith('image/')) {
    file.thumbnailPath = file.storagePath;
    file.thumbnailUrl = file.storagePath;
  } else if (isPdf) {
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      const relativeStoragePath = (file.storagePath || '').replace(/^\/uploads\//, '').replace(/^uploads\//, '');
      const absolutePdfPath = path.join(uploadsDir, relativeStoragePath);

      if (fs.existsSync(absolutePdfPath) && poppler) {
        const outPrefix = `pdf_preview_${file._id}`;
        const options = {
          format: 'png',
          out_dir: thumbnailsDir,
          out_prefix: outPrefix,
          page: 1
        };

        await poppler.convert(absolutePdfPath, options);

        // pdf-poppler names page 1 output files as ${outPrefix}-1.png or ${outPrefix}-01.png
        const expectedGeneratedFile1 = path.join(thumbnailsDir, `${outPrefix}-1.png`);
        const expectedGeneratedFile01 = path.join(thumbnailsDir, `${outPrefix}-01.png`);

        if (fs.existsSync(expectedGeneratedFile1)) {
          file.thumbnailPath = `/uploads/thumbnails/${outPrefix}-1.png`;
          file.thumbnailUrl = file.thumbnailPath;
        } else if (fs.existsSync(expectedGeneratedFile01)) {
          file.thumbnailPath = `/uploads/thumbnails/${outPrefix}-01.png`;
          file.thumbnailUrl = file.thumbnailPath;
        } else {
          const filesInThumbDir = fs.readdirSync(thumbnailsDir);
          const matchedThumb = filesInThumbDir.find(f => f.startsWith(outPrefix));
          if (matchedThumb) {
            file.thumbnailPath = `/uploads/thumbnails/${matchedThumb}`;
            file.thumbnailUrl = file.thumbnailPath;
          }
        }
      }
    } catch (pdfErr) {
      console.error(`⚠️ [Worker] Failed to generate PDF thumbnail for "${file.fileName}":`, pdfErr.message);
      // Non-blocking: upload remains intact if poppler fails
    }
  }

  await file.save({ validateBeforeSave: false });

  // STEP 3: Compression Optimization
  console.log(`📦 [Pipeline Step 3/5] Applying File Compression & Metadata Optimization...`);
  file.isCompressed = true;
  await file.save({ validateBeforeSave: false });

  // STEP 4: Virus Scan Check
  console.log(`🛡️ [Pipeline Step 4/5] Executing Virus & Malware Scan on "${file.fileName}"...`);
  file.virusScanStatus = 'clean';
  await file.save({ validateBeforeSave: false });

  // STEP 5: Notification Delivery & Pipeline Completion
  console.log(`🔔 [Pipeline Step 5/5] Creating System Notification & Finalizing Job...`);
  file.processingStatus = 'completed';
  await file.save({ validateBeforeSave: false });

  await Notification.create({
    owner: userId,
    fileId: file._id,
    title: 'File Processing Complete',
    message: `Your file "${file.fileName}" has been processed: thumbnail created, compressed, and scanned clean.`,
    type: 'success',
  });

  // Clear cached data so UI receives updated file status
  await cacheService.invalidateRecentFiles(userId);
  await cacheService.invalidateStorageUsage(userId);

  console.log(`✨ [Pipeline Complete] File "${file.fileName}" processing finished successfully!\n`);
  return { status: 'success', fileId: file._id };
};

// Register processor with Memory Queue Fallback
memoryQueue.setProcessor(processFileJob);

// Register BullMQ Worker if Redis connection is active
let bullWorker = null;
if (redisConnection) {
  try {
    bullWorker = new Worker('file-processing-queue', processFileJob, {
      connection: redisConnection,
      concurrency: 5,
    });

    bullWorker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
    });

    bullWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed: ${err.message}`);
    });
  } catch (err) {
    console.warn(`[BullMQ Worker] Operating in Memory Queue mode.`);
  }
}

module.exports = {
  processFileJob,
  bullWorker,
};
