-- ============================================================
-- NeoWallet - accounts_db
-- Crea la tabla de usuarios y datos semilla
-- ============================================================

-- Extensión para timestamps automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla principal de usuarios y saldos
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    balance     DECIMAL(10, 2) NOT NULL DEFAULT 0.00
                    CONSTRAINT balance_non_negative CHECK (balance >= 0),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Función para actualizar updated_at automáticamente al hacer UPDATE
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que llama a la función anterior en cada UPDATE
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Datos semilla: 3 usuarios de prueba
INSERT INTO users (name, email, balance) VALUES
    ('Usuario A (Rico)',  'usuario.a@neowallet.com', 1000.00),
    ('Usuario B (Pobre)', 'usuario.b@neowallet.com',   50.00),
    ('Usuario C (Nuevo)', 'usuario.c@neowallet.com',    0.00);
