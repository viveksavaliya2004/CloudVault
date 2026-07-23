const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const Folder = require('../models/Folder');
const AppError = require('../utils/AppError');
const imagekit = require('../config/imagekit');

class FileService {
  async getUniqueFileName(userId, folderId, originalName) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);

    let counter = 1;
    let fileName = originalName;

    while (true) {
      const duplicate = await File.findOne({
        owner: userId,
        fileName: fileName,
        folderId: folderId,
        isDeleted: false,
      });

      if (!duplicate) {
        return fileName;
      }

      fileName = `${base} (${counter})${ext}`;
      counter++;
    }
  }

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
      maxSizeLimit = 15 * 1024 * 1024; // 15MB (Restored to 15MB to resolve test size failures)
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
      throw new AppError('Unsupported file type. Only standard Images, PDFs, Videos, Documents, and ZIP Archives are allowed.', 400);
    }

    if (size > maxSizeLimit) {
      throw new AppError(`${allowedTypeName} upload limit is ${maxSizeLimit / (1024 * 1024)}MB. Provided file size is ${(size / (1024 * 1024)).toFixed(2)}MB.`, 400);
    }

    // Validate folder exists (if provided)
    let parentFolderId = null;
    if (folderId && folderId !== 'root') {
      const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
      if (!folder) {
        throw new AppError('Target folder not found', 404);
      }
      parentFolderId = folder._id;
    }

    // Validate storage limit
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.storageUsed + size > user.storageLimit) {
      throw new AppError('Storage limit exceeded. Cannot upload file.', 400);
    }

    // Generate unique display name to prevent duplicates in the same directory
    const uniqueFileName = await this.getUniqueFileName(userId, parentFolderId, file.originalname);

    // Upload buffer to ImageKit
    let uploadResponse;
    try {
      uploadResponse = await imagekit.files.upload({
        file: file.buffer.toString('base64'),
        fileName: uniqueFileName,
        folder: '/cloudvault',
        useUniqueFileName: true,
      });
    } catch (err) {
      console.error('ImageKit upload error:', err);
      throw new AppError('Failed to upload file to cloud storage: ' + err.message, 500);
    }

    // Create File in DB
    const fileDoc = await File.create({
      owner: userId,
      folderId: parentFolderId,
      fileName: uniqueFileName,
      originalName: file.originalname,
      size: size,
      mimeType: mimeType,
      extension: extension,
      storagePath: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
      imagekitFileId: uploadResponse.fileId,
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
    // Try to find the file where the user is the owner
    let file = await File.findOne({ _id: fileId, owner: userId });

    // If not found, check if the file has been shared with this user
    if (!file) {
      const SharedFile = require('../models/SharedFile');
      const share = await SharedFile.findOne({ fileId, sharedWith: userId });
      if (share) {
        // Verify expiration if it exists
        if (!share.expiresAt || new Date() < new Date(share.expiresAt)) {
          file = await File.findById(fileId);
        }
      }
    }

    if (!file) {
      throw new AppError('File not found', 404);
    }

    return { file };
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

    const ext = path.extname(file.originalName);
    const base = path.basename(file.originalName, ext);
    const newOriginalName = `${base} - Copy${ext}`;

    const extension = path.extname(file.fileName);
    const filenameBase = path.basename(file.fileName, extension);
    const newFileName = `${filenameBase} - Copy${extension}`;

    // Duplicate on ImageKit using file URL
    let uploadResponse;
    try {
      uploadResponse = await imagekit.files.upload({
        file: file.storagePath, // original URL
        fileName: newOriginalName,
        folder: '/cloudvault',
        useUniqueFileName: true,
      });
    } catch (err) {
      console.error('ImageKit duplicate error:', err);
      throw new AppError('Failed to duplicate file on cloud storage: ' + err.message, 500);
    }

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
      storagePath: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
      imagekitFileId: uploadResponse.fileId,
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

  async moveFile(userId, fileId, targetFolderId) {
    const file = await File.findOne({ _id: fileId, owner: userId, isDeleted: false });
    if (!file) {
      throw new AppError('File not found', 404);
    }

    let folderId = null;

    if (targetFolderId && targetFolderId !== 'root') {
      const targetFolder = await Folder.findOne({ _id: targetFolderId, owner: userId, isDeleted: false });
      if (!targetFolder) {
        throw new AppError('Target folder not found', 404);
      }
      folderId = targetFolder._id;
    }

    file.folderId = folderId;
    await file.save();
    return file;
  }
}

module.exports = new FileService();
