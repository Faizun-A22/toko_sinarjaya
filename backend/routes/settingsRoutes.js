const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Route publik (tidak butuh token)
router.get('/public', settingsController.getPublicSettings);

// Route terproteksi JWT
router.get('/', authMiddleware, settingsController.getSettings);
router.put('/', authMiddleware, settingsController.updateSettings);

module.exports = router;
