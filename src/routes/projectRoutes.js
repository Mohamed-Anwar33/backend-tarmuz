const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

// Protected routes (require authentication)
router.post('/', protect, upload.array('images', 50), projectController.createProject);
router.put('/:id', protect, upload.array('images', 50), projectController.updateProject);
router.delete('/:id', protect, projectController.deleteProject);

module.exports = router;