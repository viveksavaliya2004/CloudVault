const mongoose = require('mongoose');

const chunkUploadSchema = new mongoose.Schema(
  {
    uploadId: {
      type: String,
      required: [true, 'Upload ID is required'],
      unique: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
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
    fileSize: {
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
    totalChunks: {
      type: Number,
      required: [true, 'Total chunks count is required'],
    },
    uploadedChunks: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ChunkUpload = mongoose.model('ChunkUpload', chunkUploadSchema);

module.exports = ChunkUpload;
