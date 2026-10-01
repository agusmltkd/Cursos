# Cursos de adiestramiento de tacógrafos · WORTACH

- `index.html`: formulario público (sin foto del DNI; pide el correo del centro técnico, que recibe copia de los avisos). Los centros técnicos ven las convocatorias con plazas en tiempo real y se inscriben (con lista de espera automática).
- `admin.html`: panel de gestión (requiere usuario autorizado). Sirve para cursos, inscritos, bajas, cambios de curso, asistencia, renovaciones por técnico y cola de correos.

Backend: proyecto de Supabase **Cursos Adiestramiento Wortach** (`ylnwqtgyfeqihggjneba`).

- Tablas: `cursos`, `centros`, `tecnicos`, `inscripciones`, `correos` y `admins`. RLS solo para admins.
- Funciones públicas: `cursos_disponibles()` e `inscribir(...)`. Las plazas se asignan por orden y la lista de espera sube sola cuando alguien se da de baja.
- Importación de registros antiguos desde el panel (botón "Importar Excel", función `importar_inscripciones`).
- Edge Function `enviar-correos` (Resend), lanzada cada 15 min con pg_cron. Se necesita el secreto `RESEND_API_KEY` y, opcionalmente, `CORREO_REMITENTE`.
- Para dar acceso al panel a alguien más: `insert into admins(email) values ('correo@...')` y crear su usuario en Authentication → Users.
