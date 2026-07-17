const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const AppError = require('../utils/AppError');

class FileService {
  async processUpload(userId, file, folderId) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    const size = file.size;

    // Format & Size Validations
    let isTypeAllowed = false;
    let maxSizeLimit = 0;
    let allowedTypeName = '';

    if (mimeType.startsWith('image/')) {
      isTypeAllowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension);
      maxSizeLimit = 20 * 1024 * 1024; // 20MB
      allowedTypeName = 'Image';
    } else if (mimeType === 'application/pdf') {
      isTypeAllowed = extension === '.pdf';
      maxSizeLimit = 100 * 1024 * 1024; // 100MB
      allowedTypeName = 'PDF';
    } else if (mimeType.startsWith('video/')) {
      isTypeAllowed = ['.mp4', '.mov', '.avi', '.mkv'].includes(extension);
      maxSizeLimit = 1024 * 1024 * 1024; // 1GB
      allowedTypeName = 'Video';
    } else if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-zip-compressed' ||
      mimeType === 'application/x-tar' ||
      mimeType === 'application/x-gzip' ||
      mimeType === 'application/rar' ||
      mimeType === 'application/x-rar-compressed' ||
      mimeType === 'application/x-7z-compressed' ||
      ['.zip', '.rar', '.tar', '.gz', '.7z'].includes(extension)
    ) {
      isTypeAllowed = true;
      maxSizeLimit = 1024 * 1024 * 1024; // 1GB
      allowedTypeName = 'ZIP Archive';
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-powerpoint' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(extension)
    ) {
      isTypeAllowed = true;
      maxSizeLimit = 100 * 1024 * 1024; // 100MB
      allowedTypeName = 'Document';
    }

    if (!isTypeAllowed) {
      // Delete uploaded file from disk to prevent junk
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError('Unsupported file type. Only standard Images, PDFs, Videos, Documents, and ZIP Archives are allowed.', 400);
    }

    if (size > maxSizeLimit) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError(`${allowedTypeName} upload limit is ${maxSizeLimit / (1024 * 1024)}MB. Provided file size is ${(size / (1024 * 1024)).toFixed(2)}MB.`, 400);
    }

    // Validate folder exists (if provided)
    let parentFolderId = null;
    if (folderId && folderId !== 'root') {
      const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
      if (!folder) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw new AppError('Target folder not found', 404);
      }
      parentFolderId = folder._id;
    }

    // Validate storage limit
    const user = await User.findById(userId);
    if (!user) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError('User not found', 404);
    }

    if (user.storageUsed + size > user.storageLimit) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new AppError('Storage limit exceeded. Cannot upload file.', 400);
    }

    // Create File in DB
    const relativeStoragePath = `/uploads/${file.filename}`;
    const fileDoc = await File.create({
      owner: userId,
      folderId: parentFolderId,
      fileName: file.originalname,
      originalName: file.originalname,
      size: size,
      mimeType: mimeType,
      extension: extension,
      storagePath: relativeStoragePath,
    });

    // Update User storageUsed
    user.storageUsed += size;
    await user.save();

    return fileDoc;
  }

  async getFileMetadata(userId, fileId) {
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new AppError('File not found', 404);
    }
    return file;
  }

  async deleteFile(userId, fileId) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (file.isLocked) {
      throw new AppError('File is locked. Unlock it to perform this operation.', 400);
    }

    file.isDeleted = true;
    await file.save();

    const user = await User.findById(userId);
    if (user) {
      user.storageUsed = Math.max(0, user.storageUsed - file.size);
      await user.save();
    }

    return { message: 'File deleted successfully' };
  }

  async restoreFile(userId, fileId) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: true });
    if (!file) {
      throw new AppError('Deleted file not found', 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.storageUsed + file.size > user.storageLimit) {
      throw new AppError('Storage limit exceeded. Cannot restore file.', 400);
    }

    file.isDeleted = false;
    await file.save();

    user.storageUsed += file.size;
    await user.save();

    return { message: 'File restored successfully' };
  }

  async renameFile(userId, fileId, newName) {
    if (!newName || !newName.trim()) {
      throw new AppError('New file name is required', 400);
    }

    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (file.isLocked) {
      throw new AppError('File is locked. Unlock it to perform this operation.', 400);
    }

    const trimmedNewName = newName.trim();
    if (file.fileName === trimmedNewName) {
      return file;
    }

    // Check for duplicates in the same directory/folder
    const duplicate = await File.findOne({
      owner: userId,
      fileName: trimmedNewName,
      folderId: file.folderId,
      isDeleted: false,
    });
    if (duplicate) {
      throw new AppError('A file with this name already exists in this directory', 400);
    }

    file.fileName = trimmedNewName;
    await file.save();
    return file;
  }

  async toggleFavourite(userId, fileId, isFavourite) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    file.isFavourite = isFavourite === undefined ? !file.isFavourite : !!isFavourite;
    await file.save();
    return file;
  }

  async toggleStar(userId, fileId, isStarred) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    file.isStarred = isStarred === undefined ? !file.isStarred : !!isStarred;
    await file.save();
    return file;
  }

  async toggleArchive(userId, fileId, isArchived) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    file.isArchived = isArchived === undefined ? !file.isArchived : !!isArchived;
    await file.save();
    return file;
  }

  async toggleLock(userId, fileId, isLocked) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    file.isLocked = isLocked === undefined ? !file.isLocked : !!isLocked;
    await file.save();
    return file;
  }

  async getFileStream(userId, fileId) {
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    // Resolve absolute path to the file
    const absolutePath = path.join(__dirname, '../uploads', file.storagePath.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(absolutePath)) {
      throw new AppError('File content not found on server disk', 404);
    }

    return { file, absolutePath };
  }

  async duplicateFile(userId, fileId) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check storage limits
    if (user.storageUsed + file.size > user.storageLimit) {
      throw new AppError('Storage limit exceeded. Cannot duplicate file.', 400);
    }

    // Determine paths
    const originalAbsolutePath = path.join(__dirname, '../uploads', file.storagePath.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(originalAbsolutePath)) {
      throw new AppError('Original file content not found on server disk', 404);
    }

    const ext = path.extname(file.originalName);
    const base = path.basename(file.originalName, ext);
    const newOriginalName = `${base} - Copy${ext}`;

    const extension = path.extname(file.fileName);
    const filenameBase = path.basename(file.fileName, extension);
    const newFileName = `${filenameBase} - Copy${extension}`;

    // Generate unique storage name on disk
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const storageName = `${file.mimeType.startsWith('image/') ? 'avatar' : 'file'}-${uniqueSuffix}${extension}`;
    const newStoragePath = `/uploads/${storageName}`;
    const newAbsolutePath = path.join(__dirname, '../uploads', storageName);

    // Copy file on disk
    fs.copyFileSync(originalAbsolutePath, newAbsolutePath);

    // Create DB document
    const duplicatedFile = await File.create({
      owner: userId,
      folderId: file.folderId,
      fileName: newFileName,
      originalName: newOriginalName,
      size: file.size,
      mimeType: file.mimeType,
      extension: file.extension,
      hash: file.hash,
      storagePath: newStoragePath,
      isStarred: file.isStarred,
      isFavourite: file.isFavourite,
      isArchived: file.isArchived,
      isLocked: file.isLocked,
    });

    // Update storage
    user.storageUsed += file.size;
    await user.save();

    return duplicatedFile;
  }
}

module.exports = new FileService();
