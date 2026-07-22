const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);

      const unreadCount = await Notification.countDocuments({ owner: req.user._id, isRead: false });

      res.status(200).json({
        status: 'success',
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({ _id: id, owner: req.user._id });
      if (!notification) {
        return next(new AppError('Notification not found', 404));
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
        data: { notification },
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await Notification.updateMany({ owner: req.user._id, isRead: false }, { isRead: true });

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
