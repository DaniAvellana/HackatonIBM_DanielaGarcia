-- ============================================================
-- NeoWallet - processor_db
-- Crea la tabla de transacciones P2P
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id            SERIAL PRIMARY KEY,
    sender_id     INT NOT NULL,
    receiver_id   INT NOT NULL,
    amount        DECIMAL(10, 2) NOT NULL
                      CONSTRAINT amount_positive CHECK (amount > 0),
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CONSTRAINT valid_status CHECK (
                          status IN ('PENDING', 'DEBITED', 'COMPLETED', 'FAILED', 'ROLLED_BACK')
                      ),
    error_message TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar búsquedas de historial por usuario
CREATE INDEX IF NOT EXISTS idx_transactions_sender   ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);

-- Función y trigger para updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
