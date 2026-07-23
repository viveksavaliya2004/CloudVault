const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');

const User = require('../models/User');

class CompressionService {
  async compressImage(filePath, ext) {
    const tempPath = filePath + '.tmp';
    try {
      let pipeline = sharp(filePath);

      const lowerExt = ext.toLowerCase();
      if (lowerExt === '.jpg' || lowerExt === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: 75, progressive: true });
      } else if (lowerExt === '.png') {
        pipeline = pipeline.png({ compressionLevel: 8, palette: true });
      } else if (lowerExt === '.webp') {
        pipeline = pipeline.webp({ quality: 75 });
      } else if (lowerExt === '.gif') {
        pipeline = pipeline.gif({ colours: 128 });
      } else {
        // Fallback for other image formats (e.g. convert/compress as jpeg)
        pipeline = pipeline.jpeg({ quality: 75 });
      }

      await pipeline.toFile(tempPath);
      
      // If the compressed file is indeed smaller, overwrite the original
      const origSize = fs.statSync(filePath).size;
      const tempSize = fs.statSync(tempPath).size;
      
      if (tempSize < origSize) {
        fs.renameSync(tempPath, filePath);
        console.log(`📷 [Compression] Image compressed successfully. Size reduced from ${origSize} to ${tempSize} bytes.`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`📷 [Compression] Compressed image is larger or equal in size. Retaining original.`);
      }
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw err;
    }
  }

  async compressPdf(filePath) {
    try {
      const origSize = fs.statSync(filePath).size;
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Save PDF with compressed object streams
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const tempSize = compressedBytes.length;

      if (tempSize < origSize) {
        fs.writeFileSync(filePath, compressedBytes);
        console.log(`📄 [Compression] PDF compressed successfully. Size reduced from ${origSize} to ${tempSize} bytes.`);
      } else {
        console.log(`📄 [Compression] Compressed PDF is larger or equal in size. Retaining original.`);
      }
    } catch (err) {
      throw err;
    }
  }

  async compressZip(filePath) {
    try {
      const origSize = fs.statSync(filePath).size;
      const zip = new AdmZip(filePath);
      const newZip = new AdmZip();

      const entries = zip.getEntries();
      for (const entry of entries) {
        if (!entry.isDirectory) {
          // Read raw data and re-compress it
          newZip.addFile(entry.entryName, entry.getData(), entry.comment);
        }
      }

      const tempPath = filePath + '.tmp';
      newZip.writeZip(tempPath);

      const tempSize = fs.statSync(tempPath).size;
      if (tempSize < origSize) {
        fs.renameSync(tempPath, filePath);
        console.log(`📦 [Compression] ZIP re-compressed. Size reduced from ${origSize} to ${tempSize} bytes.`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`📦 [Compression] Re-compressed ZIP is larger or equal in size. Retaining original.`);
      }
    } catch (err) {
      throw err;
    }
  }

  async compressVideo(filePath) {
    return new Promise((resolve) => {
      // Check if ffmpeg is available
      exec('ffmpeg -version', (err) => {
        if (err) {
          console.warn('🎥 [Compression] FFmpeg is not installed on this system. Skipping video compression.');
          return resolve(); // Skip gracefully without throwing error
        }

        const tempPath = filePath + '.tmp.mp4';
        // Compress using h264 with crf 28 (moderate quality, smaller size) and aac audio
        const cmd = `ffmpeg -y -i "${filePath}" -vcodec libx264 -crf 28 -preset faster -acodec aac "${tempPath}"`;

        exec(cmd, (execErr) => {
          if (execErr) {
            console.error('🎥 [Compression] FFmpeg execution error:', execErr.message);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            return resolve(); // Resolve gracefully to not block worker
          }

          try {
            const origSize = fs.statSync(filePath).size;
            const tempSize = fs.statSync(tempPath).size;

            if (tempSize < origSize) {
              fs.renameSync(tempPath, filePath);
              console.log(`🎥 [Compression] Video compressed successfully. Size reduced from ${origSize} to ${tempSize} bytes.`);
            } else {
              fs.unlinkSync(tempPath);
              console.log(`🎥 [Compression] Compressed video is larger or equal in size. Retaining original.`);
            }
          } catch (statErr) {
            console.error('🎥 [Compression] Video stats error:', statErr.message);
          }
          resolve();
        });
      });
    });
  }

  async compressFile(fileDoc) {
    if (!fileDoc) return;

    // Resolve local storage path
    const relativePath = fileDoc.storagePath.replace(/^\/uploads\//, '');
    const absolutePath = path.join(__dirname, '../uploads', relativePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`[Compression] File not found on local disk: ${absolutePath}. Skipping compression.`);
      fileDoc.isCompressed = true;
      await fileDoc.save({ validateBeforeSave: false });
      return;
    }

    const originalSize = fs.statSync(absolutePath).size;
    const ext = fileDoc.extension || path.extname(fileDoc.originalName);

    console.log(`[Compression] Starting compression for "${fileDoc.fileName}" (type: ${ext}, size: ${originalSize} bytes)...`);

    try {
      const mime = (fileDoc.mimeType || '').toLowerCase();
      
      if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase())) {
        await this.compressImage(absolutePath, ext);
      } else if (mime === 'application/pdf' || ext.toLowerCase() === '.pdf') {
        await this.compressPdf(absolutePath);
      } else if (mime.includes('zip') || ext.toLowerCase() === '.zip') {
        await this.compressZip(absolutePath);
      } else if (mime.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv'].includes(ext.toLowerCase())) {
        await this.compressVideo(absolutePath);
      } else {
        console.log(`[Compression] File type ${ext} is not supported for compression. Skipping.`);
        fileDoc.isCompressed = true;
        await fileDoc.save({ validateBeforeSave: false });
      }

      // Check if size changed
      const compressedSize = fs.statSync(absolutePath).size;
      if (compressedSize < originalSize) {
        const diff = originalSize - compressedSize;
        fileDoc.size = compressedSize;
        fileDoc.isCompressed = true;
        await fileDoc.save({ validateBeforeSave: false });

        // Update User storageUsed
        const user = await User.findById(fileDoc.owner);
        if (user) {
          user.storageUsed = Math.max(0, user.storageUsed - diff);
          await user.save();
          console.log(`[Compression] Deducted ${diff} bytes from User storageUsed. New storageUsed: ${user.storageUsed}`);
        }
      } else {
        fileDoc.isCompressed = true;
        await fileDoc.save({ validateBeforeSave: false });
        console.log(`[Compression] Completed. No size reduction achieved for "${fileDoc.fileName}".`);
      }
    } catch (err) {
      console.error(`❌ [Compression Error] Failed to compress "${fileDoc.fileName}":`, err.message);
      // Ensure we don't crash the background process pipeline
    }
  }
}

module.exports = new CompressionService();
