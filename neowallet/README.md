# 💳 NeoWallet — Sistema de Pagos P2P

**MVP de billetera digital** con arquitectura de microservicios desacoplada.  
Cliente: FastPay (Startup Fintech) | Versión: 1.0 | Estado: ✅ Producción local

---

## 🏗️ Arquitectura del Sistema

```
                        CLIENTE
                   (Postman / Navegador)
                          │
              ┌───────────┴───────────┐
              │ HTTP                  │ HTTP
              ▼                       ▼
  ┌─────────────────────┐  ┌──────────────────────┐
  │  accounts-service   │◄─│  processor-service   │
  │     Puerto 3000     │  │     Puerto 3001      │
  │                     │  │                      │
  │ GET  /accounts/:id  │  │ POST /api/transfer   │
  │ POST /api/recharge  │  │ GET  /api/transactions│
  │ POST /update-balance│  │                      │
  └────────┬────────────┘  └──────────┬───────────┘
           │ SQL                      │ SQL
           ▼                          ▼
   ┌──────────────┐          ┌──────────────┐
   │ accounts_db  │          │ processor_db │
   │ Puerto 5432  │          │ Puerto 5433  │
   │ Tabla: users │          │ Tabla: trans.│
   └──────────────┘          └──────────────┘
```

### Patrón: Database per Service
Cada microservicio es dueño exclusivo de su base de datos. El `processor-service` **nunca** accede directamente a `accounts_db` — se comunica vía HTTP con el `accounts-service`.

### Patrón Saga (Compensación)
La transferencia P2P sigue un flujo de compensación para garantizar que no se pierda dinero:

```
PENDING → DEBITED → COMPLETED          (flujo exitoso)
PENDING → FAILED                       (débito falla → sin cambios)
PENDING → DEBITED → ROLLED_BACK        (crédito falla → se revierte el débito)
```

---

## 📋 Requisitos Previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |
| Node.js (opcional, para tests locales) | 18+ | `node --version` |
| Git | 2.0+ | `git --version` |

---

## ⚡ Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/HackatonIBM_DanielaGarcia.git
cd HackatonIBM_DanielaGarcia/neowallet
```

### 2. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita con tus credenciales (o deja los valores por defecto para desarrollo)
notepad .env          # Windows
nano .env             # Linux/Mac
```

Contenido del `.env`:
```env
ACCOUNTS_DB_USER=accounts_user
ACCOUNTS_DB_PASSWORD=accounts_secret_pass
PROCESSOR_DB_USER=processor_user
PROCESSOR_DB_PASSWORD=processor_secret_pass
```

### 3. Levantar el sistema completo

```bash
# Primera vez (descarga imágenes y construye)
docker-compose up --build

# Las siguientes veces
docker-compose up
```

Espera hasta ver:
```
[accounts-service]  Corriendo en puerto 3000
[processor-service] Corriendo en puerto 3001
```

### 4. Verificar que funciona

Abre en el navegador: `http://localhost:3000/accounts/1`

Debes ver:
```json
{
  "id": 1,
  "name": "Usuario A (Rico)",
  "balance": "1000.00"
}
```

---

## 🔌 Endpoints de la API

### Accounts Service (Puerto 3000)

| Método | Endpoint | Descripción | Body |
|---|---|---|---|
| GET | `/accounts/:id` | Consultar saldo | — |
| POST | `/api/recharge` | Recargar saldo | `{ user_id, amount, payment_method }` |
| POST | `/accounts/update-balance` | Actualizar balance (interno) | `{ user_id, amount, operation }` |
| GET | `/health` | Health check | — |

### Processor Service (Puerto 3001)

| Método | Endpoint | Descripción | Body |
|---|---|---|---|
| POST | `/api/transfer` | Transferencia P2P | `{ sender_id, receiver_id, amount }` |
| GET | `/api/transactions/:user_id` | Historial (bonus) | — |
| GET | `/health` | Health check | — |

---

## 🧪 Pruebas

### Ejecutar todos los tests

```bash
# Tests del accounts-service
cd accounts-service
npm install
npm test

# Tests del processor-service
cd ../processor-service
npm install
npm test
```

### Resultado esperado

```
accounts-service:  22 tests ✅ | Cobertura: 83%
processor-service: 21 tests ✅ | Cobertura: 84%
Total:             43 tests ✅
```

