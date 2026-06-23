// Importamos jsonwebtoken para verificar el token
const jwt = require('jsonwebtoken');

// Esta función es el "guardia de seguridad"
const verifyToken = (req, res, next) => {

  // Leemos el token del header de la petición
  const authHeader = req.headers['authorization'];

  // Si no viene ningún token, rechazamos la petición
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado' });
  }

  // El token viene como "Bearer eyJ..." entonces separamos solo la parte del token
  const token = authHeader.split(' ')[1];

  // Verificamos que el token sea válido usando nuestra clave secreta
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos los datos del usuario en la petición para usarlos después
    req.user = decoded;

    // Le decimos a Express que continúe con el siguiente paso
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