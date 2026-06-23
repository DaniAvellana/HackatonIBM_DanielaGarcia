/**
 * =============================================================
 * SUITE DE PRUEBAS - Accounts Service
 * NeoWallet MVP | QA Engineer: Automatizado con Jest + Supertest
 * Cobertura objetivo: > 80%
 * =============================================================
 *
 * ESTRATEGIA DE MOCKING:
 * Mockeamos el pool de PostgreSQL para que los tests no necesiten
 * una BD real. Cada test controla exactamente qué "retorna" la BD.
 * Esto hace los tests: rápidos, deterministas y sin dependencias externas.
 */

jest.mock('../src/config/database', () => ({
    query: jest.fn(),
    on:    jest.fn(),
}));

const request         = require('supertest');
const { app, server } = require('../src/index');
const pool            = require('../src/config/database');

afterAll(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => jest.clearAllMocks());

// =============================================================
// SUITE RF-001: GET /accounts/:id — Consultar Saldo
// Requerimiento: 200 OK / 404 Not Found / 400 Invalid ID
// Tiempo objetivo: < 100ms (RNF-001)
// =============================================================
describe('RF-001 | GET /accounts/:id — Consultar Saldo', () => {

    test('TC-001 ✅ [HAPPY PATH] Retorna datos completos del usuario existente', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{
                id:         1,
                name:       'Usuario A (Rico)',
                email:      'usuario.a@neowallet.com',
                balance:    '1000.00',
                created_at: new Date('2026-06-23'),
                updated_at: new Date('2026-06-23'),
            }],
        });

        const start = Date.now();
        const res   = await request(app).get('/accounts/1');
        const ms    = Date.now() - start;

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
        expect(res.body.name).toBe('Usuario A (Rico)');
        expect(res.body.email).toBe('usuario.a@neowallet.com');
        expect(parseFloat(res.body.balance)).toBe(1000.00);
        // RNF-001: consulta < 100ms
        expect(ms).toBeLessThan(100);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('TC-002 ✅ [HAPPY PATH] El saldo tiene precisión de 2 decimales (RN-005)', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 2, name: 'Usuario B', email: 'b@test.com', balance: '50.00' }],
        });

        const res = await request(app).get('/accounts/2');

        expect(res.status).toBe(200);
        // Verifica precisión de 2 decimales
        expect(res.body.balance).toMatch(/^\d+\.\d{2}$|^\d+$/);
    });

    test('TC-003 ❌ [ALT FLOW] 404 cuando el usuario no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/accounts/999');

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('USER_NOT_FOUND');
        expect(res.body.error).toBeDefined();
    });

    test('TC-004 ❌ [VALIDATION] 400 cuando el ID es texto (no numérico)', async () => {
        const res = await request(app).get('/accounts/abc');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_ID');
        // CRÍTICO: la BD nunca se debe consultar con un ID inválido
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-005 ❌ [VALIDATION] 400 cuando el ID es negativo', async () => {
        const res = await request(app).get('/accounts/-5');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_ID');
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-006 ❌ [VALIDATION] 400 cuando el ID es cero', async () => {
        const res = await request(app).get('/accounts/0');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_ID');
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-007 ❌ [VALIDATION] 400 cuando el ID tiene caracteres especiales', async () => {
        const res = await request(app).get('/accounts/usuario_malo');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_ID');
        // SQL Injection prevenido por validación de tipo + prepared statements
        expect(pool.query).not.toHaveBeenCalled();
    });
});

