const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File owner is required'],
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    extension: {
      type: String,
      default: '',
    },
    hash: {
      type: String,
      default: '',
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
    },
    publicUrl: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    thumbnailPath: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    isCompressed: {
      type: Boolean,
      default: false,
    },
    virusScanStatus: {
      type: String,
      enum: ['unscanned', 'clean', 'infected'],
      default: 'unscanned',
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model('File', fileSchema);

module.exports = File;
