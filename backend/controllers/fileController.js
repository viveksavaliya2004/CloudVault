const fs = require('fs');
const path = require('path');
const fileService = require('../services/fileService');
const File = require('../models/File');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class FileController {
  async uploadSingleFile(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('Please provide a file to upload', 400));
      }

      const file = await fileService.processUpload(
        req.user._id,
        req.file,
        req.body.folderId
      );

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
          const fileDoc = await fileService.processUpload(
            req.user._id,
            file,
            req.body.folderId
          );
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
}

module.exports = new FileController();
