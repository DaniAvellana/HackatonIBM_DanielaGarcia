// Importamos express para crear las rutas
const express = require('express');
const router = express.Router();

// Importamos la conexión a la base de datos
const pool = require('../db');

// Importamos el middleware de autenticación
const { verifyToken } = require('../middleware/auth');

// GET /bookings/my → ver mis reservas (usuario autenticado)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.name as space_name, s.floor, s.type 
       FROM bookings b
       JOIN spaces s ON b.space_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.start_time DESC`,
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// GET /bookings/available → buscar espacios disponibles
router.get('/available', verifyToken, async (req, res) => {
  const { date, start_time, end_time, type, capacity } = req.query;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Fecha, hora inicio y hora fin son obligatorios' });
  }

  try {
    // Construimos la fecha y hora completa
    const startDateTime = `${date} ${start_time}`;
    const endDateTime = `${date} ${end_time}`;

    // Validamos que la hora de fin sea mayor a la de inicio
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      return res.status(400).json({ error: 'La hora de fin debe ser mayor a la hora de inicio' });
    }

    // Validamos que no sea en el pasado
    if (new Date(startDateTime) < new Date()) {
      return res.status(400).json({ error: 'No puedes reservar en el pasado' });
    }

    // Buscamos espacios que NO tengan reservas en ese horario
    let query = `
      SELECT * FROM spaces 
      WHERE id NOT IN (
        SELECT space_id FROM bookings
        WHERE status = 'ACTIVE'
        AND start_time < $2
        AND end_time > $1
      )
    `;

    const params = [startDateTime, endDateTime];

    // Filtro opcional por tipo
    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    // Filtro opcional por capacidad mínima
    if (capacity) {
      query += ` AND capacity >= $${params.length + 1}`;
      params.push(parseInt(capacity));
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);

  } catch (error) {
    res.status(500).json({ error: 'Error al buscar espacios disponibles' });
  }
});

// POST /bookings → crear una reserva
router.post('/', verifyToken, async (req, res) => {
  const { space_id, date, start_time, end_time, attendees } = req.body;

  if (!space_id || !date || !start_time || !end_time || !attendees) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const startDateTime = `${date} ${start_time}`;
  const endDateTime = `${date} ${end_time}`;

  try {
    // Validamos que la hora de fin sea mayor a la de inicio
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      return res.status(400).json({ error: 'La hora de fin debe ser mayor a la de inicio' });
    }

    // Validamos que no sea en el pasado
    if (new Date(startDateTime) < new Date()) {
      return res.status(400).json({ error: 'No puedes reservar en el pasado' });
    }

    // Verificamos que el espacio existe
    const spaceResult = await pool.query('SELECT * FROM spaces WHERE id = $1', [space_id]);
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado' });
    }

    const space = spaceResult.rows[0];

    // Validamos que la capacidad no se exceda
    if (attendees > space.capacity) {
      return res.status(400).json({ 
        error: `El espacio solo tiene capacidad para ${space.capacity} personas` 
      });
    }

    // Verificamos que no haya solapamiento con otras reservas
    const overlap = await pool.query(
      `SELECT id FROM bookings
       WHERE space_id = $1
       AND status = 'ACTIVE'
       AND start_time < $3
       AND end_time > $2`,
      [space_id, startDateTime, endDateTime]
    );

    if (overlap.rows.length > 0) {
      return res.status(409).json({ error: 'El espacio ya está reservado en ese horario' });
    }

    // Creamos la reserva
    const result = await pool.query(
      `INSERT INTO bookings (space_id, user_id, start_time, end_time, attendees)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [space_id, req.user.id, startDateTime, endDateTime, attendees]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
});

// DELETE /bookings/:id → cancelar una reserva
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificamos que la reserva pertenece al usuario
    const booking = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada o no tienes permiso' });
    }

    // Verificamos que la reserva sea futura
    if (new Date(booking.rows[0].start_time) < new Date()) {
      return res.status(400).json({ error: 'No puedes cancelar una reserva que ya pasó' });
    }

    // Cambiamos el estado a CANCELLED en lugar de borrar
    await pool.query(
      "UPDATE bookings SET status = 'CANCELLED' WHERE id = $1",
      [id]
    );

    res.status(200).json({ message: 'Reserva cancelada correctamente' });

  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
});

// Exportamos el router
module.exports = router;