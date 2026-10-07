/* Modo práctica: imita a Supabase dentro del navegador con datos inventados.
   Nada sale del navegador y todo se pierde al recargar o salir. */
(function () {
  const hoyISO = () => { const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); };
  const D = s => new Date(s + "T12:00:00");
  const iso = d => d.toISOString().slice(0, 10);
  const mas = (s, n) => { const d = D(s); d.setDate(d.getDate() + n); return iso(d); };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Math.random().toString(16).slice(2) + Date.now().toString(16));
  const ahora = () => new Date().toISOString();
  const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const dniValido = d => { d = String(d || "").toUpperCase().replace(/[\s.\-]/g, ""); let n; if (/^[XYZ]\d{7}[A-Z]$/.test(d)) n = "XYZ".indexOf(d[0]) + d.slice(1, 8); else if (/^\d{8}[A-Z]$/.test(d)) n = d.slice(0, 8); else return false; return LETRAS[parseInt(n, 10) % 23] === d[8]; };
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,'"-]/g, "").replace(/\s+/g, " ").trim();
  const base = s => norm(s).replace(/\b(s ?l ?u?|s ?a|s ?c ?p?|c ?b|talleres|taller|y|de|del|la|el|los|las)\b/g, " ").replace(/\s+/g, " ").trim();

  /* ---------- datos inventados ---------- */
  function semilla() {
    let x = 20261007; const rnd = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const hoy = hoyISO();
    const NOMBRES = ["ANTONIO", "MANUEL", "JOSÉ", "FRANCISCO", "DAVID", "JUAN", "JAVIER", "DANIEL", "CARLOS", "MIGUEL", "PEDRO", "ALEJANDRO", "RAFAEL", "PABLO", "SERGIO", "JORGE", "LUIS", "ALBERTO", "ÁLVARO", "IVÁN", "LAURA", "MARÍA", "CARMEN", "LUCÍA", "ANA"];
    const APELLIDOS = ["GARCÍA", "RODRÍGUEZ", "GONZÁLEZ", "FERNÁNDEZ", "LÓPEZ", "MARTÍNEZ", "SÁNCHEZ", "PÉREZ", "GÓMEZ", "MARTÍN", "JIMÉNEZ", "RUIZ", "HERNÁNDEZ", "DÍAZ", "MORENO", "MUÑOZ", "ÁLVAREZ", "ROMERO", "NAVARRO", "TORRES", "DOMÍNGUEZ", "VÁZQUEZ", "RAMOS", "GIL", "SERRANO"];
    const TALLERES = [["TALLERES EL PUERTO S.L.", "Cádiz", "956"], ["TALLERES EL PUERTO", "Cádiz", "956"], ["TACÓGRAFOS GIRALDA S.L.", "Sevilla", "954"], ["VEHÍCULOS INDUSTRIALES BÉTICA S.A.", "Sevilla", "955"],
      ["ELECTRODIÉSEL GUADALQUIVIR", "Córdoba", "957"], ["TALLERES MONCAYO S.L.", "Zaragoza", "976"], ["CAMIONES DEL EBRO S.L.", "Zaragoza", "976"], ["AUTOELÉCTRICA PIRINEOS", "Huesca", "974"],
      ["TACÓGRAFOS LEVANTE S.L.", "Valencia", "963"], ["TALLERES SIERRA NEVADA", "Granada", "958"], ["INDUSTRIALES DEL SUR S.L.", "Málaga", "952"], ["TRUCKS ONUBA S.L.", "Huelva", "959"],
      ["TALLERES CANTÁBRICO S.L.", "Asturias", "985"], ["DIÉSEL TERUEL", "Teruel", "978"]];
    const dni = () => { const n = Math.floor(10000000 + rnd() * 89999999); return `${n}${LETRAS[n % 23]}`; };
    const centros = TALLERES.map(([nombre, provincia, pre], i) => ({ id: uid(), nombre, nombre_norm: norm(nombre), contacto: `${pick(NOMBRES)} ${pick(APELLIDOS)}`, telefono: i === 1 ? "956 100 200" : `${pre} ${String(100 + i * 37).padStart(3, "0")} ${String(200 + i * 11).padStart(3, "0")}`,
      email: i === 1 ? null : `taller${i + 1}@ejemplo-practica.es`, provincia, token: uid(), created_at: ahora() }));
    centros[0].telefono = "956 100 200";
    const tecnicos = Array.from({ length: 46 }, (_, i) => {
      const n = `${pick(NOMBRES)} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`, c = centros[i % centros.length];
      return { id: uid(), dni: i === 7 ? "12345678A" : dni(), nombre: n, telefono: `6${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`, email: i % 6 === 5 ? null : `tecnico${i + 1}@ejemplo-practica.es`, centro_id: c.id, created_at: ahora(), updated_at: ahora(), _ini: i % 9 !== 4 };
    });
    // firma de ejemplo dibujada al vuelo
    const firma = (() => { try { const cv = document.createElement("canvas"); cv.width = 360; cv.height = 120; const g = cv.getContext("2d"); g.strokeStyle = "#1b2a6b"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.moveTo(20, 80); for (let k = 0; k < 14; k++) g.bezierCurveTo(30 + k * 22, 20 + (k % 3) * 30, 40 + k * 22, 110 - (k % 2) * 40, 45 + k * 22, 70); g.stroke(); return cv.toDataURL("image/png"); } catch { return null; } })();
    const firmantes = [
      { id: uid(), nombre: "DOCENTE DE PRÁCTICA UNO", cargo: "Docente WORTACH", rol: "docente", firma, activo: true, created_at: ahora() },
      { id: uid(), nombre: "DOCENTE DE PRÁCTICA DOS", cargo: "Docente WORTACH", rol: "docente", firma, activo: true, created_at: ahora() },
      { id: uid(), nombre: "RESPONSABLE DE PRÁCTICA", cargo: "Responsable Centro de Formación WORTACH", rol: "aprobador", firma, activo: true, created_at: ahora() },
    ];
    // convocatorias alrededor de hoy (jueves-viernes o lunes-jueves)
    const alDia = (s, dow) => { let d = s; while (D(d).getDay() !== dow) d = mas(d, 1); return d; };
    const PLAN = [[-330, "Sevilla", "actualizacion", 10], [-300, "Zaragoza", "actualizacion", 8], [-250, "Sevilla", "iniciacion", 9], [-200, "Online", "actualizacion", 6], [-120, "Sevilla", "actualizacion", 10],
      [-60, "Zaragoza", "actualizacion", 7], [-20, "Sevilla", "actualizacion", 8], [9, "Sevilla", "actualizacion", 8], [16, "Zaragoza", "actualizacion", 3], [30, "Sevilla", "iniciacion", 12],
      [44, "Online", "actualizacion", 3], [52, "Sevilla", "actualizacion", 5], [70, "Zaragoza", "actualizacion", 1], [100, "Sevilla", "actualizacion", 0]];
    const cursos = [], inscripciones = [];
    let t = 0;
    PLAN.forEach(([off, sede, tipo, n], k) => {
      const ini = alDia(mas(hoy, off), tipo === "iniciacion" ? 1 : 4), dias = tipo === "iniciacion" ? 4 : 2;
      const fechas = Array.from({ length: dias }, (_, j) => mas(ini, j));
      const c = { id: uid(), tipo, sede, fechas, fecha_inicio: fechas[0], fecha_fin: fechas.at(-1), cupo_max: 10, quorum_min: 6, estado: off === 100 ? "cerrado" : "abierto",
        notas: null, created_at: ahora(), docente_id: off === 9 ? null : firmantes[k % 2].id, horas: tipo === "iniciacion" ? 30 : 14, horarios: null, publicado_at: off > 40 ? ahora() : mas(hoy, -200) + "T09:00:00Z" };
      cursos.push(c);
      for (let j = 0; j < n; j++) {
        const te = tecnicos[t++ % tecnicos.length];
        inscripciones.push({ id: uid(), curso_id: c.id, tecnico_id: te.id, centro_id: te.centro_id, contacto_nombre: centros.find(x => x.id === te.centro_id).contacto, contacto_telefono: null,
          dni_foto_path: null, estado: j < 10 ? "confirmada" : "lista_espera", asistio: off < 0 ? (j === 2 && off > -100 ? false : true) : null, origen: j % 4 === 0 ? "admin" : "web", notas: null,
          created_at: new Date(Date.now() - (Math.abs(off) + 10 - j) * 864e5 + (off > 0 && j > n - 3 ? 9 * 864e5 : 0)).toISOString() });
      }
    });
    const correos = inscripciones.slice(-14).map((i, k) => ({ id: uid(), inscripcion_id: i.id, tipo: k % 5 === 0 ? "recordatorio_7" : "confirmacion", estado: k === 3 ? "error" : k < 6 ? "enviado" : "pendiente", intentos: k === 3 ? 5 : 0, error: k === 3 ? "Dirección rechazada" : null, created_at: i.created_at, enviado_at: k < 6 ? ahora() : null }));
    const admins = [
      { email: "practica@wortach.com", nombre: "Usuario de práctica", sede: null, activo: true, ver_historial: true, docente_id: null, created_at: ahora() },
      { email: "zaragoza@ejemplo-practica.es", nombre: "Gestor Zaragoza (práctica)", sede: "Zaragoza", activo: true, ver_historial: false, docente_id: null, created_at: ahora() },
      { email: "docente@ejemplo-practica.es", nombre: "Docente (práctica)", sede: null, activo: true, ver_historial: false, docente_id: firmantes[0].id, created_at: ahora() },
    ];
    return { cursos, centros, tecnicos, inscripciones, firmantes, correos, admins, auditoria: [], plantillas_correo: [], ajustes: [{ clave: "cargos", valor: { precio_actualizacion: 180, precio_iniciacion: 420, iva: 21, correo_contabilidad: "contabilidad@ejemplo-practica.es" }, updated_at: ahora() }],
      avisos_descartados: [], admin_estado: [], duplicados_ignorados: [], provincias: [] };
  }

  /* ---------- vistas calculadas ---------- */
  function tecnicosEstado(db) {
    const hoy = hoyISO(), cur = new Map(db.cursos.map(c => [c.id, c])), cen = new Map(db.centros.map(c => [c.id, c]));
    return db.tecnicos.map(t => {
      const ins = db.inscripciones.filter(i => i.tecnico_id === t.id);
      const hechos = ins.filter(i => i.estado === "confirmada" && i.asistio !== false && cur.get(i.curso_id) && cur.get(i.curso_id).estado !== "cancelado" && cur.get(i.curso_id).fecha_fin < hoy).map(i => cur.get(i.curso_id));
      hechos.sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin));
      const u = hechos[0], renovar = u ? mas(u.fecha_inicio, 365) : null;
      const prox = ins.filter(i => i.estado === "confirmada" && cur.get(i.curso_id) && cur.get(i.curso_id).estado !== "cancelado" && cur.get(i.curso_id).fecha_fin >= hoy).map(i => cur.get(i.curso_id).fecha_inicio).sort()[0] || null;
      const situacion = prox ? "inscrito" : !u ? "sin_formacion" : renovar < hoy ? "caducado" : renovar < mas(hoy, 60) ? "vence_pronto" : "al_dia";
      return { id: t.id, dni: t.dni, nombre: t.nombre, telefono: t.telefono, email: t.email, centro: cen.get(t.centro_id)?.nombre || null,
        tiene_iniciacion: !!t._ini || hechos.some(c => c.tipo === "iniciacion"), ultimo_tipo: u?.tipo || null, ultima_fecha: u?.fecha_fin || null, renovar_antes: renovar, proximo_curso: prox, situacion,
        dni_ok: dniValido(t.dni), n_inscripciones: ins.length, centro_id: t.centro_id, centros_ids: [...new Set(ins.map(i => i.centro_id).filter(Boolean))] };
    });
  }
  function centrosResumen(db) {
    const te = tecnicosEstado(db), cur = new Map(db.cursos.map(c => [c.id, c]));
    return db.centros.map(ce => {
      const ts = te.filter(t => t.centro_id === ce.id || t.centros_ids.includes(ce.id));
      const ins = db.inscripciones.filter(i => i.centro_id === ce.id && i.estado === "confirmada" && cur.get(i.curso_id));
      return { id: ce.id, nombre: ce.nombre, contacto: ce.contacto, telefono: ce.telefono, email: ce.email, provincia: ce.provincia,
        n_tecnicos: ts.length, n_caducados: ts.filter(t => t.situacion === "caducado").length, n_vence: ts.filter(t => t.situacion === "vence_pronto").length,
        n_al_dia: ts.filter(t => ["al_dia", "inscrito"].includes(t.situacion)).length, n_inscripciones: ins.length,
        ultimo_curso: ins.map(i => cur.get(i.curso_id).fecha_inicio).sort().at(-1) || null };
    });
  }

  /* ---------- consultas al estilo PostgREST ---------- */
  function partir(s) { const out = []; let n = 0, a = ""; for (const ch of String(s)) { if (ch === "(") n++; if (ch === ")") n--; if (ch === "," && !n) { out.push(a.trim()); a = ""; } else a += ch; } if (a.trim()) out.push(a.trim()); return out; }
  const ruta = (r, p) => p.includes("->>") ? (() => { const [a, b] = p.split("->>"); const o = r[a]; return o == null ? null : (o[b] == null ? null : String(o[b])); })() : r[p];
  function proyectar(db, tabla, fila, sel) {
    const items = partir(sel || "*"); let out = {};
    for (const it of items) {
      const m = it.match(/^(\w+)(?:!\w+)?\((.*)\)$/);
      if (m) {
        const [, rel, sub] = m, s1 = rel.slice(0, -1) + "_id", s2 = rel.slice(0, -2) + "_id";
        const fk = s1 in fila ? s1 : s2 in fila ? s2 : null;
        if (fk) { const r = (db[rel] || []).find(x => x.id === fila[fk]); out[rel] = r ? proyectar(db, rel, r, sub) : null; }
        else { const hijo = tabla.slice(0, -1) + "_id", hijo2 = tabla.slice(0, -2) + "_id"; out[rel] = (db[rel] || []).filter(x => x[hijo] === fila.id || x[hijo2] === fila.id).map(r => proyectar(db, rel, r, sub)); }
      } else if (it === "*") out = { ...out, ...fila };
      else out[it] = fila[it];
    }
    return JSON.parse(JSON.stringify(out));
  }
  const cumple = (r, [op, c, v]) => {
    const x = ruta(r, c);
    switch (op) {
      case "eq": return String(x) === String(v); case "neq": return String(x) !== String(v);
      case "gt": return x != null && x > v; case "gte": return x != null && x >= v; case "lt": return x != null && x < v; case "lte": return x != null && x <= v;
      case "in": return v.map(String).includes(String(x)); case "is": return v === null ? x == null : x === v;
      case "ilike": return new RegExp("^" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i").test(String(x ?? ""));
      case "cs": return Array.isArray(x) && [].concat(v).every(e => x.map(String).includes(String(e)));
      case "or": return v.some(f => cumple(r, f));
    }
    return true;
  };
  const parseOr = s => partir(s).map(p => { const m = p.match(/^(.+?)\.(eq|neq|cs|gt|lt|is)\.(.*)$/); if (!m) return ["eq", "__", "__"]; let [, c, op, v] = m; if (op === "cs") v = v.replace(/^\{|\}$/g, "").split(","); if (op === "is" && v === "null") v = null; return [op, c, v]; });
  const CLAVES = { plantillas_correo: ["tipo"], ajustes: ["clave"], avisos_descartados: ["email", "clave"], admin_estado: ["email"], admins: ["email"] };

  class Consulta {
    constructor(sim, tabla) { this.sim = sim; this.t = tabla; this.f = []; this.ord = []; this.op = "select"; this.sel = "*"; }
    select(s, o) { if (this.op === "select") this.sel = s || "*"; else this.devolver = s || "*"; if (o?.count) { this.contar = true; this.cabecera = !!o.head; } return this; }
    eq(c, v) { this.f.push(["eq", c, v]); return this; } neq(c, v) { this.f.push(["neq", c, v]); return this; }
    gt(c, v) { this.f.push(["gt", c, v]); return this; } gte(c, v) { this.f.push(["gte", c, v]); return this; }
    lt(c, v) { this.f.push(["lt", c, v]); return this; } lte(c, v) { this.f.push(["lte", c, v]); return this; }
    in(c, v) { this.f.push(["in", c, v]); return this; } is(c, v) { this.f.push(["is", c, v]); return this; }
    ilike(c, v) { this.f.push(["ilike", c, v]); return this; } contains(c, v) { this.f.push(["cs", c, v]); return this; }
    or(s) { this.f.push(["or", "", parseOr(s)]); return this; }
    order(c, o = {}) { this.ord.push([c, o.ascending !== false]); return this; }
    range(a, b) { this.rg = [a, b]; return this; } limit(n) { this.rg = [0, n - 1]; return this; }
    single() { this.uno = "single"; return this; } maybeSingle() { this.uno = "maybe"; return this; }
    insert(v) { this.op = "insert"; this.val = v; return this; } update(v) { this.op = "update"; this.val = v; return this; }
    delete() { this.op = "delete"; return this; } upsert(v, o) { this.op = "upsert"; this.val = v; this.opc = o || {}; return this; }
    then(ok, mal) { try { return Promise.resolve(this.ejecutar()).then(ok, mal); } catch (e) { return Promise.resolve({ data: null, error: { message: e.message } }).then(ok, mal); } }
    filas() {
      const db = this.sim.db;
      if (this.t === "tecnicos_estado") return tecnicosEstado(db);
      if (this.t === "centros_resumen") return centrosResumen(db);
      return db[this.t] || (db[this.t] = []);
    }
    ejecutar() {
      const sim = this.sim, db = sim.db;
      if (this.op === "select") {
        let r = this.filas().filter(x => this.f.every(f => cumple(x, f)));
        for (const [c, asc] of [...this.ord].reverse()) r = [...r].sort((a, b) => { const x = ruta(a, c), y = ruta(b, c); return (x == null) - (y == null) || (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1); });
        const total = r.length;
        if (this.rg) r = r.slice(this.rg[0], this.rg[1] + 1);
        if (this.cabecera) return { data: null, count: total, error: null };
        const d = r.map(x => proyectar(db, this.t, x, this.sel));
        if (this.uno) { if (this.uno === "single" && d.length !== 1) return { data: null, error: { message: "No encontrado" } }; return { data: d[0] || null, error: null, count: total }; }
        return { data: d, error: null, count: this.contar ? total : null };
      }
      const tabla = db[this.t] || (db[this.t] = []);
      let afectadas = [];
      if (this.op === "insert" || this.op === "upsert") {
        for (let v of [].concat(this.val)) {
          v = { ...v };
          const claves = CLAVES[this.t] || ["id"];
          const prev = this.op === "upsert" && claves.every(k => v[k] != null) ? tabla.find(x => claves.every(k => String(x[k]) === String(v[k]))) : null;
          if (prev) { if (this.opc.ignoreDuplicates) continue; Object.assign(prev, v, { updated_at: ahora() }); afectadas.push(prev); sim.auditar(this.t, "cambio", prev, v); continue; }
          if (!v.id && claves[0] === "id") v.id = uid();
          v.created_at = v.created_at || ahora();
          if (this.t === "cursos") { v.fechas = [...v.fechas].sort(); v.fecha_inicio = v.fechas[0]; v.fecha_fin = v.fechas.at(-1); v.estado = v.estado || "abierto"; if (v.estado === "abierto") v.publicado_at = ahora(); }
          if (this.t === "centros") { v.token = v.token || uid(); v.nombre_norm = norm(v.nombre); }
          if (this.t === "plantillas_correo" || this.t === "ajustes") { v.updated_at = ahora(); v.updated_by = sim.email; }
          tabla.push(v); afectadas.push(v); sim.auditar(this.t, "alta", v);
        }
      } else {
        const objetivo = tabla.filter(x => this.f.every(f => cumple(x, f)));
        if (this.op === "update") {
          for (const x of objetivo) {
            const antes = { ...x };
            Object.assign(x, this.val);
            if (this.t === "cursos" && this.val.fechas) { x.fechas = [...x.fechas].sort(); x.fecha_inicio = x.fechas[0]; x.fecha_fin = x.fechas.at(-1); }
            if (this.t === "cursos" && this.val.estado === "abierto" && antes.estado !== "abierto" && !x.publicado_at) x.publicado_at = ahora();
            if (this.t === "inscripciones" && this.val.estado === "cancelada" && antes.estado === "confirmada") sim.promover(x.curso_id);
            if (this.t === "cursos" && this.val.estado === "cancelado" && antes.estado !== "cancelado") db.inscripciones.filter(i => i.curso_id === x.id && i.estado !== "cancelada").forEach(i => sim.correo(i.id, "cancelacion_curso"));
            afectadas.push(x); sim.auditar(this.t, "cambio", x, this.val, antes);
          }
        } else {
          for (const x of objetivo) {
            tabla.splice(tabla.indexOf(x), 1); afectadas.push(x); sim.auditar(this.t, "borrado", x);
            if (this.t === "cursos") db.inscripciones = db.inscripciones.filter(i => i.curso_id !== x.id);
            if (this.t === "tecnicos") db.inscripciones = db.inscripciones.filter(i => i.tecnico_id !== x.id);
            if (this.t === "centros") db.inscripciones.forEach(i => { if (i.centro_id === x.id) i.centro_id = null; });
          }
        }
      }
      sim.avisar(this.t);
      if (this.devolver !== undefined) { const d = afectadas.map(x => proyectar(db, this.t, x, this.devolver)); return { data: this.uno ? d[0] || null : d, error: null }; }
      return { data: null, error: null };
    }
  }

  /* ---------- funciones (RPC) ---------- */
  function crear() {
    const db = semilla(), oyentes = new Set();
    const sim = { db, email: "practica@wortach.com" };
    sim.auditar = (tabla, accion, fila, cambios, antes) => {
      if (!["cursos", "inscripciones", "tecnicos", "centros", "firmantes"].includes(tabla)) return;
      const ctx = tabla === "inscripciones" ? { tecnico_id: fila.tecnico_id, curso_id: fila.curso_id, centro_id: fila.centro_id } : tabla === "cursos" ? { tipo: fila.tipo, sede: fila.sede, fechas: fila.fechas } : { nombre: fila.nombre, tecnico_id: tabla === "tecnicos" ? fila.id : undefined, centro_id: tabla === "centros" ? fila.id : fila.centro_id };
      let a = null, d = null;
      if (accion === "cambio") { a = {}; d = {}; for (const k of Object.keys(cambios || {})) { if (antes && String(antes[k]) !== String(fila[k])) { a[k] = antes[k]; d[k] = fila[k]; } } if (antes && !Object.keys(d).length) return; if (!antes) { d = cambios; } }
      db.auditoria.unshift({ id: db.auditoria.length + 1, fecha: ahora(), usuario: tabla === "inscripciones" && accion === "alta" && fila.origen === "web" ? "formulario web" : sim.email, tabla, registro: fila.id || null, accion, antes: accion === "borrado" ? fila : a, despues: accion === "alta" ? fila : d, contexto: ctx });
    };
    sim.correo = (ins, tipo) => db.correos.push({ id: uid(), inscripcion_id: ins, tipo, estado: "pendiente", intentos: 0, error: null, created_at: ahora(), enviado_at: null });
    sim.promover = curso => {
      const c = db.cursos.find(x => x.id === curso); if (!c) return;
      const conf = db.inscripciones.filter(i => i.curso_id === curso && i.estado === "confirmada").length;
      const espera = db.inscripciones.filter(i => i.curso_id === curso && i.estado === "lista_espera").sort((a, b) => a.created_at.localeCompare(b.created_at));
      for (let k = 0; k < c.cupo_max - conf && k < espera.length; k++) { espera[k].estado = "confirmada"; sim.correo(espera[k].id, "plaza_asignada"); }
    };
    sim.avisar = (tabla, extra) => { if (["inscripciones", "cursos"].includes(tabla)) oyentes.forEach(f => { try { f({ table: tabla, ...(extra || {}) }); } catch {} }); };
    const ocupadas = c => db.inscripciones.filter(i => i.curso_id === c && i.estado === "confirmada").length;
    const error = m => ({ data: null, error: { message: m, code: "P0001" } });
    const inscribir = (cursoId, tec, centro, origen, forzar) => {
      const c = db.cursos.find(x => x.id === cursoId); if (!c) return error("Curso no encontrado");
      if (c.estado === "cancelado") return error("El curso está cancelado");
      const prev = db.inscripciones.find(i => i.curso_id === cursoId && i.tecnico_id === tec.id);
      if (prev && prev.estado !== "cancelada") return error("Esta persona ya está inscrita en este curso");
      const estado = ocupadas(cursoId) < c.cupo_max || forzar ? "confirmada" : "lista_espera";
      let ins = prev;
      if (prev) Object.assign(prev, { estado, centro_id: centro.id, created_at: ahora(), asistio: null, origen });
      else { ins = { id: uid(), curso_id: cursoId, tecnico_id: tec.id, centro_id: centro.id, contacto_nombre: centro.contacto, contacto_telefono: centro.telefono, dni_foto_path: null, estado, asistio: null, origen, notas: null, created_at: ahora() }; db.inscripciones.push(ins); }
      sim.auditar("inscripciones", "alta", ins); sim.correo(ins.id, estado === "confirmada" ? "confirmacion" : "lista_espera"); sim.avisar("inscripciones", { eventType: prev ? "UPDATE" : "INSERT", new: ins });
      return { data: { estado, posicion: estado === "lista_espera" ? db.inscripciones.filter(i => i.curso_id === cursoId && i.estado === "lista_espera").length : null, id: ins.id, extra: Math.max(ocupadas(cursoId) - c.cupo_max, 0) }, error: null };
    };
    const RPC = {
      es_admin: () => true, es_superadmin: () => true, admin_sede: () => null, es_docente: () => false, puede_historial: () => true,
      mi_perfil: () => ({ email: sim.email, nombre: "Usuario de práctica", sede: null, ver_historial: true }),
      cambiar_mi_nombre: () => null,
      inscribirse: p => {
        const d = String(p.p_dni || "").toUpperCase().replace(/[\s.\-]/g, "");
        if (!dniValido(d)) return error("DNI/NIE no válido");
        let ce = db.centros.find(x => x.nombre_norm === norm(p.p_centro));
        if (!ce) { ce = { id: uid(), nombre: String(p.p_centro).trim(), nombre_norm: norm(p.p_centro), contacto: p.p_contacto || null, telefono: p.p_tel_contacto || null, email: p.p_email_centro || null, provincia: p.p_provincia || null, token: uid(), created_at: ahora() }; db.centros.push(ce); }
        let te = db.tecnicos.find(x => x.dni === d);
        if (!te) { te = { id: uid(), dni: d, nombre: String(p.p_nombre).trim(), telefono: p.p_telefono || null, email: p.p_email || null, centro_id: ce.id, created_at: ahora(), updated_at: ahora() }; db.tecnicos.push(te); }
        else Object.assign(te, { nombre: String(p.p_nombre).trim(), centro_id: ce.id });
        return inscribir(p.p_curso, te, ce, "admin");
      },
      admin_inscribir: p => { const te = db.tecnicos.find(x => x.id === p.p_tecnico), ce = db.centros.find(x => x.id === p.p_centro); if (!te || !ce) return error("Elige el taller con el que va"); te.centro_id = ce.id; return inscribir(p.p_curso, te, ce, "admin", p.p_plaza); },
      dar_plaza: p => { const i = db.inscripciones.find(x => x.id === p.p_ins); if (!i) return error("Inscripción no encontrada"); if (i.estado === "confirmada") return error("Ya tiene plaza"); i.estado = "confirmada"; sim.correo(i.id, "plaza_asignada"); sim.avisar("inscripciones"); const c = db.cursos.find(x => x.id === i.curso_id), o = ocupadas(c.id); return { data: { ocupadas: o, cupo: c.cupo_max, extra: Math.max(o - c.cupo_max, 0) }, error: null }; },
      mover_inscripcion: p => { const i = db.inscripciones.find(x => x.id === p.p_ins), c = db.cursos.find(x => x.id === p.p_curso); if (!i || !c) return error("No encontrado"); const de = i.curso_id, eraConf = i.estado === "confirmada"; i.curso_id = c.id; i.estado = ocupadas(c.id) < c.cupo_max ? "confirmada" : "lista_espera"; if (eraConf) sim.promover(de); sim.avisar("inscripciones"); return { data: { estado: i.estado }, error: null }; },
      marcar_asistencia: p => { const i = db.inscripciones.find(x => x.id === p.p_ins); if (i) i.asistio = p.p_valor; return null; },
      corregir_dni: p => {
        const d = String(p.p_dni).toUpperCase().replace(/[\s.\-]/g, ""); if (!dniValido(d)) return error(`El DNI/NIE ${d} no es válido`);
        const otro = db.tecnicos.find(x => x.dni === d && x.id !== p.p_tecnico);
        if (!otro) { const t = db.tecnicos.find(x => x.id === p.p_tecnico); if (t) t.dni = d; return { data: { accion: "corregido" }, error: null }; }
        db.inscripciones.forEach(i => { if (i.tecnico_id === p.p_tecnico && !db.inscripciones.some(j => j.tecnico_id === otro.id && j.curso_id === i.curso_id)) i.tecnico_id = otro.id; });
        return { data: { accion: "unido", sobrante: p.p_tecnico }, error: null };
      },
      unir_centros: p => { let n = 0; db.inscripciones.forEach(i => { if (i.centro_id === p.p_origen) { i.centro_id = p.p_destino; n++; } }); db.tecnicos.forEach(t => { if (t.centro_id === p.p_origen) t.centro_id = p.p_destino; }); return { data: { inscripciones: n, tecnicos: 0 }, error: null }; },
      unir_tecnicos: p => { db.inscripciones.forEach(i => { if (i.tecnico_id === p.p_origen && !db.inscripciones.some(j => j.tecnico_id === p.p_destino && j.curso_id === i.curso_id)) i.tecnico_id = p.p_destino; }); return { data: { sobrante: p.p_origen }, error: null }; },
      duplicados_talleres: () => {
        const ign = db.duplicados_ignorados, cs = db.centros, out = [];
        for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) {
          const [x, y] = cs[a].id < cs[b].id ? [cs[a], cs[b]] : [cs[b], cs[a]];
          const mismo = base(x.nombre) && base(x.nombre) === base(y.nombre), tel = x.telefono && x.telefono === y.telefono;
          if ((mismo || tel) && !ign.some(d => d.tipo === "taller" && d.a === x.id && d.b === y.id)) {
            const n = c => db.inscripciones.filter(i => i.centro_id === c).length, t = c => db.tecnicos.filter(q => q.centro_id === c).length;
            out.push({ a: x.id, a_nombre: x.nombre, a_tecnicos: t(x.id), a_ins: n(x.id), b: y.id, b_nombre: y.nombre, b_tecnicos: t(y.id), b_ins: n(y.id), motivo: [mismo && "mismo nombre", tel && "mismo teléfono"].filter(Boolean).join(" · "), parecido: 100 });
          }
        }
        return out;
      },
      duplicados_tecnicos: () => [],
      regenerar_enlace: p => { const c = db.centros.find(x => x.id === p.p_centro); if (c) c.token = uid(); return c?.token || null; },
      cuentas_lista: () => db.admins.map(a => ({ ...a, docente: db.firmantes.find(f => f.id === a.docente_id)?.nombre || null, ultimo_acceso: a.email === sim.email ? ahora() : null, tiene_usuario: true })),
      guardar_cuenta: p => {
        const a = db.admins.find(x => x.email === p.p_email); if (!a) return error("Esa cuenta no existe");
        if (p.p_email === sim.email && (p.p_tipo !== "admin" || !p.p_activo)) return error("No puedes quitarte a ti mismo el permiso de administrador ni desactivarte");
        Object.assign(a, { nombre: p.p_nombre, activo: p.p_activo, ver_historial: p.p_ver_historial, sede: p.p_tipo.startsWith("sede:") ? p.p_tipo.slice(5) : null, docente_id: p.p_tipo.startsWith("docente:") ? p.p_tipo.slice(8) : null });
        return null;
      },
      restablecer_contrasena: () => null,
      embudo: () => [{ mes: hoyISO().slice(0, 7), visitas: 148, eligen: 81, envian: 39, inscritos: 34 }],
      nueva_clave_copia: () => "clave-de-practica-no-sirve-para-nada",
      estado_copia: () => null,
      importar_inscripciones: () => error("En el modo práctica no se importan archivos."),
    };
    const ESPERA = () => new Promise(r => setTimeout(r, 120));
    // un taller "se inscribe" desde la web, para ver el panel en directo
    sim.simularWeb = () => {
      const hoy = hoyISO();
      const c = db.cursos.filter(x => x.estado === "abierto" && x.fecha_inicio > hoy && ocupadas(x.id) < x.cupo_max).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];
      if (!c) return;
      const t = db.tecnicos.find(x => !db.inscripciones.some(i => i.tecnico_id === x.id && i.curso_id === c.id && i.estado !== "cancelada"));
      if (t) inscribir(c.id, t, db.centros.find(x => x.id === t.centro_id), "web");
    };
    return {
      simularWeb: sim.simularWeb,
      __practica: true,
      from: t => new Consulta(sim, t),
      rpc: async (n, p = {}) => { await ESPERA(); const f = RPC[n]; if (!f) return { data: null, error: null }; const r = f(p); return r && typeof r === "object" && "error" in r && "data" in r ? r : { data: r === undefined ? null : r, error: null }; },
      auth: {
        getSession: async () => ({ data: { session: { user: { email: sim.email } } } }),
        getUser: async () => ({ data: { user: { email: sim.email } } }),
        signInWithPassword: async () => ({ error: null }), signOut: async () => ({ error: null }),
        updateUser: async () => ({ error: null }), resetPasswordForEmail: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      functions: {
        invoke: async (n, o = {}) => {
          await ESPERA();
          const b = o.body || {};
          if (n === "gestionar-cuentas") {
            if (b.accion === "crear") { if (db.admins.some(a => a.email === b.email)) return { data: { error: "Ya hay una cuenta con ese correo" }, error: null }; db.admins.push({ email: b.email, nombre: b.nombre, sede: b.tipo?.startsWith("sede:") ? b.tipo.slice(5) : null, docente_id: b.tipo?.startsWith("docente:") ? b.tipo.slice(8) : null, activo: true, ver_historial: !!b.ver_historial, created_at: ahora() }); return { data: { ok: true, existia: false }, error: null }; }
            if (b.accion === "borrar") { db.admins = db.admins.filter(a => a.email !== b.email); return { data: { ok: true }, error: null }; }
          }
          if (n === "enviar-correos" && b.prueba) return { data: { error: "Modo práctica: aquí no se envía ningún correo. En la gestión real te llegaría a tu bandeja." }, error: null };
          if (n === "enviar-correos") { db.correos.forEach(c => { if (c.estado === "pendiente") { c.estado = "enviado"; c.enviado_at = ahora(); } }); return { data: { ok: true, enviados: 0, motivo: "Modo práctica: se marcan como enviados sin enviar nada." }, error: null }; }
          return { data: { ok: true }, error: null };
        },
      },
      channel: () => { const ch = { on: (_, __, f) => { if (f) oyentes.add(f); return ch; }, subscribe: (cb) => { cb && cb("SUBSCRIBED"); return ch; }, unsubscribe() {} }; return ch; },
      removeChannel: () => {},
      storage: { from: () => ({ upload: async () => ({ error: null }), createSignedUrl: async () => ({ data: null }) }) },
    };
  }
  window.SimDB = { crear };
})();
