const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const authMiddleware = require('../middleware/authMiddleware');

// Route publik (tidak butuh token)
router.post('/public', pesananController.createPublicPesanan);

// Route terproteksi JWT
router.get('/', authMiddleware, pesananController.getAllPesanan);
router.put('/:id', authMiddleware, pesananController.updatePesananStatus);

module.exports = router;
