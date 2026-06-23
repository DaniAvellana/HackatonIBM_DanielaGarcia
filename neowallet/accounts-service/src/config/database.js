/**
 * config/database.js - Accounts Service
 *
 * Crea un "Pool" de conexiones a PostgreSQL.
 * Un pool = conjunto de conexiones abiertas y reutilizables.
 * En lugar de abrir y cerrar la conexión en cada petición
 * (lento), tomamos una conexión del pool, la usamos y la devolvemos.
 *
 * Las credenciales vienen de variables de entorno (.env),
 * nunca hardcodeadas en el código.
 */

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'accounts_db',
    user:     process.env.DB_USER     || 'accounts_user',
    password: process.env.DB_PASSWORD || 'accounts_secret_pass',
    // Máximo de conexiones simultáneas en el pool
    max: 10,
    // Tiempo de espera si todas las conexiones están ocupadas (ms)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Evento: se dispara cuando el pool conecta con éxito
pool.on('connect', () => {
    console.log('[accounts-db] Nueva conexión establecida en el pool');
});

// Evento: se dispara si hay un error en una conexión inactiva
pool.on('error', (err) => {
    console.error('[accounts-db] Error inesperado en el pool:', err.message);
    process.exit(-1); // matamos el proceso para que Docker lo reinicie
});

module.exports = pool;
