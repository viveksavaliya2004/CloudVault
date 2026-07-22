const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification owner is required'],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
