const Folder = require('../models/Folder');
const File = require('../models/File');
const AppError = require('../utils/AppError');

const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

class FolderService {
  async createFolder(userId, name, parentFolderId) {
    if (!name || !name.trim()) {
      throw new AppError('Folder name is required', 400);
    }

    let calculatedPath = '/';
    let parentId = null;

    if (parentFolderId && parentFolderId !== 'root') {
      const parentFolder = await Folder.findOne({ _id: parentFolderId, owner: userId, isDeleted: false });
      if (!parentFolder) {
        throw new AppError('Parent folder not found', 404);
      }
      calculatedPath = parentFolder.path === '/'
        ? `/${parentFolder.name}`
        : `${parentFolder.path}/${parentFolder.name}`;
      parentId = parentFolder._id;
    }

    // Check for duplicate folder name in the same directory
    const existingFolder = await Folder.findOne({
      owner: userId,
      name: name.trim(),
      parentFolder: parentId,
      isDeleted: false,
    });
    if (existingFolder) {
      throw new AppError('A folder with this name already exists in this directory', 400);
    }

    const folder = await Folder.create({
      name: name.trim(),
      parentFolder: parentId,
      owner: userId,
      path: calculatedPath,
    });

    return folder;
  }

  async renameFolder(userId, folderId, newName) {
    if (!newName || !newName.trim()) {
      throw new AppError('New folder name is required', 400);
    }

    const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found', 404);
    }

    const trimmedNewName = newName.trim();
    if (folder.name === trimmedNewName) {
      return folder;
    }

    // Check for duplicates in parent folder
    const existingFolder = await Folder.findOne({
      owner: userId,
      name: trimmedNewName,
      parentFolder: folder.parentFolder,
      isDeleted: false,
    });
    if (existingFolder) {
      throw new AppError('A folder with this name already exists in this directory', 400);
    }

    const oldPathPrefix = folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;
    const newPathPrefix = folder.path === '/' ? `/${trimmedNewName}` : `${folder.path}/${trimmedNewName}`;

    // Find all descendants
    const descendants = await Folder.find({
      owner: userId,
      $or: [
        { path: oldPathPrefix },
        { path: new RegExp('^' + escapeRegex(oldPathPrefix) + '/') }
      ]
    });

    // Update descendants paths
    for (const desc of descendants) {
      const remainingPath = desc.path.substring(oldPathPrefix.length);
      desc.path = newPathPrefix + remainingPath;
      await desc.save();
    }

    folder.name = trimmedNewName;
    await folder.save();

    return folder;
  }

  async deleteFolder(userId, folderId) {
    const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found', 404);
    }

    const pathPrefix = folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;

    // Find all descendants
    const descendants = await Folder.find({
      owner: userId,
      $or: [
        { path: pathPrefix },
        { path: new RegExp('^' + escapeRegex(pathPrefix) + '/') }
      ]
    });

    const folderIds = [folder._id, ...descendants.map(d => d._id)];

    // Soft delete all folders
    await Folder.updateMany(
      { _id: { $in: folderIds } },
      { isDeleted: true }
    );

    // Soft delete all files in these folders
    await File.updateMany(
      { owner: userId, folderId: { $in: folderIds } },
      { isDeleted: true }
    );

    return { message: 'Folder and all its contents deleted successfully' };
  }

  async restoreFolder(userId, folderId) {
    const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: true });
    if (!folder) {
      throw new AppError('Deleted folder not found', 404);
    }

    const pathPrefix = folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;

    // Find all descendants (even active ones, but we set them to false just in case)
    const descendants = await Folder.find({
      owner: userId,
      $or: [
        { path: pathPrefix },
        { path: new RegExp('^' + escapeRegex(pathPrefix) + '/') }
      ]
    });

    const folderIds = [folder._id, ...descendants.map(d => d._id)];

    // Restore all folders
    await Folder.updateMany(
      { _id: { $in: folderIds } },
      { isDeleted: false }
    );

    // Restore all files in these folders
    await File.updateMany(
      { owner: userId, folderId: { $in: folderIds } },
      { isDeleted: false }
    );

    return { message: 'Folder and all its contents restored successfully' };
  }

  async getFolderContents(userId, folderId) {
    let currentFolder = null;
    let parentFolderId = null;

    if (folderId && folderId !== 'root') {
      currentFolder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
      if (!currentFolder) {
        throw new AppError('Folder not found', 404);
      }
      parentFolderId = currentFolder._id;
    }

    const subfolders = await Folder.find({
      owner: userId,
      parentFolder: parentFolderId,
      isDeleted: false,
    }).populate('owner', 'name');

    const files = await File.find({
      owner: userId,
      folderId: parentFolderId,
      isDeleted: false,
    }).populate('owner', 'name');

    return {
      folder: currentFolder,
      subfolders,
      files,
    };
  }

  async moveFolder(userId, folderId, targetParentId) {
    const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
    if (!folder) {
      throw new AppError('Folder not found', 404);
    }

    let calculatedNewPath = '/';
    let newParentId = null;

    if (targetParentId && targetParentId !== 'root') {
      const targetParent = await Folder.findOne({ _id: targetParentId, owner: userId, isDeleted: false });
      if (!targetParent) {
        throw new AppError('Target parent folder not found', 404);
      }

      // Circular Move Prevention
      // 1. Cannot move to itself
      if (folderId.toString() === targetParent._id.toString()) {
        throw new AppError('Cannot move a folder into itself', 400);
      }

      // 2. Cannot move to a descendant subfolder
      const folderPathPrefix = folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;
      const isDescendant = targetParent.path === folderPathPrefix || targetParent.path.startsWith(folderPathPrefix + '/');
      if (isDescendant) {
        throw new AppError('Cannot move a folder into one of its subfolders', 400);
      }

      calculatedNewPath = targetParent.path === '/'
        ? `/${targetParent.name}`
        : `${targetParent.path}/${targetParent.name}`;
      newParentId = targetParent._id;
    }

    // Check if folder name already exists in target parent
    const existingFolder = await Folder.findOne({
      owner: userId,
      name: folder.name,
      parentFolder: newParentId,
      isDeleted: false,
    });
    if (existingFolder) {
      throw new AppError('A folder with the same name already exists in the target directory', 400);
    }

    const oldPathPrefix = folder.path === '/' ? `/${folder.name}` : `${folder.path}/${folder.name}`;
    const newPathPrefix = calculatedNewPath === '/' ? `/${folder.name}` : `${calculatedNewPath}/${folder.name}`;

    // Find all descendants
    const descendants = await Folder.find({
      owner: userId,
      $or: [
        { path: oldPathPrefix },
        { path: new RegExp('^' + escapeRegex(oldPathPrefix) + '/') }
      ]
    });

    // Update descendants paths
    for (const desc of descendants) {
      const remainingPath = desc.path.substring(oldPathPrefix.length);
      desc.path = newPathPrefix + remainingPath;
      await desc.save();
    }

    folder.parentFolder = newParentId;
    folder.path = calculatedNewPath;
    await folder.save();

    return folder;
  }
}

module.exports = new FolderService();
