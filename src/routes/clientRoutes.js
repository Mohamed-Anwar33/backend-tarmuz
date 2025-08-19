const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClient);

// Protected routes (require authentication)
router.post('/', protect, clientController.createClient);
router.put('/:id', protect, clientController.updateClient);
router.delete('/:id', protect, clientController.deleteClient);

module.exports = router;