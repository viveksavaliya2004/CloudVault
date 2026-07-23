const express = require('express');
const userController = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes under users
router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/profile/password', userController.changePassword);

router.get('/profile/sessions', userController.getSessions);
router.delete('/profile/sessions/:id', userController.revokeSession);

module.exports = router;
