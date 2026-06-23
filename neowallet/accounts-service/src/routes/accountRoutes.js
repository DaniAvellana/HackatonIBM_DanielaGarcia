/**
 * routes/accountRoutes.js - Accounts Service
 *
 * Define qué URL llama a qué función del Controlador.
 * Actúa como el "mapa de rutas" del servicio.
 */

const express    = require('express');
const router     = express.Router();
const AccountController = require('../controllers/accountController');

// GET /accounts/:id  →  Consultar saldo de un usuario
router.get('/accounts/:id', AccountController.getAccount);

// POST /api/recharge  →  Recargar saldo
router.post('/api/recharge', AccountController.rechargeBalance);

// POST /accounts/update-balance  →  Endpoint interno (llamado por Processor Service)
router.post('/accounts/update-balance', AccountController.updateBalance);

module.exports = router;