// =============================================================
// SUITE RF-002: POST /api/recharge — Recargar Saldo
// Requerimiento: valida montos > 0, retorna nuevo saldo
// Tiempo objetivo: < 200ms (RNF-001)
// =============================================================
describe('RF-002 | POST /api/recharge — Recargar Saldo', () => {

    test('TC-008 ✅ [HAPPY PATH] Recarga exitosa aumenta el saldo correctamente', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Usuario A', email: 'a@test.com', balance: '1000.00' }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Usuario A', email: 'a@test.com', balance: '1200.00', updated_at: new Date() }] });

        const start = Date.now();
        const res   = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1, amount: 200, payment_method: 'CREDIT_CARD' });
        const ms = Date.now() - start;

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Recarga exitosa');
        expect(res.body.new_balance).toBe(1200);
        expect(res.body.amount_recharged).toBe(200);
        expect(res.body.payment_method).toBe('CREDIT_CARD');
        // RNF-001: recarga < 200ms
        expect(ms).toBeLessThan(200);
    });

    test('TC-009 ✅ [HAPPY PATH] Recarga con decimales (monto 50.75)', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Usuario A', email: 'a@test.com', balance: '1000.00' }] })
            .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Usuario A', email: 'a@test.com', balance: '1050.75', updated_at: new Date() }] });

        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1, amount: 50.75 });

        expect(res.status).toBe(200);
        expect(res.body.amount_recharged).toBe(50.75);
    });

    test('TC-010 ❌ [RN-001] 400 cuando el monto es negativo', async () => {
        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1, amount: -100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_AMOUNT');
        // La BD no se toca con montos inválidos
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-011 ❌ [RN-001] 400 cuando el monto es cero', async () => {
        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1, amount: 0 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_AMOUNT');
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-012 ❌ [VALIDATION] 400 cuando el monto es texto', async () => {
        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1, amount: 'cien pesos' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_AMOUNT');
    });

    test('TC-013 ❌ [VALIDATION] 400 cuando faltan campos requeridos (sin amount)', async () => {
        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 1 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('MISSING_FIELDS');
    });

    test('TC-014 ❌ [VALIDATION] 400 cuando faltan campos requeridos (sin user_id)', async () => {
        const res = await request(app)
            .post('/api/recharge')
            .send({ amount: 100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('MISSING_FIELDS');
    });

    test('TC-015 ❌ [ALT FLOW] 404 cuando el usuario no existe', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/recharge')
            .send({ user_id: 999, amount: 100 });

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('USER_NOT_FOUND');
    });
});

// =============================================================
// SUITE RF-004: POST /accounts/update-balance — Balance Interno
// Endpoint usado solo por el Processor Service (Saga)
// =============================================================
describe('RF-004 | POST /accounts/update-balance — Balance Interno', () => {

    test('TC-016 ✅ [HAPPY PATH] Débito exitoso con fondos suficientes', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 2, balance: '50.00' }] })
            .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Usuario B', new_balance: '0.00', previous_balance: '50.00' }] });

        const res = await request(app)
            .post('/accounts/update-balance')
            .send({ user_id: 2, amount: 50, operation: 'debit' });

        expect(res.status).toBe(200);
        expect(res.body.operation).toBe('debit');
        expect(res.body.new_balance).toBe(0);
        expect(res.body.previous_balance).toBe(50);
    });

    test('TC-017 ✅ [HAPPY PATH] Crédito exitoso suma al saldo', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 2, balance: '50.00' }] })
            .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Usuario B', new_balance: '150.00', previous_balance: '50.00' }] });

        const res = await request(app)
            .post('/accounts/update-balance')
            .send({ user_id: 2, amount: 100, operation: 'credit' });

        expect(res.status).toBe(200);
        expect(res.body.new_balance).toBe(150);
    });

    test('TC-018 ❌ [RN-006] 400 fondos insuficientes → saldo NO puede ser negativo', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 2, balance: '50.00' }] })
            // WHERE balance >= amount NO se cumple → rows vacío
            .mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/accounts/update-balance')
            .send({ user_id: 2, amount: 100, operation: 'debit' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    });

    test('TC-019 ❌ [VALIDATION] 400 operación desconocida', async () => {
        const res = await request(app)
            .post('/accounts/update-balance')
            .send({ user_id: 2, amount: 100, operation: 'withdraw' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_OPERATION');
    });

    test('TC-020 ❌ [VALIDATION] 400 cuando faltan campos', async () => {
        const res = await request(app)
            .post('/accounts/update-balance')
            .send({ user_id: 2, amount: 100 }); // sin operation

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('MISSING_FIELDS');
    });
});

// =============================================================
// SUITE: Health Check
// =============================================================
describe('Health Check', () => {
    test('TC-021 ✅ GET /health — Servicio responde OK', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.service).toBe('accounts-service');
        expect(res.body.time).toBeDefined();
    });

    test('TC-022 ❌ GET /ruta-inexistente — 404 para rutas no definidas', async () => {
        const res = await request(app).get('/ruta-que-no-existe');
        expect(res.status).toBe(404);
    });
});
