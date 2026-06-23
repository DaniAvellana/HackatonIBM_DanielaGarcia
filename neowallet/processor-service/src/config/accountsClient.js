/**
 * config/accountsClient.js - Processor Service
 *
 * Cliente HTTP para comunicarse con el Accounts Service.
 * El Processor Service NO tiene acceso directo a accounts_db.
 * Para modificar saldos, llama al endpoint interno del Accounts Service.
 *
 * ACCOUNTS_SERVICE_URL viene de la variable de entorno.
 * - En Docker:      http://accounts-service:3000 (nombre del contenedor)
 * - En desarrollo:  http://localhost:3000
 */

const fetch = require('node-fetch');

const ACCOUNTS_URL = process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3000';

const AccountsClient = {

    /**
     * Llama a POST /accounts/update-balance en el Accounts Service.
     * Retorna { success, data, error }
     *
     * @param {number} userId
     * @param {number} amount
     * @param {'debit'|'credit'} operation
     */
    async updateBalance(userId, amount, operation) {
        try {
            const response = await fetch(`${ACCOUNTS_URL}/accounts/update-balance`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ user_id: userId, amount, operation }),
                // Timeout de 5 segundos para no esperar indefinidamente
                timeout: 5000,
            });

            const data = await response.json();

            if (!response.ok) {
                // El Accounts Service respondió con un error (4xx/5xx)
                return {
                    success: false,
                    error:   data.error || 'Error en accounts-service',
                    code:    data.code  || 'ACCOUNTS_SERVICE_ERROR',
                };
            }

            return { success: true, data };

        } catch (networkError) {
            // Error de red: el servicio no responde (caído, timeout, etc.)
            console.error('[accounts-client] Error de red:', networkError.message);
            return {
                success: false,
                error:   'Accounts Service no disponible',
                code:    'ACCOUNTS_SERVICE_UNAVAILABLE',
            };
        }
    },

    /**
     * Verifica que un usuario existe consultando su saldo.
     * GET /accounts/:id
     */
    async getAccount(userId) {
        try {
            const response = await fetch(`${ACCOUNTS_URL}/accounts/${userId}`, {
                timeout: 5000,
            });

            if (response.status === 404) {
                return { success: false, code: 'USER_NOT_FOUND' };
            }

            if (!response.ok) {
                return { success: false, code: 'ACCOUNTS_SERVICE_ERROR' };
            }

            const data = await response.json();
            return { success: true, data };

        } catch (networkError) {
            console.error('[accounts-client] Error de red:', networkError.message);
            return { success: false, code: 'ACCOUNTS_SERVICE_UNAVAILABLE' };
        }
    },
};

module.exports = AccountsClient;