### Ejemplos de pruebas manuales (PowerShell)

```powershell
# 1. Consultar saldo
Invoke-RestMethod http://localhost:3000/accounts/1

# 2. Recargar saldo
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/recharge `
  -ContentType "application/json" `
  -Body '{"user_id":2,"amount":500,"payment_method":"CARD"}'

# 3. Transferir dinero P2P
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/transfer `
  -ContentType "application/json" `
  -Body '{"sender_id":1,"receiver_id":2,"amount":100}'

# 4. Ver historial
Invoke-RestMethod http://localhost:3001/api/transactions/1
```

---

## 🗃️ Modelo de Datos

### accounts_db — Tabla users
```sql
id        SERIAL PRIMARY KEY
name      VARCHAR(100) NOT NULL
email     VARCHAR(100) UNIQUE NOT NULL
balance   DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0)
```

### processor_db — Tabla transactions
```sql
id            SERIAL PRIMARY KEY
sender_id     INT NOT NULL
receiver_id   INT NOT NULL
amount        DECIMAL(10,2) CHECK (amount > 0)
status        VARCHAR(20) CHECK (IN 'PENDING','DEBITED','COMPLETED','FAILED','ROLLED_BACK')
error_message TEXT
```

### Datos semilla (incluidos automáticamente)
| ID | Nombre | Balance |
|---|---|---|
| 1 | Usuario A (Rico) | $1,000.00 |
| 2 | Usuario B (Pobre) | $50.00 |
| 3 | Usuario C (Nuevo) | $0.00 |

---

## 🐳 Comandos Docker útiles

```bash
# Ver contenedores corriendo
docker ps

# Ver logs en tiempo real
docker logs neowallet_accounts_service -f
docker logs neowallet_processor_service -f

# Apagar y eliminar contenedores
docker-compose down

# Apagar y eliminar contenedores + datos (reset total)
docker-compose down -v

# Reconstruir solo un servicio
docker-compose up --build accounts-service
```

---

## 📁 Estructura del Proyecto

```
neowallet/
├── docker-compose.yml
├── .env                          ← NO se sube a Git
├── .env.example                  ← Plantilla pública
├── .gitignore
├── README.md
├── database/
│   ├── accounts-db/init.sql      ← Crea tabla users + seed data
│   └── processor-db/init.sql     ← Crea tabla transactions
├── accounts-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js              ← Punto de entrada
│   │   ├── config/database.js    ← Pool PostgreSQL
│   │   ├── models/userModel.js   ← Queries SQL
│   │   ├── services/accountService.js  ← Lógica de negocio
│   │   ├── controllers/accountController.js  ← HTTP
│   │   ├── routes/accountRoutes.js
│   │   └── middleware/errorHandler.js
│   └── tests/accounts.test.js    ← 22 tests
└── processor-service/
    ├── Dockerfile
    ├── package.json
    ├── src/
    │   ├── index.js
    │   ├── config/
    │   │   ├── database.js
    │   │   └── accountsClient.js ← Cliente HTTP → accounts-service
    │   ├── models/transactionModel.js
    │   ├── services/transferService.js  ← Patrón Saga aquí
    │   ├── controllers/transferController.js
    │   ├── routes/transferRoutes.js
    │   └── middleware/errorHandler.js
    └── tests/transfer.test.js    ← 21 tests
```

---

## 👥 Reglas de Negocio Implementadas

| ID | Regla | Implementación |
|---|---|---|
| RN-001 | Montos siempre > 0 | Validación en servicio antes de tocar BD |
| RN-002 | No auto-transferencias | `sender_id !== receiver_id` verificado primero |
| RN-003 | Verificar fondos antes de debitar | `WHERE balance >= $1` en SQL |
| RN-004 | Suma de dinero constante | Patrón Saga con compensación |
| RN-005 | Precisión de 2 decimales | `DECIMAL(10,2)` en BD + `ROUND()` en queries |
| RN-006 | Saldo nunca negativo | `CHECK (balance >= 0)` en BD |

---

## 🤝 Tecnologías

- **Runtime:** Node.js 20
- **Framework:** Express 4
- **Base de datos:** PostgreSQL 15
- **ORM/Driver:** pg (node-postgres)
- **Contenedores:** Docker + Docker Compose
- **Testing:** Jest + Supertest
- **Seguridad:** Prepared Statements (anti SQL Injection)
