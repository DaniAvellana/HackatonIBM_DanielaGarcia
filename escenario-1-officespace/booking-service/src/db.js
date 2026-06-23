// Importamos el paquete pg para conectarnos a PostgreSQL
const { Pool } = require('pg');

// Importamos dotenv para leer las variables de entorno desde el archivo .env
require('dotenv').config();

// Creamos un "pool" de conexiones a la base de datos
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432
});

// Exportamos el pool para que otros archivos puedan usarlo
module.exports = pool;