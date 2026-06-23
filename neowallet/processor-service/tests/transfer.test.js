/**
 * =============================================================
 * SUITE DE PRUEBAS - Processor Service
 * NeoWallet MVP | QA Engineer: Automatizado con Jest + Supertest
 * Casos cubiertos: RF-003, CU-001..005, RN-001..006, RNF-006
 * =============================================================
 *
 * MOCKS ACTIVOS:
 *   1. pool (pg) → simula processor_db sin necesitar PostgreSQL
 *   2. AccountsClient → simula accounts-service sin necesitar HTTP real
 *
 * PATRÓN SAGA TESTEADO:
 *   PENDING → DEBITED → COMPLETED        (éxito)
 *   PENDING → FAILED                     (débito falla)
 *   PENDING → DEBITED → ROLLED_BACK      (crédito falla, compensación ejecutada)
 */

jest.mock('../src/config/database', () => ({
    query: jest.fn(),
    on:    jest.fn(),
}));

jest.mock('../src/config/accountsClient');

const request         = require('supertest');
const { app, server } = require('../src/index');
const pool            = require('../src/config/database');
const AccountsClient  = require('../src/config/accountsClient');

afterAll(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => jest.clearAllMocks());

// Helper: simula una transferencia exitosa completa
function mockTransferenciaExitosa(txId = 1, senderId = 1, receiverId = 2, amount = 100) {
    AccountsClient.getAccount
        .mockResolvedValueOnce({ success: true, data: { id: senderId,   balance: 1000 } })
        .mockResolvedValueOnce({ success: true, data: { id: receiverId, balance: 50   } });
    pool.query.mockResolvedValueOnce({
        rows: [{ id: txId, sender_id: senderId, receiver_id: receiverId, amount, status: 'PENDING' }],
    });
    AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 900 } });
    pool.query.mockResolvedValueOnce({ rows: [{ id: txId, status: 'DEBITED' }] });
    AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 150 } });
    pool.query.mockResolvedValueOnce({ rows: [{ id: txId, status: 'COMPLETED' }] });
}

// =============================================================
// SUITE RF-003 / CU-001: Transferencia P2P Exitosa
// =============================================================
describe('RF-003 | CU-001 — Transferencia P2P Exitosa', () => {

    test('TC-023 ✅ [HAPPY PATH] Transferencia completa → COMPLETED, saldos actualizados', async () => {
        mockTransferenciaExitosa(101, 1, 2, 100);

        const start = Date.now();
        const res   = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 100 });
        const ms = Date.now() - start;

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('COMPLETED');
        expect(res.body.transaction_id).toBe(101);
        expect(res.body.sender_id).toBe(1);
        expect(res.body.receiver_id).toBe(2);
        expect(res.body.amount).toBe(100);
        expect(res.body.timestamp).toBeDefined();
        // RNF-001: transferencia < 500ms
        expect(ms).toBeLessThan(500);
    });

    test('TC-024 ✅ [HAPPY PATH] La transacción pasa por estados: PENDING → DEBITED → COMPLETED', async () => {
        mockTransferenciaExitosa(102, 1, 2, 50);

        await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 50 });

        // Verificar que el flujo de estados fue correcto
        // Query 1: INSERT (PENDING), Query 2: UPDATE DEBITED, Query 3: UPDATE COMPLETED
        expect(pool.query).toHaveBeenCalledTimes(3);

        const insertCall  = pool.query.mock.calls[0][0];
        const debitUpdate = pool.query.mock.calls[1][1]; // args del 2do query
        const doneUpdate  = pool.query.mock.calls[2][1];

        expect(insertCall).toContain('PENDING');
        expect(debitUpdate[0]).toBe('DEBITED');
        expect(doneUpdate[0]).toBe('COMPLETED');
    });

    test('TC-025 ✅ [RN-004] La suma total de dinero permanece constante tras transferencia', async () => {
        // Verifica que el dinero debitado al sender == dinero acreditado al receiver
        mockTransferenciaExitosa(103, 1, 2, 250);

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 250 });

        expect(res.status).toBe(200);

        // El mismo amount que se envía al debit se envía al credit
        const debitCall  = AccountsClient.updateBalance.mock.calls[0];
        const creditCall = AccountsClient.updateBalance.mock.calls[1];

        expect(debitCall[1]).toBe(250);   // amount del débito
        expect(creditCall[1]).toBe(250);  // amount del crédito
        expect(debitCall[1]).toBe(creditCall[1]); // son iguales → no se crea ni destruye dinero
    });

    test('TC-026 ✅ [HAPPY PATH] Transferencia con monto decimal (99.99)', async () => {
        mockTransferenciaExitosa(104, 1, 2, 99.99);

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 99.99 });

        expect(res.status).toBe(200);
        expect(res.body.amount).toBe(99.99);
    });
});

