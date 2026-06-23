/**
 * services/transferService.js - Processor Service
 *
 * ================================================================
 * CORAZÓN DEL SISTEMA: Patrón Saga para transferencias P2P
 * ================================================================
 *
 * El Patrón Saga maneja transacciones distribuidas entre servicios.
 * Como no podemos hacer un "BEGIN TRANSACTION" que abarque dos
 * bases de datos distintas, usamos compensación:
 *
 *  PASO 1: Crear transacción en PENDING
 *  PASO 2: Debitar al sender (si falla → marcar FAILED, fin)
 *  PASO 3: Acreditar al receiver (si falla → COMPENSAR)
 *    COMPENSACIÓN: Re-acreditar al sender → marcar ROLLED_BACK
 *  PASO 4: Marcar transacción COMPLETED
 *
 * GARANTÍA: La suma total de dinero siempre permanece constante.
 * ================================================================
 */

const TransactionModel = require('../models/transactionModel');
const AccountsClient   = require('../config/accountsClient');

const TransferService = {

    /**
     * RF-003: Transferir dinero P2P
     * Orquesta el flujo completo con patrón Saga.
     */
    async transfer({ sender_id, receiver_id, amount }) {

        // ----------------------------------------------------------
        // VALIDACIONES PREVIAS (sin tocar dinero ni BD)
        // ----------------------------------------------------------

        // RN-002: No se puede transferir a uno mismo
        if (sender_id === receiver_id) {
            const error = new Error('No se puede transferir dinero a uno mismo');
            error.statusCode = 400;
            error.code = 'SELF_TRANSFER_NOT_ALLOWED';
            throw error;
        }

        // RN-001: Monto positivo
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            const error = new Error('El monto debe ser un número positivo mayor a cero');
            error.statusCode = 400;
            error.code = 'INVALID_AMOUNT';
            throw error;
        }

        // Verificar existencia del sender en accounts-service
        const senderCheck = await AccountsClient.getAccount(sender_id);
        if (!senderCheck.success) {
            const error = new Error(`Sender con id ${sender_id} no encontrado`);
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // Verificar existencia del receiver en accounts-service
        const receiverCheck = await AccountsClient.getAccount(receiver_id);
        if (!receiverCheck.success) {
            const error = new Error(`Receiver con id ${receiver_id} no encontrado`);
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        // ----------------------------------------------------------
        // SAGA - PASO 1: Crear transacción en PENDING
        // Registramos que la operación inició antes de tocar dinero.
        // Si el sistema se cae aquí, el dinero no se ha movido.
        // ----------------------------------------------------------
        let transaction;
        try {
            transaction = await TransactionModel.create({
                senderId:   sender_id,
                receiverId: receiver_id,
                amount:     parsedAmount,
            });
            console.log(`[saga] Transacción ${transaction.id} creada → PENDING`);
        } catch (dbError) {
            console.error('[saga] Error al crear transacción:', dbError.message);
            const error = new Error('Error al iniciar la transacción');
            error.statusCode = 500;
            error.code = 'TRANSACTION_CREATE_ERROR';
            throw error;
        }

        // ----------------------------------------------------------
        // SAGA - PASO 2: Debitar al sender
        // Llamamos al Accounts Service para restar el monto.
        // Si el sender no tiene fondos suficientes, falla aquí
        // y marcamos FAILED (no se movió ningún dinero).
        // ----------------------------------------------------------
        const debitResult = await AccountsClient.updateBalance(
            sender_id, parsedAmount, 'debit'
        );

        if (!debitResult.success) {
            // El débito falló → marcamos FAILED (nadie perdió dinero)
            await TransactionModel.updateStatus(
                transaction.id,
                'FAILED',
                debitResult.error
            );

            console.log(`[saga] Transacción ${transaction.id} → FAILED (débito fallido)`);

            const statusCode = debitResult.code === 'INSUFFICIENT_FUNDS' ? 400 : 502;
            const error = new Error(debitResult.error);
            error.statusCode = statusCode;
            error.code = debitResult.code;
            throw error;
        }

        // Débito exitoso: actualizamos estado a DEBITED
        await TransactionModel.updateStatus(transaction.id, 'DEBITED');
        console.log(`[saga] Transacción ${transaction.id} → DEBITED`);

        // ----------------------------------------------------------
        // SAGA - PASO 3: Acreditar al receiver
        // Si esto FALLA, ya debitamos al sender → DEBEMOS COMPENSAR
        // ----------------------------------------------------------
        const creditResult = await AccountsClient.updateBalance(
            receiver_id, parsedAmount, 'credit'
        );

        if (!creditResult.success) {
            // ======================================================
            // COMPENSACIÓN SAGA: Revertir el débito del sender
            // Devolvemos el dinero que ya se había debitado.
            // ======================================================
            console.warn(`[saga] Crédito falló. Iniciando compensación para transacción ${transaction.id}...`);

            const compensationResult = await AccountsClient.updateBalance(
                sender_id, parsedAmount, 'credit' // devolver el dinero
            );

            if (compensationResult.success) {
                // Compensación exitosa → ROLLED_BACK
                await TransactionModel.updateStatus(
                    transaction.id,
                    'ROLLED_BACK',
                    `Crédito falló: ${creditResult.error}. Débito revertido exitosamente.`
                );
                console.log(`[saga] Transacción ${transaction.id} → ROLLED_BACK (dinero devuelto al sender)`);
            } else {
                // Compensación también falló → estado crítico (requiere intervención manual)
                await TransactionModel.updateStatus(
                    transaction.id,
                    'FAILED',
                    `CRÍTICO: Crédito falló Y compensación falló. Requiere revisión manual. Error: ${compensationResult.error}`
                );
                console.error(`[saga] CRÍTICO: Compensación falló en transacción ${transaction.id}. Requiere revisión manual.`);
            }

            const error = new Error('La transferencia falló y fue revertida');
            error.statusCode = 502;
            error.code = 'TRANSFER_ROLLED_BACK';
            throw error;
        }

        // ----------------------------------------------------------
        // SAGA - PASO 4: Todo exitoso → COMPLETED
        // ----------------------------------------------------------
        await TransactionModel.updateStatus(transaction.id, 'COMPLETED');
        console.log(`[saga] Transacción ${transaction.id} → COMPLETED ✓`);

        return {
            transaction_id:  transaction.id,
            sender_id,
            receiver_id,
            amount:          parsedAmount,
            status:          'COMPLETED',
            message:         'Transferencia completada exitosamente',
            timestamp:       new Date().toISOString(),
        };
    },

    /**
     * RF-005 (Bonus): Historial de transacciones por usuario
     */
    async getTransactionHistory(userId) {
        // Validar que sea un ID numérico
        if (isNaN(userId) || userId <= 0) {
            const error = new Error('ID de usuario inválido');
            error.statusCode = 400;
            error.code = 'INVALID_ID';
            throw error;
        }

        const transactions = await TransactionModel.findByUser(userId);
        return {
            user_id:      userId,
            total:        transactions.length,
            transactions,
        };
    },
};

module.exports = TransferService;
