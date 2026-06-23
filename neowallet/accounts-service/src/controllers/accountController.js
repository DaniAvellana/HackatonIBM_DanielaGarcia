/**
 * controllers/accountController.js - Accounts Service
 *
 * Capa de Controlador: maneja HTTP.
 * - Lee el request (params, body, query)
 * - Llama al Servicio con datos limpios
 * - Retorna la respuesta HTTP correcta (status + JSON)
 *
 * NO contiene lógica de negocio.
 * Solo traduce entre HTTP y el Servicio.
 */

const AccountService = require('../services/accountService');

const AccountController = {

    /**
     * GET /accounts/:id
     * Retorna el saldo de un usuario específico.
     */
    async getAccount(req, res) {
        try {
            // Validar que el ID sea un número entero positivo
            const userId = parseInt(req.params.id);
            if (isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    error:   'ID inválido',
                    code:    'INVALID_ID',
                    message: 'El ID debe ser un número entero positivo',
                });
            }

            const user = await AccountService.getAccount(userId);
            return res.status(200).json(user);

        } catch (err) {
            // Si el Servicio lanzó un error controlado, usamos su statusCode
            const status = err.statusCode || 500;
            return res.status(status).json({
                error:   err.message,
                code:    err.code || 'INTERNAL_ERROR',
            });
        }
    },

    /**
     * POST /api/recharge
     * Body: { user_id, amount, payment_method }
     */
    async rechargeBalance(req, res) {
        try {
            const { user_id, amount, payment_method } = req.body;

            // Validación básica de campos requeridos
            if (!user_id || amount === undefined) {
                return res.status(400).json({
                    error:   'Campos requeridos faltantes',
                    code:    'MISSING_FIELDS',
                    message: 'Se requiere user_id y amount',
                });
            }

            const result = await AccountService.rechargeBalance({
                user_id: parseInt(user_id),
                amount,
                payment_method,
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
     * POST /accounts/update-balance
     * Endpoint INTERNO: solo lo llama el Processor Service.
     * Body: { user_id, amount, operation }
     */
    async updateBalance(req, res) {
        try {
            const { user_id, amount, operation } = req.body;

            if (!user_id || amount === undefined || !operation) {
                return res.status(400).json({
                    error:   'Campos requeridos faltantes',
                    code:    'MISSING_FIELDS',
                    message: 'Se requiere user_id, amount y operation',
                });
            }

            const result = await AccountService.updateBalance({
                user_id: parseInt(user_id),
                amount,
                operation,
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
};

module.exports = AccountController;