// =============================================================
// SUITE CU-002: Fondos Insuficientes
// =============================================================
describe('CU-002 — Fondos Insuficientes', () => {

    test('TC-027 ❌ [ALT FLOW] 400 cuando el sender no tiene fondos → transacción FAILED', async () => {
        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true, data: { id: 2, balance: 50   } })
            .mockResolvedValueOnce({ success: true, data: { id: 1, balance: 1000 } });

        pool.query.mockResolvedValueOnce({
            rows: [{ id: 105, sender_id: 2, receiver_id: 1, amount: 100, status: 'PENDING' }],
        });

        // Débito falla por fondos insuficientes
        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: false,
            error:   'Fondos insuficientes para realizar el débito',
            code:    'INSUFFICIENT_FUNDS',
        });

        // Transacción se marca FAILED
        pool.query.mockResolvedValueOnce({ rows: [{ id: 105, status: 'FAILED' }] });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 2, receiver_id: 1, amount: 100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INSUFFICIENT_FUNDS');

        // CRÍTICO: el receiver NUNCA debe recibir crédito si el débito falló
        expect(AccountsClient.updateBalance).toHaveBeenCalledTimes(1);

        // El estado debe quedar FAILED (no ROLLED_BACK, porque nunca hubo débito exitoso)
        const failedCall = pool.query.mock.calls[1][1];
        expect(failedCall[0]).toBe('FAILED');
    });

    test('TC-028 ❌ [RN-006] El saldo del sender no puede quedar negativo', async () => {
        // Usuario B tiene $50, intenta transferir $50.01
        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true, data: { id: 2, balance: 50     } })
            .mockResolvedValueOnce({ success: true, data: { id: 1, balance: 1000   } });

        pool.query.mockResolvedValueOnce({
            rows: [{ id: 106, sender_id: 2, receiver_id: 1, amount: 50.01, status: 'PENDING' }],
        });

        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: false,
            error:   'Fondos insuficientes',
            code:    'INSUFFICIENT_FUNDS',
        });

        pool.query.mockResolvedValueOnce({ rows: [{ id: 106, status: 'FAILED' }] });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 2, receiver_id: 1, amount: 50.01 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    });
});

// =============================================================
// SUITE CU-003: Auto-transferencia Prohibida (RN-002)
// =============================================================
describe('CU-003 | RN-002 — Auto-transferencia Prohibida', () => {

    test('TC-029 ❌ [RN-002] 400 cuando sender_id === receiver_id → bloqueado antes de BD', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 1, amount: 100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('SELF_TRANSFER_NOT_ALLOWED');

        // CRÍTICO: nunca se debe consultar la BD ni el Accounts Service
        expect(pool.query).not.toHaveBeenCalled();
        expect(AccountsClient.getAccount).not.toHaveBeenCalled();
        expect(AccountsClient.updateBalance).not.toHaveBeenCalled();
    });

    test('TC-030 ❌ [RN-002] Auto-transferencia bloqueada con cualquier ID', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 99, receiver_id: 99, amount: 500 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('SELF_TRANSFER_NOT_ALLOWED');
        expect(pool.query).not.toHaveBeenCalled();
    });
});

