/**
 * models/transactionModel.js - Processor Service
 *
 * Repositorio de transacciones.
 * Todas las queries SQL que tocan la tabla `transactions`.
 *
 * Nota clave: los estados siguen este flujo:
 *   PENDING → DEBITED → COMPLETED
 *                    ↘ ROLLED_BACK (si el crédito falla)
 *   PENDING → FAILED (si el débito falla)
 */

const pool = require('../config/database');

const TransactionModel = {

    /**
     * Crea una nueva transacción en estado PENDING.
     * Se llama al inicio del flujo, antes de tocar saldos.
     */
    async create({ senderId, receiverId, amount }) {
        const query = `
            INSERT INTO transactions (sender_id, receiver_id, amount, status)
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING *
        `;
        const result = await pool.query(query, [senderId, receiverId, amount]);
        return result.rows[0];
    },

    /**
     * Actualiza el estado de una transacción.
     * Opcionalmente guarda un mensaje de error.
     */
    async updateStatus(transactionId, status, errorMessage = null) {
        const query = `
            UPDATE transactions
            SET status        = $1,
                error_message = $2
            WHERE id = $3
            RETURNING *
        `;
        const result = await pool.query(query, [status, errorMessage, transactionId]);
        return result.rows[0];
    },

    /**
     * RF-005 (Bonus): Historial de transacciones por usuario.
     * Retorna todas las transacciones donde el usuario es sender O receiver.
     * Ordenadas por fecha descendente (más reciente primero).
     */
    async findByUser(userId) {
        const query = `
            SELECT
                id,
                sender_id,
                receiver_id,
                ROUND(amount::numeric, 2) AS amount,
                status,
                error_message,
                created_at,
                -- Determinar el tipo de transacción desde la perspectiva del usuario
                CASE
                    WHEN sender_id   = $1 AND receiver_id = $1 THEN 'recharge'
                    WHEN sender_id   = $1 THEN 'sent'
                    WHEN receiver_id = $1 THEN 'received'
                END AS type
            FROM transactions
            WHERE sender_id = $1
               OR receiver_id = $1
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },
};

module.exports = TransactionModel;
