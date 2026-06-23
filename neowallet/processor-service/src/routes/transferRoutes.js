/**
 * routes/transferRoutes.js - Processor Service
 */

const express            = require('express');
const router             = express.Router();
const TransferController = require('../controllers/transferController');

// POST /api/transfer  →  Ejecutar transferencia P2P con Saga
router.post('/api/transfer', TransferController.transfer);

// GET /api/transactions/:user_id  →  Historial (bonus)
router.get('/api/transactions/:user_id', TransferController.getHistory);

module.exports = router;