// =============================================================
// SUITE CU-005 / RNF-006: Patrón Saga — Compensación
// ESTE ES EL TEST MÁS CRÍTICO DEL SISTEMA
// =============================================================
describe('CU-005 | RNF-006 — Patrón Saga: Compensación (CRITICAL PATH)', () => {

    test('TC-031 ✅ [SAGA] Fallo en crédito → débito revertido → ROLLED_BACK (dinero conservado)', async () => {
        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true, data: { id: 1, balance: 1000 } })
            .mockResolvedValueOnce({ success: true, data: { id: 2, balance: 50   } });

        pool.query.mockResolvedValueOnce({
            rows: [{ id: 107, sender_id: 1, receiver_id: 2, amount: 100, status: 'PENDING' }],
        });

        // PASO 2: Débito exitoso
        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: true, data: { new_balance: 900 }
        });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 107, status: 'DEBITED' }] });

        // PASO 3: Crédito FALLA (simula caída del accounts-service)
        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: false,
            error:   'Accounts Service no disponible',
            code:    'ACCOUNTS_SERVICE_UNAVAILABLE',
        });

        // COMPENSACIÓN: devolver dinero al sender → éxito
        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: true, data: { new_balance: 1000 }
        });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 107, status: 'ROLLED_BACK' }] });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 100 });

        expect(res.status).toBe(502);
        expect(res.body.code).toBe('TRANSFER_ROLLED_BACK');

        // Verificar los 3 llamados exactos al Accounts Service:
        expect(AccountsClient.updateBalance).toHaveBeenCalledTimes(3);

        const calls = AccountsClient.updateBalance.mock.calls;
        // Llamada 1: debitar al sender
        expect(calls[0]).toEqual([1, 100, 'debit']);
        // Llamada 2: acreditar al receiver (FALLA)
        expect(calls[1]).toEqual([2, 100, 'credit']);
        // Llamada 3: COMPENSACIÓN → devolver al sender
        expect(calls[2]).toEqual([1, 100, 'credit']);

        // Verificar que el estado final es ROLLED_BACK
        const rolledBackUpdate = pool.query.mock.calls[pool.query.mock.calls.length - 1][1];
        expect(rolledBackUpdate[0]).toBe('ROLLED_BACK');
    });

    test('TC-032 ✅ [SAGA] Fallo por timeout de red → misma compensación', async () => {
        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true, data: { id: 1, balance: 500 } })
            .mockResolvedValueOnce({ success: true, data: { id: 3, balance: 0   } });

        pool.query.mockResolvedValueOnce({
            rows: [{ id: 108, sender_id: 1, receiver_id: 3, amount: 200, status: 'PENDING' }],
        });

        AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 300 } });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 108, status: 'DEBITED' }] });

        // Simula timeout de red en el crédito
        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: false,
            error:   'Connection timeout',
            code:    'ACCOUNTS_SERVICE_UNAVAILABLE',
        });

        // Compensación exitosa
        AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 500 } });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 108, status: 'ROLLED_BACK' }] });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 3, amount: 200 });

        expect(res.status).toBe(502);
        expect(res.body.code).toBe('TRANSFER_ROLLED_BACK');

        // La compensación SIEMPRE debe ejecutarse ante cualquier fallo de crédito
        expect(AccountsClient.updateBalance).toHaveBeenCalledTimes(3);
        expect(AccountsClient.updateBalance.mock.calls[2][2]).toBe('credit'); // compensación = crédito al sender
    });

    test('TC-033 ✅ [SAGA] RN-004 verificado: no se crea ni destruye dinero en compensación', async () => {
        const AMOUNT = 300;

        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true, data: { id: 1, balance: 1000 } })
            .mockResolvedValueOnce({ success: true, data: { id: 2, balance: 50   } });

        pool.query.mockResolvedValueOnce({
            rows: [{ id: 109, sender_id: 1, receiver_id: 2, amount: AMOUNT, status: 'PENDING' }],
        });

        AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 700 } });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 109, status: 'DEBITED' }] });

        AccountsClient.updateBalance.mockResolvedValueOnce({
            success: false, error: 'Error', code: 'ACCOUNTS_SERVICE_UNAVAILABLE',
        });

        AccountsClient.updateBalance.mockResolvedValueOnce({ success: true, data: { new_balance: 1000 } });
        pool.query.mockResolvedValueOnce({ rows: [{ id: 109, status: 'ROLLED_BACK' }] });

        await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: AMOUNT });

        const calls = AccountsClient.updateBalance.mock.calls;
        // El monto del débito debe ser igual al monto de la compensación
        expect(calls[0][1]).toBe(AMOUNT); // débito
        expect(calls[2][1]).toBe(AMOUNT); // compensación
    });
});

