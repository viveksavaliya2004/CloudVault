const express = require('express');
const fileController = require('../controllers/fileController');
const upload = require('../middleware/fileUploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible shared link routes (No JWT required)
router.get('/shared/public/:shareId', fileController.getPublicShareInfo);
router.post('/shared/public/:shareId/verify', fileController.verifyPublicSharePassword);
router.get('/shared/public/:shareId/download', fileController.downloadPublicShare);

// Protect all routes under files
router.use(protect);

router.post('/upload/single', upload.single('file'), fileController.uploadSingleFile);
router.post('/upload/multiple', upload.array('files', 10), fileController.uploadMultipleFiles);

// Listings and custom queries (above dynamic /:id parameter)
router.get('/list/all', fileController.getAllFiles);
router.get('/list/trash', fileController.getTrashList);
router.get('/list/favorites', fileController.getFavoritesList);
router.get('/list/shared', fileController.getSharedList);
router.get('/list/dashboard-stats', fileController.getDashboardStats);
router.delete('/trash/empty', fileController.emptyTrash);

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
router.post('/:id/duplicate', fileController.duplicateFile);
router.post('/:id/share', fileController.shareFile);
router.get('/:id/shares', fileController.getFileShares);
router.delete('/shares/:shareId', fileController.revokeFileShare);

module.exports = router;
