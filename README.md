# Cursos de adiestramiento de tacógrafos · WORTACH

- `index.html`: formulario público. La dirección que se comparte es https://www.wortach.com/curso-adiestramiento (la que sale en los correos y en la guía PDF); el enlace propio de cada taller (`taller.html`) sigue llevando a esta página con sus datos ya rellenos (sin foto del DNI; pide el correo del centro técnico, que recibe copia de los avisos). Los centros técnicos ven las convocatorias con plazas en tiempo real y se inscriben (con lista de espera automática).
  - **Formación VDO Sevilla**: con `?sede=vdo` (https://agusmltkd.github.io/Cursos/?sede=vdo) el mismo formulario muestra solo las convocatorias VDO; sin ese parámetro no salen. Los cursos VDO (sede `VDO Sevilla`) no envían correos, no tienen examen, certificados ni comunicaciones y no cuentan para la caducidad del adiestramiento WORTACH; en el panel van en su pestaña «VDO» (y en el Panel) con el registro de asistencia de VDO (Formato Mod. P85003F01). Solo los ven los administradores y el coordinador asignado a cada curso (`puede_sede` de una sede VDO = `es_superadmin()`); en pantalla se llaman «TIPO A Reciclaje».
- `admin.html`: panel de gestión (requiere usuario autorizado). Sirve para cursos, inscritos, bajas, cambios de curso, asistencia, renovaciones por técnico y cola de correos.

Backend: proyecto de Supabase **Cursos Adiestramiento Wortach** (`ylnwqtgyfeqihggjneba`).

- Tablas: `cursos`, `centros`, `tecnicos`, `inscripciones`, `correos` y `admins`. RLS solo para admins.
- Funciones públicas: `cursos_disponibles()` e `inscribir(...)`. Las plazas se asignan por orden y la lista de espera sube sola cuando alguien se da de baja.
- Importación de registros antiguos desde el panel (botón "Importar Excel", función `importar_inscripciones`).
- Edge Function `enviar-correos` (Resend), lanzada cada 15 min con pg_cron. Se necesita el secreto `RESEND_API_KEY` y, opcionalmente, `CORREO_REMITENTE`.
- Para dar acceso al panel a alguien más: `insert into admins(email) values ('correo@...')` y crear su usuario en Authentication → Users.
