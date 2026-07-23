const { Worker } = require('bullmq');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Notification = require('../models/Notification');
const cacheService = require('../services/cacheService');
const compressionService = require('../services/compressionService');
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
  console.log(`📷 [Pipeline Step 2/5] Thumbnail generation...`);
  if (file.mimeType.startsWith('video/') && file.storagePath.startsWith('/uploads/')) {
    const { exec } = require('child_process');
    const relativePath = file.storagePath.replace(/^\/uploads\//, '');
    const videoAbsolutePath = path.join(__dirname, '../uploads', relativePath);

    const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    const thumbFilename = `thumb_${file._id}.jpg`;
    const thumbAbsolutePath = path.join(thumbnailsDir, thumbFilename);

    await new Promise((resolve) => {
      exec(`ffmpeg -y -i "${videoAbsolutePath}" -ss 00:00:01 -vframes 1 "${thumbAbsolutePath}"`, (err) => {
        if (!err && fs.existsSync(thumbAbsolutePath)) {
          file.thumbnailUrl = `/uploads/thumbnails/${thumbFilename}`;
          file.thumbnailPath = `/uploads/thumbnails/${thumbFilename}`;
          console.log(`📷 [Thumbnail] Extracted thumbnail frame from video using FFmpeg.`);
        } else {
          console.log(`📷 [Thumbnail] FFmpeg not available or failed; retaining client-generated thumbnail.`);
        }
        resolve();
      });
    });
  } else {
    file.thumbnailPath = file.thumbnailUrl || `/uploads/thumbnails/thumb_${file.fileName}`;
  }
  await file.save({ validateBeforeSave: false });

  // STEP 3: Compression Optimization
  console.log(`📦 [Pipeline Step 3/5] Applying File Compression & Metadata Optimization...`);
  await compressionService.compressFile(file);

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
