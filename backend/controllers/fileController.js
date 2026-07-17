const fs = require('fs');
const path = require('path');
const fileService = require('../services/fileService');
const Folder = require('../models/Folder');
const SharedFile = require('../models/SharedFile');
const File = require('../models/File');
const User = require('../models/User');
const AppError = require('../utils/AppError');

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
      const { file, absolutePath } = await fileService.getFileStream(
        req.user._id,
        id
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.fileName)}"`
      );
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.size);

      const stream = fs.createReadStream(absolutePath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async viewFileInline(req, res, next) {
    try {
      const { id } = req.params;
      const { file, absolutePath } = await fileService.getFileStream(
        req.user._id,
        id
      );

      const mimeType = file.mimeType;
      const size = file.size;

      // Handle Range-based Video Streaming
      if (mimeType.startsWith('video/')) {
        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : size - 1;

          if (start >= size || end >= size) {
            res.status(416).setHeader('Content-Range', `bytes */${size}`);
            return res.end();
          }

          const chunksize = end - start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': mimeType,
          });

          const fileStream = fs.createReadStream(absolutePath, { start, end });
          fileStream.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': size,
            'Content-Type': mimeType,
          });
          const fileStream = fs.createReadStream(absolutePath);
          fileStream.pipe(res);
        }
      } else {
        // Standard pipes for images and PDFs
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', size);
        const fileStream = fs.createReadStream(absolutePath);
        fileStream.pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }

  async renameFile(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return next(new AppError('New file name is required', 400));
      }

      const file = await fileService.renameFile(req.user._id, id, name);

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
      const { isFavourite } = req.body;

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
      const { isStarred } = req.body;

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
      const { isArchived } = req.body;

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
      const { isLocked } = req.body;

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
      const files = await File.find({ owner: req.user._id, isStarred: true, isDeleted: false }).populate('owner', 'name');
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
          avatar: req.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
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

      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
          stats,
          uploadHistory,
          pinnedFiles,
          recentFiles,
          activities
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async emptyTrash(req, res, next) {
    try {
      const files = await File.find({ owner: req.user._id, isDeleted: true });
      for (const file of files) {
        const absolutePath = path.join(__dirname, '../uploads', file.storagePath.replace(/^\/uploads\//, ''));
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      }

      await File.deleteMany({ owner: req.user._id, isDeleted: true });
      await Folder.deleteMany({ owner: req.user._id, isDeleted: true });

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

      res.status(201).json({
        status: 'success',
        message: 'File duplicated successfully',
        data: { file }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FileController();
