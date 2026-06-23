/**
 * middleware/errorHandler.js - Processor Service
 */

function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path} ->`, err.message);

    const status  = err.statusCode || 500;
    const code    = err.code       || 'INTERNAL_SERVER_ERROR';
    const message = status === 500 ? 'Error interno del servidor' : err.message;

    return res.status(status).json({ error: message, code });
}

function notFound(req, res) {
    return res.status(404).json({
        error: `Ruta ${req.method} ${req.path} no encontrada`,
        code:  'ROUTE_NOT_FOUND',
    });
}

module.exports = { errorHandler, notFound };