// =============================================================
// SUITE: Validaciones de Input (RN-001)
// =============================================================
describe('RN-001 — Validaciones de Montos y Campos', () => {

    test('TC-034 ❌ 400 cuando el monto es negativo', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: -50 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_AMOUNT');
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('TC-035 ❌ 400 cuando el monto es cero', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 2, amount: 0 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_AMOUNT');
    });

    test('TC-036 ❌ 400 cuando falta el receiver_id', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, amount: 100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('MISSING_FIELDS');
    });

    test('TC-037 ❌ 400 cuando falta el sender_id', async () => {
        const res = await request(app)
            .post('/api/transfer')
            .send({ receiver_id: 2, amount: 100 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('MISSING_FIELDS');
    });

    test('TC-038 ❌ 404 cuando el sender no existe', async () => {
        AccountsClient.getAccount.mockResolvedValueOnce({
            success: false, code: 'USER_NOT_FOUND',
        });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 999, receiver_id: 2, amount: 100 });

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('USER_NOT_FOUND');
        // El receiver nunca debe verificarse si el sender no existe
        expect(AccountsClient.getAccount).toHaveBeenCalledTimes(1);
    });

    test('TC-039 ❌ 404 cuando el receiver no existe', async () => {
        AccountsClient.getAccount
            .mockResolvedValueOnce({ success: true,  data: { id: 1 } })
            .mockResolvedValueOnce({ success: false, code: 'USER_NOT_FOUND' });

        const res = await request(app)
            .post('/api/transfer')
            .send({ sender_id: 1, receiver_id: 999, amount: 100 });

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('USER_NOT_FOUND');
    });
});

// =============================================================
// SUITE RF-005 (Bonus): Historial de Transacciones
// =============================================================
describe('RF-005 | Historial de Transacciones (Bonus)', () => {

    test('TC-040 ✅ 200 retorna historial con tipos sent/received', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                { id: 1, sender_id: 1, receiver_id: 2, amount: '100.00', status: 'COMPLETED', type: 'sent',     created_at: new Date() },
                { id: 2, sender_id: 3, receiver_id: 1, amount:  '50.00', status: 'COMPLETED', type: 'received', created_at: new Date() },
            ],
        });

        const res = await request(app).get('/api/transactions/1');

        expect(res.status).toBe(200);
        expect(res.body.user_id).toBe(1);
        expect(res.body.total).toBe(2);
        expect(res.body.transactions[0].type).toBe('sent');
        expect(res.body.transactions[1].type).toBe('received');
    });

    test('TC-041 ✅ 200 lista vacía si el usuario no tiene transacciones', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/transactions/3');

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
        expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    test('TC-042 ❌ 400 ID inválido en historial', async () => {
        const res = await request(app).get('/api/transactions/abc');

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('INVALID_ID');
        expect(pool.query).not.toHaveBeenCalled();
    });
});

// =============================================================
// SUITE: Health Check
// =============================================================
describe('Health Check', () => {
    test('TC-043 ✅ GET /health — Servicio responde OK con URL de Accounts', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.service).toBe('processor-service');
        expect(res.body.time).toBeDefined();
    });
});
