/* Correos a técnicos: textos por defecto, sustitución de {variables} y el diseño HTML.
   La función de envío del servidor (enviar-correos) usa exactamente lo mismo. */
(function () {
  const POR_DEFECTO = {
    confirmacion: { nombre: "Plaza confirmada", asunto: "Plaza confirmada · Adiestramiento {curso}", titular: "Plaza confirmada",
      mensaje: "Tu plaza en el adiestramiento de tacógrafos ha quedado reservada.",
      nota: "WORTACH realizará el cargo al centro técnico el {cargo}, 45 días antes de la primera jornada." },
    lista_espera: { nombre: "Lista de espera", asunto: "Lista de espera · Adiestramiento {curso}", titular: "Estás en lista de espera",
      mensaje: "El curso que has solicitado está completo. Tu inscripción queda en lista de espera por orden de llegada y te escribiremos si se libera una plaza.", nota: "" },
    plaza_asignada: { nombre: "Plaza asignada desde la lista de espera", asunto: "Plaza asignada · Adiestramiento {curso}", titular: "Se ha liberado una plaza para ti",
      mensaje: "Tu inscripción, que estaba en lista de espera, ha quedado confirmada.", nota: "" },
    recordatorio_7: { nombre: "Recordatorio una semana antes", asunto: "Tu adiestramiento empieza en una semana", titular: "Empieza en una semana",
      mensaje: "Te recordamos las fechas y horarios del adiestramiento en el que estás inscrito.", nota: "" },
    recordatorio_1: { nombre: "Recordatorio el día anterior", asunto: "Mañana empieza tu adiestramiento de tacógrafos", titular: "Nos vemos mañana",
      mensaje: "Mañana comienza el adiestramiento. La primera jornada empieza a las {hora_inicio}.", nota: "" },
    cancelacion_curso: { nombre: "Curso cancelado", asunto: "Curso cancelado · Adiestramiento {curso}", titular: "Este curso se ha cancelado",
      mensaje: "Lamentamos comunicarte que este adiestramiento se ha cancelado, por no alcanzar el quórum mínimo o por cambios en la planificación. Nos pondremos en contacto con el centro técnico para reubicar la plaza.",
      nota: "Puedes ver otras convocatorias disponibles en {web}." },
  };
  const VARIABLES = [
    ["{nombre}", "Nombre del técnico"], ["{curso}", "Tipo y sede (Actualización · Sevilla)"], ["{tipo}", "Actualización o Iniciación"], ["{sede}", "Sevilla, Zaragoza u Online"],
    ["{fechas}", "Días del curso"], ["{anio}", "Año"], ["{hora_inicio}", "Hora de la 1ª jornada"], ["{cargo}", "Fecha del cargo (45 días antes)"], ["{web}", "Dirección de las convocatorias"],
  ];
  const COLOR = { confirmacion: "#268c56", plaza_asignada: "#268c56", recordatorio_7: "#268c56", recordatorio_1: "#268c56", lista_espera: "#a86b00", cancelacion_curso: "#b8372d" };
  const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const D = s => new Date(s + "T12:00:00Z");
  const fd = s => { const d = D(s); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`; };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const HSTD = i => i === 0 ? ["10:00", "18:30"] : ["09:00", "17:15"];
  const hora = h => String(h).replace(/^0(\d)/, "$1");

  function variables(nombre, curso, web) {
    const f = curso.fechas, cargo = D(f[0]); cargo.setUTCDate(cargo.getUTCDate() - 45);
    const tipo = curso.tipo === "iniciacion" ? "Iniciación" : "Actualización";
    const h0 = (curso.horarios && curso.horarios[0]) || HSTD(0);
    return { nombre, tipo, sede: curso.sede, curso: `${tipo} · ${curso.sede}`, anio: String(D(f[0]).getUTCFullYear()),
      fechas: f.map(fd).join(", ").replace(/, ([^,]*)$/, " y $1"), hora_inicio: hora(h0[0]),
      cargo: `${cargo.getUTCDate()} de ${MESES[cargo.getUTCMonth()]}`, web };
  }
  // sustituye {variables}; en HTML escapa el texto y convierte {web} en enlace
  function rellenar(txt, v, html) {
    return String(txt || "").replace(/\{(\w+)\}|([^{]+|\{)/g, (m, k, lit) => {
      if (k === undefined) return html ? esc(lit) : lit;
      if (!(k in v)) return html ? esc(m) : m;
      if (html && k === "web") return `<a href="${esc(v.web)}" style="color:#268c56">${esc(v.web.replace(/^https?:\/\//, ""))}</a>`;
      return html ? esc(v[k]) : v[k];
    });
  }
  function componer(tipo, plantilla, nombre, curso, web) {
    const p = { ...POR_DEFECTO[tipo], ...(plantilla || {}) }, v = variables(nombre, curso, web), color = COLOR[tipo] || "#268c56";
    const fechas = curso.fechas, anio = D(fechas[0]).getUTCFullYear();
    const filas = fechas.map((f, i) => { const h = (curso.horarios && curso.horarios[i]) || HSTD(i);
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #e1e7e3;font-size:15px;color:#16201b">${i + 1}ª jornada · ${fd(f)}</td><td style="padding:10px 0;border-bottom:1px solid #e1e7e3;font-size:15px;color:#5a6660;text-align:right;white-space:nowrap">${hora(h[0])} – ${hora(h[1])}</td></tr>`; }).join("");
    const parrafos = t => rellenar(t, v, true).split(/\n{2,}/).map(x => x.replace(/\n/g, "<br>")).join(`</p><p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#16201b">`);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;background:#f2f4f1;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f1;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border-top:5px solid #268c56">
<tr><td style="background:#ffffff;padding:22px 28px 18px;border-bottom:1px solid #e1e7e3"><img src="${esc(web)}icons/logo.png" alt="WORTACH · El mundo del tacógrafo" width="150" style="display:block;height:auto;border:0"></td></tr>
<tr><td style="padding:28px;border-left:4px solid ${color}">
<p style="margin:0 0 6px;font-size:13px;color:#5a6660">Adiestramiento de tacógrafos</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:${color === "#268c56" ? "#16201b" : color}">${rellenar(p.titular, v, true)}</h1>
<p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:#16201b">Hola ${esc(nombre)},</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#16201b">${parrafos(p.mensaje)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e4f1e9;border-radius:10px"><tr><td style="padding:16px 18px">
<p style="margin:0;font-size:17px;font-weight:bold;color:#16201b">${esc(v.curso)}</p>
<p style="margin:2px 0 8px;font-size:14px;color:#1f7448">${anio} · ${fechas.length} jornadas</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table>
</td></tr></table>
${p.nota ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.55;color:#5a6660">${parrafos(p.nota)}</p>` : ""}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e1e7e3;font-size:13px;line-height:1.6;color:#5a6660">Asistencia Técnica WORTACH<br><a href="mailto:asistencia@wortach.com" style="color:#268c56">asistencia@wortach.com</a> · 954 360 572</td></tr>
</table></td></tr></table></body></html>`;
    return { asunto: rellenar(p.asunto, v, false), html };
  }
  window.PlantillasCorreo = { POR_DEFECTO, VARIABLES, componer };
})();
