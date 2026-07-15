const mongoose = require('mongoose');

const sharedFileSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File ID is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'edit'],
      default: 'read',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SharedFile = mongoose.model('SharedFile', sharedFileSchema);

module.exports = SharedFile;
