const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const validateObjectId = require('../middlewares/validateObjectId');
const { protect } = require('../middlewares/authMiddleware');

// Public route - submit contact form
router.post('/', contactController.submitContact);

// Protected routes (require authentication)
router.get('/', protect, contactController.getContacts);
router.get('/:id', protect, validateObjectId('id'), contactController.getContact);
router.put('/:id', protect, validateObjectId('id'), contactController.updateContactStatus);
router.delete('/:id', protect, validateObjectId('id'), contactController.deleteContact);

module.exports = router;