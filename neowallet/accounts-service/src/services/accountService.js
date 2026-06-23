/**
 * services/accountService.js - Accounts Service
 *
 * Capa de Servicio: contiene la lógica de negocio.
 * Recibe datos ya validados desde el Controlador,
 * aplica las reglas del negocio y llama al Modelo.
 *
 * El Servicio NO sabe nada de HTTP (req/res).
 * Solo trabaja con datos puros y lanza errores con mensajes claros.
 */

const UserModel = require('../models/userModel');

const AccountService = {

    /**
     * RF-001: Consultar saldo
     * Valida que el usuario exista y retorna sus datos.
     */
    async getAccount(userId) {
        const user = await UserModel.findById(userId);

        if (!user) {
            // Lanzamos un error con código para que el Controlador
            // sepa exactamente qué status HTTP responder
            const error = new Error(`Usuario con id ${userId} no encontrado`);
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        return user;
    },

    /**
     * RF-002: Recargar saldo
     * Valida monto positivo, busca usuario y aumenta su saldo.
     */
    async rechargeBalance({ user_id, amount, payment_method }) {
        // Regla de negocio: monto debe ser un número mayor a 0
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            const error = new Error('El monto debe ser un número positivo mayor a cero');
            error.statusCode = 400;
            error.code = 'INVALID_AMOUNT';
            throw error;
        }

        // Verificar que el usuario exista
        const user = await UserModel.findById(user_id);
        if (!user) {
            const error = new Error(`Usuario con id ${user_id} no encontrado`);
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // Ejecutar la recarga en BD (operación atómica)
        const updatedUser = await UserModel.addBalance(user_id, parsedAmount);

        return {
            message:         'Recarga exitosa',
            user_id:         updatedUser.id,
            name:            updatedUser.name,
            payment_method:  payment_method || 'SIMULATED',
            amount_recharged: parsedAmount,
            new_balance:     parseFloat(updatedUser.balance),
        };
    },

    /**
     * RF-004: Actualizar balance (endpoint interno para Processor Service)
     * Recibe operation = 'debit' | 'credit'
     */
    async updateBalance({ user_id, amount, operation }) {
        // Validar operación
        if (!['debit', 'credit'].includes(operation)) {
            const error = new Error("La operación debe ser 'debit' o 'credit'");
            error.statusCode = 400;
            error.code = 'INVALID_OPERATION';
            throw error;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            const error = new Error('El monto debe ser un número positivo');
            error.statusCode = 400;
            error.code = 'INVALID_AMOUNT';
            throw error;
        }

        // Verificar existencia del usuario
        const user = await UserModel.findById(user_id);
        if (!user) {
            const error = new Error(`Usuario con id ${user_id} no encontrado`);
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // Ejecutar operación en BD
        const result = await UserModel.updateBalance(user_id, parsedAmount, operation);

        // Si result es null => el WHERE balance >= amount no se cumplió => fondos insuficientes
        if (!result) {
            const error = new Error('Fondos insuficientes para realizar el débito');
            error.statusCode = 400;
            error.code = 'INSUFFICIENT_FUNDS';
            throw error;
        }

        return {
            user_id:          result.id,
            name:             result.name,
            operation,
            amount:           parsedAmount,
            previous_balance: parseFloat(result.previous_balance),
            new_balance:      parseFloat(result.new_balance),
        };
    },
};

module.exports = AccountService;
