const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', testimonialController.getTestimonials);
router.get('/:id', testimonialController.getTestimonial);

// Protected routes (require authentication)
router.post('/', protect, testimonialController.createTestimonial);
router.put('/:id', protect, testimonialController.updateTestimonial);
router.delete('/:id', protect, testimonialController.deleteTestimonial);

module.exports = router;