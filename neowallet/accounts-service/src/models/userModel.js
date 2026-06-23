/**
 * models/userModel.js - Accounts Service
 *
 * Repositorio: es la capa que habla directamente con la base de datos.
 * Solo contiene queries SQL. No tiene lógica de negocio.
 *
 * Usamos PREPARED STATEMENTS ($1, $2...) en lugar de concatenar strings.
 * Ejemplo inseguro:  `SELECT * FROM users WHERE id = ${id}`  ← SQL Injection
 * Ejemplo seguro:    `SELECT * FROM users WHERE id = $1`, [id]  ← Seguro
 *
 * PostgreSQL separa el query del dato, por lo que un hacker
 * no puede "inyectar" SQL malicioso como valor.
 */

const pool = require('../config/database');

const UserModel = {

    /**
     * Busca un usuario por su ID.
     * Retorna el objeto usuario o undefined si no existe.
     */
    async findById(id) {
        const query = `
            SELECT id, name, email,
                   ROUND(balance::numeric, 2) AS balance,
                   created_at, updated_at
            FROM users
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0]; // undefined si no hay resultados
    },

    /**
     * Incrementa el saldo de un usuario (recarga).
     * Retorna el usuario actualizado.
     * La operación es atómica gracias a PostgreSQL.
     */
    async addBalance(userId, amount) {
        const query = `
            UPDATE users
            SET balance = balance + $1
            WHERE id = $2
            RETURNING id, name, email,
                      ROUND(balance::numeric, 2) AS balance,
                      updated_at
        `;
        const result = await pool.query(query, [amount, userId]);
        return result.rows[0];
    },

    /**
     * Endpoint interno usado por el Processor Service.
     * Hace débito o crédito con validación atómica en BD.
     *
     * Para DÉBITO: usa `balance - $1 WHERE balance >= $1`
     * Si el saldo es insuficiente, el WHERE falla y no actualiza nada.
     * Esto previene saldos negativos sin necesidad de dos queries.
     *
     * Retorna el usuario actualizado o null si hubo fondos insuficientes.
     */
    async updateBalance(userId, amount, operation) {
        let query;

        if (operation === 'debit') {
            // La magia: solo actualiza SI el balance actual >= amount
            // Si no hay fondos, RETURNING no retorna filas -> null
            query = `
                UPDATE users
                SET balance = balance - $1
                WHERE id = $2
                  AND balance >= $1
                RETURNING id, name,
                          ROUND(balance::numeric, 2)          AS new_balance,
                          ROUND((balance + $1)::numeric, 2)   AS previous_balance
            `;
        } else {
            // credit: simplemente suma
            query = `
                UPDATE users
                SET balance = balance + $1
                WHERE id = $2
                RETURNING id, name,
                          ROUND(balance::numeric, 2)          AS new_balance,
                          ROUND((balance - $1)::numeric, 2)   AS previous_balance
            `;
        }

        const result = await pool.query(query, [amount, userId]);
        return result.rows[0] || null; // null = no se actualizó (fondos insuficientes)
    },
};

module.exports = UserModel;
