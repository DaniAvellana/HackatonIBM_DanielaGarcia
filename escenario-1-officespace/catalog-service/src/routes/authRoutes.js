// Importamos express para crear las rutas
const express = require('express');
const router = express.Router();

// Importamos jwt para generar el token
const jwt = require('jsonwebtoken');

// Importamos la conexión a la base de datos
const pool = require('../db');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT
 *       401:
 *         description: Credenciales inválidas
 */

// Ruta POST /auth/login -> recibe email y password
router.post('/login', async (req, res) => {

  // Extraemos email y password del cuerpo de la petición
  const { email, password } = req.body;

  // Validamos que vengan ambos datos
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios' });
  }

  try {
    // Buscamos el usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    // Si no encontramos ningún usuario con esas credenciales
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Guardamos el usuario encontrado
    const user = result.rows[0];

    // Generamos el token JWT con los datos del usuario
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Respondemos con el token y los datos del usuario
    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Exportamos el router
module.exports = router;