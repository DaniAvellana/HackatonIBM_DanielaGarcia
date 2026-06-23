# 📋 Casos de Prueba — OfficeSpace

## Información General
- **Proyecto:** OfficeSpace - Gestión Híbrida Inteligente
- **Versión:** 1.0.0
- **Fecha:** 23/06/2026
- **Tester:** Daniela Garcia

---

## CP-001: Login exitoso como Administrador
**Precondiciones:** El sistema está corriendo en http://localhost

| Campo | Detalle |
|-------|---------|
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Abrir http://localhost
2. Ingresar email: admin@corporativoalpha.com
3. Ingresar password: Admin123
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:** El sistema redirige al panel de administración y muestra el dashboard de ocupación.

**Resultado Obtenido:** PASS

---

## CP-002: Login exitoso como Colaborador
**Precondiciones:** El sistema está corriendo en http://localhost

| Campo | Detalle |
|-------|---------|
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Abrir http://localhost
2. Ingresar email: carlos.mendez@corporativoalpha.com
3. Ingresar password: User123
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:** El sistema redirige a la pantalla de búsqueda de espacios.

**Resultado Obtenido:** PASS

---

## CP-003: Login fallido con credenciales incorrectas
**Precondiciones:** El sistema está corriendo en http://localhost

| Campo | Detalle |
|-------|---------|
| **Módulo** | Autenticación |
| **Prioridad** | Alta |
| **Tipo** | Negativo |

**Pasos:**
1. Abrir http://localhost
2. Ingresar email: usuario@falso.com
3. Ingresar password: 12345
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:** El sistema muestra el mensaje "Credenciales inválidas. Verifica tu email y contraseña."

**Resultado Obtenido:** PASS

---

## CP-004: Crear un nuevo espacio como Administrador
**Precondiciones:** Sesión iniciada como Administrador

| Campo | Detalle |
|-------|---------|
| **Módulo** | Gestión de Espacios |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Iniciar sesión como admin
2. Hacer clic en "+ Nuevo Espacio"
3. Ingresar nombre: "Sala de Innovación"
4. Seleccionar tipo: Sala de juntas
5. Ingresar capacidad: 10
6. Ingresar piso: Piso 4
7. Marcar: Proyector, Pantalla, Pizarrón
8. Hacer clic en "Guardar Espacio"

**Resultado Esperado:** El espacio aparece en la tabla con todos sus datos.

**Resultado Obtenido:** PASS

---

## CP-005: Eliminar un espacio como Administrador
**Precondiciones:** Sesión iniciada como Administrador, existe al menos un espacio

| Campo | Detalle |
|-------|---------|
| **Módulo** | Gestión de Espacios |
| **Prioridad** | Media |
| **Tipo** | Funcional |

**Pasos:**
1. Iniciar sesión como admin
2. Hacer clic en "🗑️ Eliminar" en cualquier espacio
3. Confirmar la eliminación

**Resultado Esperado:** El espacio desaparece de la tabla.

**Resultado Obtenido:** PASS

---

## CP-006: Buscar espacios disponibles con filtros
**Precondiciones:** Sesión iniciada como Colaborador

| Campo | Detalle |
|-------|---------|
| **Módulo** | Búsqueda de Espacios |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Iniciar sesión como colaborador
2. Seleccionar fecha futura
3. Ingresar hora inicio: 09:00
4. Ingresar hora fin: 11:00
5. Seleccionar tipo: Sala de juntas
6. Ingresar capacidad mínima: 4
7. Hacer clic en "Buscar"

**Resultado Esperado:** El sistema muestra solo salas de juntas con capacidad mayor o igual a 4 disponibles en ese horario.

**Resultado Obtenido:** PASS

---

## CP-007: Crear reserva exitosa
**Precondiciones:** Sesión iniciada como Colaborador, hay espacios disponibles

| Campo | Detalle |
|-------|---------|
| **Módulo** | Reservas |
| **Prioridad** | Alta |
| **Tipo** | Funcional |

**Pasos:**
1. Buscar espacios disponibles
2. Hacer clic en "Reservar" en cualquier espacio
3. Ingresar número de asistentes: 5
4. Hacer clic en "Confirmar Reserva"

**Resultado Esperado:** El sistema muestra "¡Reserva confirmada!" con los datos de la reserva.

**Resultado Obtenido:** PASS

---

## CP-008: Prevención de reservas solapadas
**Precondiciones:** Existe una reserva activa en Sala Creativa de 09:00 a 11:00

| Campo | Detalle |
|-------|---------|
| **Módulo** | Reservas |
| **Prioridad** | Crítica |
| **Tipo** | Negativo |

**Pasos:**
1. Iniciar sesión como colaborador
2. Buscar espacios para el mismo día y horario 09:00 - 11:00
3. Verificar que la Sala Creativa NO aparece en los resultados

**Resultado Esperado:** La Sala Creativa no aparece en los resultados de búsqueda porque ya está reservada.

**Resultado Obtenido:** PASS

---

## CP-009: Validación de capacidad excedida
**Precondiciones:** Sesión iniciada como Colaborador

| Campo | Detalle |
|-------|---------|
| **Módulo** | Reservas |
| **Prioridad** | Alta |
| **Tipo** | Negativo |

**Pasos:**
1. Buscar espacios disponibles
2. Seleccionar "Escritorio Ventana" (capacidad: 1 persona)
3. Ingresar número de asistentes: 5
4. Hacer clic en "Confirmar Reserva"

**Resultado Esperado:** El sistema muestra error "El espacio solo tiene capacidad para 1 personas".

**Resultado Obtenido:** PASS

---

## CP-010: Cancelar una reserva futura
**Precondiciones:** Sesión iniciada como Colaborador, tiene al menos una reserva activa futura

| Campo | Detalle |
|-------|---------|
| **Módulo** | Mis Reservas |
| **Prioridad** | Media |
| **Tipo** | Funcional |

**Pasos:**
1. Iniciar sesión como colaborador
2. Hacer clic en "Mis Reservas"
3. Hacer clic en "🗑️ Cancelar Reserva"
4. Confirmar la cancelación

**Resultado Esperado:** La reserva cambia su estado a "Cancelada".

**Resultado Obtenido:** PASS

---

## CP-011: Colaborador no puede acceder al panel Admin
**Precondiciones:** Sesión iniciada como Colaborador

| Campo | Detalle |
|-------|---------|
| **Módulo** | Seguridad |
| **Prioridad** | Crítica |
| **Tipo** | Seguridad |

**Pasos:**
1. Iniciar sesión como colaborador
2. Intentar acceder manualmente a http://localhost/admin

**Resultado Esperado:** El sistema redirige al login sin mostrar el panel de admin.

**Resultado Obtenido:** PASS

---

## CP-012: Reserva en fecha pasada no permitida
**Precondiciones:** Sesión iniciada como Colaborador

| Campo | Detalle |
|-------|---------|
| **Módulo** | Reservas |
| **Prioridad** | Alta |
| **Tipo** | Negativo |

**Pasos:**
1. Iniciar sesión como colaborador
2. Seleccionar una fecha anterior a hoy
3. Ingresar hora inicio y fin
4. Hacer clic en "Buscar"

**Resultado Esperado:** El sistema muestra "La hora de inicio ya pasó. Por favor selecciona un horario futuro."

**Resultado Obtenido:** PASS

---

## Resumen de Resultados

| Total | PASS | FAIL |
|-------|------|------|
| 12    |  12  |   0  |