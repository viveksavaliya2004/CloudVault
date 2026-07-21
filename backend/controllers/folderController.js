const folderService = require('../services/folderService');
const cacheService = require('../services/cacheService');
const AppError = require('../utils/AppError');

class FolderController {
  async createFolder(req, res, next) {
    try {
      const { name, parentFolder } = req.body;

      if (!name || !name.trim()) {
        return next(new AppError('Folder name is required', 400));
      }

      const folder = await folderService.createFolder(req.user._id, name, parentFolder);
      await cacheService.invalidateFolderTree(req.user._id);

      res.status(201).json({
        status: 'success',
        message: 'Folder created successfully',
        data: { folder },
      });
    } catch (err) {
      next(err);
    }
  }

  async renameFolder(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return next(new AppError('New folder name is required', 400));
      }

      const folder = await folderService.renameFolder(req.user._id, id, name);
      await cacheService.invalidateFolderTree(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Folder renamed successfully',
        data: { folder },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFolder(req, res, next) {
    try {
      const { id } = req.params;

      const result = await folderService.deleteFolder(req.user._id, id);
      await cacheService.invalidateFolderTree(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async restoreFolder(req, res, next) {
    try {
      const { id } = req.params;

      const result = await folderService.restoreFolder(req.user._id, id);
      await cacheService.invalidateFolderTree(req.user._id);
      await cacheService.invalidateStorageUsage(req.user._id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFolderContents(req, res, next) {
    try {
      const { id } = req.params;
      const folderId = id === 'root' ? null : id;

      const data = await folderService.getFolderContents(req.user._id, folderId);

      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async moveFolder(req, res, next) {
    try {
      const { id } = req.params;
      const { targetParentId } = req.body;

      const folder = await folderService.moveFolder(req.user._id, id, targetParentId);
      await cacheService.invalidateFolderTree(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Folder moved successfully',
        data: { folder },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllFolders(req, res, next) {
    try {
      const userId = req.user._id;
      const cachedFolders = await cacheService.getFolderTree(userId);

      if (cachedFolders) {
        console.log(`⚡ [CACHE HIT] Serving Folder Tree for user ${userId} from Cache (MongoDB Query Skipped)`);
        return res.status(200).json({
          status: 'success',
          data: { folders: cachedFolders },
        });
      }

      console.log(`📦 [CACHE MISS] Fetching Folder Tree for user ${userId} from MongoDB & Caching`);
      const Folder = require('../models/Folder');
      const folders = await Folder.find({ owner: userId, isDeleted: false }).populate('owner', 'name');

      await cacheService.setFolderTree(userId, folders);

      res.status(200).json({
        status: 'success',
        data: { folders },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FolderController();
