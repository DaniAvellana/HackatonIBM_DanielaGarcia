/**
 * middleware/errorHandler.js - Accounts Service
 *
 * Middleware de manejo de errores global.
 * Express lo identifica porque tiene 4 parámetros: (err, req, res, next)
 *
 * Si cualquier controlador llama a next(err) o lanza una excepción
 * sin capturar, este middleware la intercepta y responde en JSON.
 */

function errorHandler(err, req, res, next) {
    // Log del error para debugging
    console.error(`[ERROR] ${req.method} ${req.path} ->`, err.message);

    const status  = err.statusCode || 500;
    const code    = err.code       || 'INTERNAL_SERVER_ERROR';
    const message = status === 500
        ? 'Error interno del servidor'
        : err.message;

    return res.status(status).json({ error: message, code });
}

/**
 * Middleware para rutas no encontradas (404)
 */
function notFound(req, res) {
    return res.status(404).json({
        error:   `Ruta ${req.method} ${req.path} no encontrada`,
        code:    'ROUTE_NOT_FOUND',
    });
}

module.exports = { errorHandler, notFound };
