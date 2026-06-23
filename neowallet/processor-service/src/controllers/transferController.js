/**
 * controllers/transferController.js - Processor Service
 */

const TransferService = require('../services/transferService');

const TransferController = {

    /**
     * POST /api/transfer
     * Body: { sender_id, receiver_id, amount }
     */
    async transfer(req, res) {
        try {
            const { sender_id, receiver_id, amount } = req.body;

            if (!sender_id || !receiver_id || amount === undefined) {
                return res.status(400).json({
                    error:   'Campos requeridos faltantes',
                    code:    'MISSING_FIELDS',
                    message: 'Se requiere sender_id, receiver_id y amount',
                });
            }

            const result = await TransferService.transfer({
                sender_id:   parseInt(sender_id),
                receiver_id: parseInt(receiver_id),
                amount,
            });

            return res.status(200).json(result);

        } catch (err) {
            const status = err.statusCode || 500;
            return res.status(status).json({
                error:   err.message,
                code:    err.code || 'INTERNAL_ERROR',
            });
        }
    },

    /**
     * GET /api/transactions/:user_id
     * Bonus: Historial de transacciones
     */
    async getHistory(req, res) {
        try {
            const userId = parseInt(req.params.user_id);

            if (isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    error:   'ID de usuario inválido',
                    code:    'INVALID_ID',
                });
            }

            const result = await TransferService.getTransactionHistory(userId);
            return res.status(200).json(result);

        } catch (err) {
            const status = err.statusCode || 500;
            return res.status(status).json({
                error:   err.message,
                code:    err.code || 'INTERNAL_ERROR',
            });
        }
    },
};

module.exports = TransferController;
