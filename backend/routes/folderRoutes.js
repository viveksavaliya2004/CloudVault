const express = require('express');
const folderController = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const { validateFolderCreate, validateFileRename } = require('../middleware/validationMiddleware');

// Protect all routes under folders
router.use(protect);

router.post('/', validateFolderCreate, folderController.createFolder);
router.get('/', folderController.getAllFolders);
router.get('/:id/contents', folderController.getFolderContents);
router.patch('/:id/rename', validateFileRename, folderController.renameFolder);
router.patch('/:id/move', folderController.moveFolder);
router.delete('/:id', folderController.deleteFolder);
router.patch('/:id/restore', folderController.restoreFolder);

module.exports = router;
