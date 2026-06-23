-- ============
-- OFFICESPACE
-- ============

-- Tabla de usuarios 
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL
);

-- Tabla de espacios (salas y escritorios)
CREATE TABLE spaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  capacity INT NOT NULL,
  floor VARCHAR(50),
  has_projector BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_microphone BOOLEAN DEFAULT false,
  has_screen BOOLEAN DEFAULT false,
  has_long_tables BOOLEAN DEFAULT false,
  has_movable_chairs BOOLEAN DEFAULT false,
  has_whiteboard BOOLEAN DEFAULT false
);

-- Tabla de reservas
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  space_id INT REFERENCES spaces(id),
  user_id INT REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  attendees INT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Usuarios de prueba predefinidos
INSERT INTO users (email, password, role) VALUES
('admin@corporativoalpha.com', 'Admin123', 'ADMINISTRADOR'),
('carlos.mendez@corporativoalpha.com', 'User123', 'COLABORADOR'),
('ana.torres@corporativoalpha.com', 'User123', 'COLABORADOR');

-- Espacios de prueba
INSERT INTO spaces (name, type, capacity, floor, has_projector, has_ac, has_microphone, has_screen, has_long_tables, has_movable_chairs, has_whiteboard) VALUES
('Sala Creativa', 'SALA', 8, 'Piso 2', true, true, true, true, false, true, true),
('Sala Ejecutiva', 'SALA', 4, 'Piso 3', true, false, false, true, true, false, false),
('Sala de Capacitación', 'SALA', 20, 'Piso 1', true, true, true, true, true, true, true),
('Escritorio Ventana', 'DESK', 1, 'Piso 1', false, true, false, false, false, false, false),
('Escritorio Silencioso', 'DESK', 1, 'Piso 2', false, false, false, false, false, false, false);