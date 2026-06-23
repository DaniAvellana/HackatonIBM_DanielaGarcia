# language: es

Característica: Autenticación de usuarios
  Como usuario del sistema
  Quiero poder iniciar sesión
  Para acceder a las funciones según mi rol

  Escenario: Login exitoso como Administrador
    Dado que estoy en la pantalla de login
    Cuando ingreso el email "admin@corporativoalpha.com"
    Y ingreso la contraseña "Admin123"
    Y hago clic en "Iniciar Sesión"
    Entonces debo ser redirigido al panel de administración
    Y debo ver el dashboard de ocupación

  Escenario: Login exitoso como Colaborador
    Dado que estoy en la pantalla de login
    Cuando ingreso el email "carlos.mendez@corporativoalpha.com"
    Y ingreso la contraseña "User123"
    Y hago clic en "Iniciar Sesión"
    Entonces debo ser redirigido a la pantalla de búsqueda de espacios

  Escenario: Login fallido con credenciales incorrectas
    Dado que estoy en la pantalla de login
    Cuando ingreso el email "usuario@falso.com"
    Y ingreso la contraseña "12345"
    Y hago clic en "Iniciar Sesión"
    Entonces debo ver el mensaje "Credenciales inválidas"

---

Característica: Gestión de espacios
  Como administrador
  Quiero gestionar los espacios de trabajo
  Para mantener actualizado el catálogo de salas y escritorios

  Escenario: Crear un nuevo espacio exitosamente
    Dado que estoy autenticado como Administrador
    Y estoy en el panel de administración
    Cuando hago clic en "+ Nuevo Espacio"
    Y ingreso el nombre "Sala de Innovación"
    Y selecciono el tipo "Sala de juntas"
    Y ingreso la capacidad "10"
    Y ingreso el piso "Piso 4"
    Y hago clic en "Guardar Espacio"
    Entonces debo ver el nuevo espacio en la tabla

  Escenario: Eliminar un espacio existente
    Dado que estoy autenticado como Administrador
    Y existe el espacio "Sala de Innovación"
    Cuando hago clic en "Eliminar" para ese espacio
    Y confirmo la eliminación
    Entonces el espacio ya no debe aparecer en la tabla

---

Característica: Reserva de espacios
  Como colaborador
  Quiero reservar espacios de trabajo
  Para planificar mis actividades en la oficina

  Escenario: Buscar espacios disponibles con filtros
    Dado que estoy autenticado como Colaborador
    Y estoy en la pantalla de búsqueda
    Cuando selecciono la fecha "25/06/2026"
    Y ingreso la hora inicio "09:00"
    Y ingreso la hora fin "11:00"
    Y selecciono el tipo "Sala de juntas"
    Y ingreso la capacidad mínima "4"
    Y hago clic en "Buscar"
    Entonces debo ver solo salas de juntas con capacidad mayor o igual a 4

  Escenario: Crear una reserva exitosa
    Dado que estoy autenticado como Colaborador
    Y hay espacios disponibles para la fecha seleccionada
    Cuando hago clic en "Reservar" en la "Sala Creativa"
    Y ingreso el número de asistentes "5"
    Y hago clic en "Confirmar Reserva"
    Entonces debo ver el mensaje "¡Reserva confirmada!"
    Y la reserva debe aparecer en "Mis Reservas"

  Escenario: Prevención de reservas solapadas
    Dado que existe una reserva activa en "Sala Creativa" de 09:00 a 11:00
    Cuando busco espacios disponibles para el mismo horario
    Entonces la "Sala Creativa" no debe aparecer en los resultados

  Escenario: Validación de capacidad excedida
    Dado que estoy autenticado como Colaborador
    Y el "Escritorio Ventana" tiene capacidad para 1 persona
    Cuando intento reservarlo para 5 asistentes
    Entonces debo ver el mensaje "El espacio solo tiene capacidad para 1 personas"

  Escenario: No permitir reservas en fechas pasadas
    Dado que estoy autenticado como Colaborador
    Cuando selecciono una fecha anterior a hoy
    Y hago clic en "Buscar"
    Entonces debo ver el mensaje "La hora de inicio ya pasó"

  Escenario: Cancelar una reserva futura
    Dado que estoy autenticado como Colaborador
    Y tengo una reserva activa en el futuro
    Cuando hago clic en "Cancelar Reserva"
    Y confirmo la cancelación
    Entonces la reserva debe mostrar el estado "Cancelada"

---

Característica: Seguridad y control de acceso
  Como sistema
  Quiero controlar el acceso según el rol del usuario
  Para garantizar la seguridad de la información

  Escenario: Colaborador no puede acceder al panel de Admin
    Dado que estoy autenticado como Colaborador
    Cuando intento acceder a "/admin" directamente en el navegador
    Entonces debo ser redirigido al login

  Escenario: Usuario no autenticado no puede hacer reservas
    Dado que no estoy autenticado
    Cuando intento acceder a "/search" directamente
    Entonces debo ser redirigido al login