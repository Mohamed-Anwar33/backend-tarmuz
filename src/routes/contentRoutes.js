const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for content images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/content/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public: Get all content or by type
router.get('/', contentController.getAllContent);
router.get('/:type', contentController.getContent);

// Protected: Admin actions
router.use(protect);
router.post('/', upload.array('images', 10), contentController.createContent);
router.put('/:type', upload.array('images', 10), contentController.updateContent);
router.delete('/:id', contentController.deleteContent);

module.exports = router;