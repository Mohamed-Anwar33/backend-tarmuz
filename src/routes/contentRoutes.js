const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middlewares/authMiddleware');

// Public: Get all content or by type
router.get('/', contentController.getAllContent);
router.get('/:type', contentController.getContent);

// Protected: Admin actions
router.use(protect);
router.post('/', contentController.createContent);
router.put('/:type', contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

module.exports = router;