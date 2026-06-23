// Importamos express para crear las rutas
const express = require('express');
const router = express.Router();

// Importamos la conexión a la base de datos
const pool = require('../db');

// Importamos el middleware de autenticación
const { verifyToken, verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /spaces:
 *   get:
 *     summary: Obtener todos los espacios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de espacios
 */

// GET /spaces → obtener todos los espacios (cualquier usuario autenticado)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spaces ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener espacios' });
  }
});

/**
 * @swagger
 * /spaces:
 *   post:
 *     summary: Crear un nuevo espacio (solo Admin)
 *     security:
 *       - bearerAuth: []
 */

// POST /spaces → crear un espacio nuevo (solo ADMINISTRADOR)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  const { name, type, capacity, floor, has_projector, has_ac,
          has_microphone, has_screen, has_long_tables,
          has_movable_chairs, has_whiteboard } = req.body;

  // Validamos los campos obligatorios
  if (!name || !type || !capacity) {
    return res.status(400).json({ error: 'Nombre, tipo y capacidad son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO spaces 
       (name, type, capacity, floor, has_projector, has_ac, has_microphone, 
        has_screen, has_long_tables, has_movable_chairs, has_whiteboard)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, type, capacity, floor, has_projector, has_ac,
       has_microphone, has_screen, has_long_tables, has_movable_chairs, has_whiteboard]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear espacio' });
  }
});

// PUT /spaces/:id → editar un espacio (solo ADMINISTRADOR)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, type, capacity, floor, has_projector, has_ac,
          has_microphone, has_screen, has_long_tables,
          has_movable_chairs, has_whiteboard } = req.body;

  try {
    const result = await pool.query(
      `UPDATE spaces SET 
       name=$1, type=$2, capacity=$3, floor=$4, has_projector=$5, has_ac=$6,
       has_microphone=$7, has_screen=$8, has_long_tables=$9,
       has_movable_chairs=$10, has_whiteboard=$11
       WHERE id=$12 RETURNING *`,
      [name, type, capacity, floor, has_projector, has_ac,
       has_microphone, has_screen, has_long_tables,
       has_movable_chairs, has_whiteboard, id]
    );

    // Si no encontró el espacio con ese id
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar espacio' });
  }
});

// DELETE /spaces/:id → eliminar un espacio (solo ADMINISTRADOR)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM spaces WHERE id=$1 RETURNING *', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    res.status(200).json({ message: 'Espacio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar espacio' });
  }
});

// Exportamos el router
module.exports = router;