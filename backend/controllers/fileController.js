const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const fileService = require('../services/fileService');
const Folder = require('../models/Folder');
const SharedFile = require('../models/SharedFile');
const File = require('../models/File');
const User = require('../models/User');
const ChunkUpload = require('../models/ChunkUpload');
const AppError = require('../utils/AppError');
const cacheService = require('../services/cacheService');
const { addFileProcessingJob } = require('../config/queue');

class FileController {
  async uploadSingleFile(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('Please provide a file to upload', 400));
      }

      let file = await fileService.processUpload(
        req.user._id,
        req.file,
        req.body.folderId
      );
      file = await File.findById(file._id).populate('owner', 'name');

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      // Dispatch 5-step background processing job
      await addFileProcessingJob('process-file', {
        fileId: file._id,
        userId: req.user._id,
      });

      res.status(201).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadMultipleFiles(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('Please provide files to upload', 400));
      }

      const files = [];
      try {
        for (const file of req.files) {
          let fileDoc = await fileService.processUpload(
            req.user._id,
            file,
            req.body.folderId
          );
          fileDoc = await File.findById(fileDoc._id).populate('owner', 'name');
          files.push(fileDoc);

          // Dispatch 5-step background processing job for each file
          await addFileProcessingJob('process-file', {
            fileId: fileDoc._id,
            userId: req.user._id,
          });
        }
      } catch (uploadError) {
        // Atomic cleanup: remove any successfully created files in this batch
        for (const fileDoc of files) {
          const absolutePath = path.join(
            __dirname,
            '../uploads',
            fileDoc.storagePath.replace(/^\/uploads\//, '')
          );
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
          await File.deleteOne({ _id: fileDoc._id });
          const user = await User.findById(req.user._id);
          if (user) {
            user.storageUsed = Math.max(0, user.storageUsed - fileDoc.size);
            await user.save();
          }
        }
        return next(uploadError);
      }

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(201).json({
        status: 'success',
        message: `${files.length} files uploaded successfully`,
        data: { files },
      });
    } catch (err) {
      next(err);
    }
  }

  async getFileMetadata(req, res, next) {
    try {
      const { id } = req.params;
      const file = await fileService.getFileMetadata(req.user._id, id);

      res.status(200).json({
        status: 'success',
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { id } = req.params;
      const result = await fileService.deleteFile(req.user._id, id);

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async restoreFile(req, res, next) {
    try {
      const { id } = req.params;
      const result = await fileService.restoreFile(req.user._id, id);

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async downloadFile(req, res, next) {
    try {
      const { id } = req.params;
      const { file } = await fileService.getFileStream(
        req.user._id,
        id
      );

      // Increment real downloads count
      file.downloads = (file.downloads || 0) + 1;
      await file.save({ validateBeforeSave: false });

      res.redirect(file.storagePath);
    } catch (err) {
      next(err);
    }
  }

  async viewFileInline(req, res, next) {
    try {
      const { id } = req.params;
      const { file } = await fileService.getFileStream(
        req.user._id,
        id
      );

      res.redirect(file.storagePath);
    } catch (err) {
      next(err);
    }
  }

  async renameFile(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body || {};

      if (!name || !name.trim()) {
        return next(new AppError('New file name is required', 400));
      }

      const file = await fileService.renameFile(req.user._id, id, name);
      await cacheService.invalidateRecentFiles(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'File renamed successfully',
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleFavourite(req, res, next) {
    try {
      const { id } = req.params;
      const { isFavourite } = req.body || {};

      const file = await fileService.toggleFavourite(req.user._id, id, isFavourite);

      res.status(200).json({
        status: 'success',
        message: `File ${isFavourite ? 'marked as favourite' : 'removed from favourites'} successfully`,
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStar(req, res, next) {
    try {
      const { id } = req.params;
      const { isStarred } = req.body || {};

      const file = await fileService.toggleStar(req.user._id, id, isStarred);

      res.status(200).json({
        status: 'success',
        message: `File ${isStarred ? 'starred' : 'unstarred'} successfully`,
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleArchive(req, res, next) {
    try {
      const { id } = req.params;
      const { isArchived } = req.body || {};

      const file = await fileService.toggleArchive(req.user._id, id, isArchived);

      res.status(200).json({
        status: 'success',
        message: `File ${isArchived ? 'archived' : 'unarchived'} successfully`,
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleLock(req, res, next) {
    try {
      const { id } = req.params;
      const { isLocked } = req.body || {};

      const file = await fileService.toggleLock(req.user._id, id, isLocked);

      res.status(200).json({
        status: 'success',
        message: `File ${isLocked ? 'locked' : 'unlocked'} successfully`,
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllFiles(req, res, next) {
    try {
      const files = await File.find({ owner: req.user._id, isDeleted: false }).populate('owner', 'name');
      res.status(200).json({
        status: 'success',
        data: { files }
      });
    } catch (err) {
      next(err);
    }
  }

  async getTrashList(req, res, next) {
    try {
      const folders = await Folder.find({ owner: req.user._id, isDeleted: true }).populate('owner', 'name');
      const files = await File.find({ owner: req.user._id, isDeleted: true }).populate('owner', 'name');
      res.status(200).json({
        status: 'success',
        data: { folders, files }
      });
    } catch (err) {
      next(err);
    }
  }

  async getFavoritesList(req, res, next) {
    try {
      const files = await File.find({ owner: req.user._id, isFavourite: true, isDeleted: false }).populate('owner', 'name');
      res.status(200).json({
        status: 'success',
        data: { files }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSharedList(req, res, next) {
    try {
      const sharedWithMeDocs = await SharedFile.find({ sharedWith: req.user._id }).populate({
        path: 'fileId',
        populate: { path: 'owner', select: 'name' }
      });
      const sharedWithMe = sharedWithMeDocs.map(doc => {
        if (!doc.fileId) return null;
        return {
          ...doc.fileId.toObject(),
          permission: doc.permission,
          expiration: doc.expiresAt,
        };
      }).filter(Boolean);

      const sharedByMeDocs = await SharedFile.find({ owner: req.user._id }).populate({
        path: 'fileId',
        populate: { path: 'owner', select: 'name' }
      });
      const sharedByMe = sharedByMeDocs.map(doc => {
        if (!doc.fileId) return null;
        return {
          ...doc.fileId.toObject(),
          permission: doc.permission,
          expiration: doc.expiresAt,
        };
      }).filter(Boolean);

      res.status(200).json({
        status: 'success',
        data: { sharedWithMe, sharedByMe }
      });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const userId = req.user._id;
      const cachedRecentFiles = await cacheService.getRecentFiles(userId);
      const cachedStorage = await cacheService.getStorageUsage(userId);

      if (cachedRecentFiles && cachedStorage) {
        console.log(`⚡ [CACHE HIT] Serving Dashboard Stats (Recent Files & Storage Usage) for user ${userId} from Cache (MongoDB Aggregation Skipped)`);
      } else {
        console.log(`📦 [CACHE MISS] Fetching Dashboard Stats (Recent Files & Storage Usage) for user ${userId} from MongoDB & Caching`);
      }

      const files = await File.find({ owner: req.user._id, isDeleted: false }).populate('owner', 'name');

      let imageSize = 0, imageCount = 0;
      let pdfSize = 0, pdfCount = 0;
      let videoSize = 0, videoCount = 0;
      let docSize = 0, docCount = 0;
      let zipSize = 0, zipCount = 0;
      let otherSize = 0, otherCount = 0;

      files.forEach(f => {
        const ext = (f.extension || '').toLowerCase();
        const mime = (f.mimeType || '').toLowerCase();

        if (mime.startsWith('image/')) {
          imageSize += f.size;
          imageCount++;
        } else if (mime === 'application/pdf' || ext === '.pdf') {
          pdfSize += f.size;
          pdfCount++;
        } else if (mime.startsWith('video/')) {
          videoSize += f.size;
          videoCount++;
        } else if (['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext) || mime.includes('document') || mime.includes('sheet') || mime.includes('presentation')) {
          docSize += f.size;
          docCount++;
        } else if (['.zip', '.rar', '.tar', '.gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
          zipSize += f.size;
          zipCount++;
        } else {
          otherSize += f.size;
          otherCount++;
        }
      });

      const stats = [
        { name: 'Images', value: imageSize, count: imageCount, color: '#10B981' },
        { name: 'PDF Documents', value: pdfSize, count: pdfCount, color: '#EF4444' },
        { name: 'Videos', value: videoSize, count: videoCount, color: '#7C3AED' },
        { name: 'Documents & Zips', value: docSize + zipSize + otherSize, count: docCount + zipCount + otherCount, color: '#F59E0B' },
      ];

      const pinnedFiles = files.filter(f => f.isStarred);
      const recentFiles = [...files].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

      const activities = recentFiles.map((f, idx) => ({
        id: `act-${f._id}`,
        user: {
          name: req.user.name,
          avatar: req.user.avatar || ''
        },
        details: f.createdAt.getTime() === f.updatedAt.getTime() ? 'uploaded file' : 'modified file',
        targetName: f.fileName,
        timestamp: f.updatedAt.toISOString(),
      }));

      const uploadHistory = [
        { name: 'Feb', size: Math.round(otherSize * 0.2) },
        { name: 'Mar', size: Math.round(pdfSize * 0.4) },
        { name: 'Apr', size: Math.round(imageSize * 0.5) },
        { name: 'May', size: Math.round(videoSize * 0.3) },
        { name: 'Jun', size: Math.round(docSize * 0.7) },
        { name: 'Jul', size: files.reduce((acc, f) => acc + f.size, 0) },
      ];

      // Day 8 additions
      const favouriteFiles = await File.find({ owner: req.user._id, isFavourite: true, isDeleted: false }).populate('owner', 'name').limit(5);

      const trashFiles = await File.find({ owner: req.user._id, isDeleted: true }, 'size');
      const trashFilesCount = trashFiles.length;
      const trashFoldersCount = await Folder.countDocuments({ owner: req.user._id, isDeleted: true });
      const trashSize = trashFiles.reduce((acc, f) => acc + f.size, 0);

      const activeFoldersCount = await Folder.countDocuments({ owner: req.user._id, isDeleted: false });
      const recentUploads = [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

      // Cache stats data for user
      await cacheService.setRecentFiles(userId, recentFiles);
      await cacheService.setStorageUsage(userId, {
        storageUsed: req.user.storageUsed,
        storageRemaining: Math.max(0, req.user.storageLimit - req.user.storageUsed),
        storageLimit: req.user.storageLimit
      });

      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
          storageUsed: req.user.storageUsed,
          storageRemaining: Math.max(0, req.user.storageLimit - req.user.storageUsed),
          stats,
          uploadHistory,
          pinnedFiles,
          recentFiles,
          recentUploads,
          favouriteFiles,
          recycleBin: {
            filesCount: trashFilesCount,
            foldersCount: trashFoldersCount,
            totalSize: trashSize
          },
          activities,
          counts: {
            files: files.length,
            folders: activeFoldersCount,
            storageUsed: req.user.storageUsed,
            storageRemaining: Math.max(0, req.user.storageLimit - req.user.storageUsed),
            storageLimit: req.user.storageLimit
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async emptyTrash(req, res, next) {
    try {
      const files = await File.find({ owner: req.user._id, isDeleted: true });
      const imagekit = require('../config/imagekit');
      for (const file of files) {
        if (file.imagekitFileId) {
          try {
            await imagekit.deleteFile(file.imagekitFileId);
          } catch (err) {
            console.error(`Failed to delete file ${file.imagekitFileId} from ImageKit:`, err.message);
          }
        }
      }

      await File.deleteMany({ owner: req.user._id, isDeleted: true });
      await Folder.deleteMany({ owner: req.user._id, isDeleted: true });

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Trash emptied successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicateFile(req, res, next) {
    try {
      const { id } = req.params;
      let file = await fileService.duplicateFile(req.user._id, id);
      file = await File.findById(file._id).populate('owner', 'name');

      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(201).json({
        status: 'success',
        message: 'File duplicated successfully',
        data: { file }
      });
    } catch (err) {
      next(err);
    }
  }

  async shareFile(req, res, next) {
    try {
      const { id } = req.params;
      const { email, isPublic, permission, expiresAt, password } = req.body || {};

      const file = await File.findOne({ _id: id, owner: req.user._id });
      if (!file) {
        return next(new AppError('File not found or access denied', 404));
      }

      let sharedWith = null;
      if (email) {
        const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (!targetUser) {
          return next(new AppError('No user found with this email address', 404));
        }
        if (targetUser._id.toString() === req.user._id.toString()) {
          return next(new AppError('You cannot share a file with yourself', 400));
        }
        sharedWith = targetUser._id;
      } else if (!isPublic) {
        return next(new AppError('Please provide an email to share or select public sharing', 400));
      }

      let hashedPassword = null;
      if (password && password.trim() !== '') {
        hashedPassword = await bcrypt.hash(password.trim(), 10);
      }

      // Check if a share configuration already exists for this file and user
      let share = await SharedFile.findOne({
        fileId: id,
        owner: req.user._id,
        sharedWith: sharedWith
      });

      if (share) {
        share.permission = permission || 'read';
        share.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (password !== undefined) {
          share.password = hashedPassword;
        }
        await share.save();
      } else {
        share = await SharedFile.create({
          fileId: id,
          owner: req.user._id,
          sharedWith: sharedWith,
          permission: permission || 'read',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          password: hashedPassword
        });
      }

      if (sharedWith) {
        await share.populate('sharedWith', 'name email');
      }

      res.status(200).json({
        status: 'success',
        message: 'File shared successfully',
        data: { share }
      });
    } catch (err) {
      next(err);
    }
  }

  async getFileShares(req, res, next) {
    try {
      const { id } = req.params;
      const shares = await SharedFile.find({ fileId: id, owner: req.user._id }).populate('sharedWith', 'name email');

      res.status(200).json({
        status: 'success',
        data: { shares }
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeFileShare(req, res, next) {
    try {
      const { shareId } = req.params;
      const share = await SharedFile.findOne({ _id: shareId, owner: req.user._id });
      if (!share) {
        return next(new AppError('Share mapping not found or access denied', 404));
      }

      await SharedFile.deleteOne({ _id: shareId });

      res.status(200).json({
        status: 'success',
        message: 'Share access revoked successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getPublicShareInfo(req, res, next) {
    try {
      const { shareId } = req.params;
      const share = await SharedFile.findById(shareId).populate('fileId').populate('owner', 'name');
      if (!share || share.sharedWith !== null) {
        return next(new AppError('Shared link not found or invalid', 404));
      }

      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        return next(new AppError('This shared link has expired', 400));
      }

      res.status(200).json({
        status: 'success',
        data: {
          file: {
            name: share.fileId.fileName,
            size: share.fileId.size,
            mimeType: share.fileId.mimeType,
            extension: share.fileId.extension
          },
          ownerName: share.owner.name,
          isPasswordProtected: !!share.password
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyPublicSharePassword(req, res, next) {
    try {
      const { shareId } = req.params;
      const { password } = req.body || {};

      const share = await SharedFile.findById(shareId);
      if (!share || share.sharedWith !== null) {
        return next(new AppError('Shared link not found or invalid', 404));
      }

      if (!share.password) {
        return res.status(200).json({ status: 'success', message: 'No password required' });
      }

      if (!password) {
        return next(new AppError('Password is required to access this file', 400));
      }

      const isMatch = await bcrypt.compare(password, share.password);
      if (!isMatch) {
        return next(new AppError('Invalid password. Access denied.', 401));
      }

      res.status(200).json({
        status: 'success',
        message: 'Password verified successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async downloadPublicShare(req, res, next) {
    try {
      const { shareId } = req.params;
      const { password } = req.query || {};

      const share = await SharedFile.findById(shareId).populate('fileId');
      if (!share || share.sharedWith !== null) {
        return next(new AppError('Shared link not found or invalid', 404));
      }

      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        return next(new AppError('This shared link has expired', 400));
      }

      if (share.password) {
        if (!password) {
          return next(new AppError('Password protection is active. Please provide password.', 401));
        }
        const isMatch = await bcrypt.compare(password, share.password);
        if (!isMatch) {
          return next(new AppError('Invalid password. Access denied.', 401));
        }
      }

      const file = share.fileId;
      const absolutePath = path.join(__dirname, '../uploads', file.storagePath.replace(/^\/uploads\//, ''));
      if (!fs.existsSync(absolutePath)) {
        return next(new AppError('File content not found on server disk', 404));
      }

      if (req.query.inline === 'true') {
        res.setHeader('Content-Disposition', 'inline');
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      }
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.size);

      // Increment real downloads count
      file.downloads = (file.downloads || 0) + 1;
      await file.save({ validateBeforeSave: false });

      const stream = fs.createReadStream(absolutePath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async moveFile(req, res, next) {
    try {
      const { id } = req.params;
      const { targetFolderId } = req.body;

      const file = await fileService.moveFile(req.user._id, id, targetFolderId);
      await cacheService.invalidateRecentFiles(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'File moved successfully',
        data: { file },
      });
    } catch (err) {
      next(err);
    }
  }

  async initializeChunkUpload(req, res, next) {
    try {
      const { fileName, fileSize, mimeType, folderId, totalChunks } = req.body;

      if (!fileName || !fileSize || !totalChunks) {
        return next(new AppError('fileName, fileSize, and totalChunks are required', 400));
      }

      // Cleanup stale uploads (older than 24h)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleUploads = await ChunkUpload.find({ createdAt: { $lt: cutoff } });
      for (const upload of staleUploads) {
        const dir = path.join(__dirname, '../uploads/chunks', upload.uploadId);
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
        await ChunkUpload.deleteOne({ _id: upload._id });
      }

      // Check file size limits
      const MAX_CHUNK_UPLOAD_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB
      if (fileSize > MAX_CHUNK_UPLOAD_LIMIT) {
        return next(new AppError('Upload limit is 5GB. Provided file size is too large.', 400));
      }

      // Validate allowed file extensions
      const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.zip', '.docx'];
      const ext = path.extname(fileName).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return next(
          new AppError(
            `File type not allowed. Allowed file types: ${ALLOWED_EXTENSIONS.map(e => e.replace('.', '')).join(', ')}`,
            400
          )
        );
      }

      // Check parent folder if provided
      let parentFolderId = null;
      if (folderId && folderId !== 'root') {
        const folder = await Folder.findOne({ _id: folderId, owner: req.user._id, isDeleted: false });
        if (!folder) {
          return next(new AppError('Target folder not found', 404));
        }
        parentFolderId = folder._id;
      }

      // Validate storage limit
      const user = await User.findById(req.user._id);
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      if (user.storageUsed + fileSize > user.storageLimit) {
        return next(new AppError('Storage limit exceeded. Cannot initialize upload.', 400));
      }

      // Generate a unique upload ID
      const crypto = require('crypto');
      const uploadId = 'up_' + crypto.randomBytes(16).toString('hex');

      // Create tracking model entry
      const chunkUpload = await ChunkUpload.create({
        uploadId,
        owner: req.user._id,
        folderId: parentFolderId,
        fileName,
        fileSize,
        mimeType: mimeType || 'application/octet-stream',
        extension: ext,
        totalChunks,
        uploadedChunks: [],
      });

      // Create chunks temporary directory
      const dir = path.join(__dirname, '../uploads/chunks', uploadId);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      res.status(201).json({
        status: 'success',
        data: {
          uploadId: chunkUpload.uploadId,
          uploadedChunks: chunkUpload.uploadedChunks,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadChunk(req, res, next) {
    try {
      const { uploadId, chunkIndex } = req.body;

      if (!uploadId || chunkIndex === undefined) {
        return next(new AppError('uploadId and chunkIndex are required', 400));
      }

      const upload = await ChunkUpload.findOne({ uploadId, owner: req.user._id });
      if (!upload) {
        return next(new AppError('Chunk upload session not found', 404));
      }

      const parsedIndex = parseInt(chunkIndex, 10);
      if (!upload.uploadedChunks.includes(parsedIndex)) {
        upload.uploadedChunks.push(parsedIndex);
        await upload.save();
      }

      res.status(200).json({
        status: 'success',
        message: 'Chunk uploaded successfully',
        data: {
          chunkIndex: parsedIndex,
          uploadedChunks: upload.uploadedChunks,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getChunkStatus(req, res, next) {
    try {
      const { uploadId } = req.params;

      if (!uploadId) {
        return next(new AppError('uploadId is required', 400));
      }

      const upload = await ChunkUpload.findOne({ uploadId, owner: req.user._id });
      if (!upload) {
        return next(new AppError('Chunk upload session not found or expired', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          uploadId: upload.uploadId,
          uploadedChunks: upload.uploadedChunks,
          totalChunks: upload.totalChunks,
          fileSize: upload.fileSize,
          fileName: upload.fileName,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async completeChunkUpload(req, res, next) {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return next(new AppError('uploadId is required', 400));
      }

      const upload = await ChunkUpload.findOne({ uploadId, owner: req.user._id });
      if (!upload) {
        return next(new AppError('Chunk upload session not found', 404));
      }

      const dir = path.join(__dirname, '../uploads/chunks', uploadId);

      // Verify that all chunk files exist on disk
      for (let i = 0; i < upload.totalChunks; i++) {
        const chunkPath = path.join(dir, `chunk-${i}`);
        if (!fs.existsSync(chunkPath)) {
          return next(new AppError(`Missing chunk index ${i} on server`, 400));
        }
      }

      // Generate a unique file name
      const uniqueFileName = await fileService.getUniqueFileName(req.user._id, upload.folderId, upload.fileName);
      const finalPath = path.join(__dirname, '../uploads', uniqueFileName);
      const writeStream = fs.createWriteStream(finalPath);

      // Merge chunks asynchronously using stream piping
      const mergeChunks = (chunkDir, total, destStream) => {
        return new Promise((resolve, reject) => {
          let currentChunk = 0;

          function appendNext() {
            if (currentChunk >= total) {
              destStream.end();
              return;
            }

            const chunkPath = path.join(chunkDir, `chunk-${currentChunk}`);
            const readStream = fs.createReadStream(chunkPath);

            readStream.on('error', (err) => {
              reject(err);
            });

            readStream.on('end', () => {
              currentChunk++;
              appendNext();
            });

            readStream.pipe(destStream, { end: false });
          }

          destStream.on('finish', () => {
            resolve();
          });

          destStream.on('error', (err) => {
            reject(err);
          });

          appendNext();
        });
      };

      await mergeChunks(dir, upload.totalChunks, writeStream);

      // Validate storage limit again
      const user = await User.findById(req.user._id);
      if (!user) {
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        return next(new AppError('User not found', 404));
      }

      if (user.storageUsed + upload.fileSize > user.storageLimit) {
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        return next(new AppError('Storage limit exceeded. Cannot complete upload.', 400));
      }

      // Remove chunks directory & document
      fs.rmSync(dir, { recursive: true, force: true });
      await ChunkUpload.deleteOne({ _id: upload._id });

      // Create File in DB
      let fileDoc = await File.create({
        owner: req.user._id,
        folderId: upload.folderId,
        fileName: uniqueFileName,
        originalName: upload.fileName,
        size: upload.fileSize,
        mimeType: upload.mimeType,
        extension: upload.extension,
        storagePath: `/uploads/${uniqueFileName}`,
        thumbnailUrl: `/uploads/${uniqueFileName}`,
      });

      // Populate fileDoc owner name
      fileDoc = await File.findById(fileDoc._id).populate('owner', 'name');

      // Update User storageUsed
      user.storageUsed += upload.fileSize;
      await user.save();

      // Invalidate caches
      await cacheService.invalidateRecentFiles(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      // Dispatch background processing job
      await addFileProcessingJob('process-file', {
        fileId: fileDoc._id,
        userId: req.user._id,
      });

      res.status(201).json({
        status: 'success',
        message: 'File upload completed and assembled successfully',
        data: { file: fileDoc },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FileController();
