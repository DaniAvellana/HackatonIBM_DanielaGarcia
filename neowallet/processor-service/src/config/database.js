/**
 * config/database.js - Processor Service
 * Pool de conexiones a processor_db (puerto 5433 en localhost, 5432 en Docker)
 */

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'processor_db',
    user:     process.env.DB_USER     || 'processor_user',
    password: process.env.DB_PASSWORD || 'processor_secret_pass',
    max: 10,
    idleTimeoutMillis:       30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('[processor-db] Nueva conexión establecida en el pool');
});

pool.on('error', (err) => {
    console.error('[processor-db] Error en el pool:', err.message);
    process.exit(-1);
});

module.exports = pool;
