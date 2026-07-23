const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictToAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection & admin restriction to all routes
router.use(protect);
router.use(restrictToAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle-block', adminController.toggleBlockUser);
router.delete('/files/:id', adminController.deleteFile);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
