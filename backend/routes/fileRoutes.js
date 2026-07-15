const express = require('express');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/fileUploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes under files
router.use(protect);

router.post('/upload/single', upload.single('file'), fileController.uploadSingleFile);
router.post('/upload/multiple', upload.array('files', 10), fileController.uploadMultipleFiles);
router.get('/:id', fileController.getFileMetadata);
router.get('/:id/download', fileController.downloadFile);
router.get('/:id/view', fileController.viewFileInline);
router.delete('/:id', fileController.deleteFile);
router.patch('/:id/restore', fileController.restoreFile);
router.patch('/:id/rename', fileController.renameFile);
router.patch('/:id/favourite', fileController.toggleFavourite);
router.patch('/:id/star', fileController.toggleStar);
router.patch('/:id/archive', fileController.toggleArchive);
router.patch('/:id/lock', fileController.toggleLock);

module.exports = router;
