
const jwt = require('jsonwebtoken');

// Esta función es el "guardia de seguridad"
const verifyToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Función que verifica si el usuario es ADMINISTRADOR
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador' });
  }
  next();
};

// Exportamos las dos funciones para usarlas en las rutas
module.exports = { verifyToken, verifyAdmin };