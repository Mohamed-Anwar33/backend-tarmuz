const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const settingsController = require('../controllers/settingsController');

// Get current contact recipient email
router.get('/contact-recipient', protect, admin, settingsController.getContactRecipient);

// Update contact recipient email
router.put('/contact-recipient', protect, admin, settingsController.updateContactRecipient);

// Login form options
// Public read (for login page)
router.get('/login-options-public', settingsController.getLoginOptionsPublic);
// Admin manage
router.get('/login-options', protect, admin, settingsController.getLoginOptions);
router.put('/login-options', protect, admin, settingsController.updateLoginOptions);

// Branding (logo)
// Public
router.get('/branding-public', settingsController.getBrandingPublic);
// Admin
router.get('/branding', protect, admin, settingsController.getBranding);
router.put('/branding', protect, admin, settingsController.updateBranding);

module.exports = router;
