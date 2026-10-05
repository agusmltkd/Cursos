/* Informe del taller en PDF (pdf-lib, en el navegador) */
(function () {
  const PDFLIB = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
  const cargar = src => new Promise((ok, mal) => {
    if (window.PDFLib) return ok();
    const s = document.createElement("script"); s.src = src; s.onload = ok;
    s.onerror = () => mal(new Error("No se ha podido cargar el generador de PDF. Revisa la conexión."));
    document.head.append(s);
  });
  const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const D = s => new Date(s + "T12:00:00");
  const fecha = s => s ? `${D(s).getDate()} ${MESES[D(s).getMonth()].slice(0,3)} ${D(s).getFullYear()}` : "—";
  const TIPO = { actualizacion: "Actualización", iniciacion: "Iniciación" };
  const SIT = { caducado: "Caducado", vence_pronto: "Vence pronto", al_dia: "Al día", inscrito: "Inscrito", sin_formacion: "Sin formación" };

  async function taller({ taller, tecnicos, inscripciones, hoy }) {
    await cargar(PDFLIB);
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const hex = h => rgb(parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255);
    const C = { verde: hex("#268c56"), verdeOsc: hex("#1f7448"), suave: hex("#e4f1e9"), tinta: hex("#16201b"), gris: hex("#5a6660"), linea: hex("#d9dfdb"),
      rojo: hex("#b8372d"), ambar: hex("#a86b00"), azul: hex("#2f6fde"), blanco: rgb(1,1,1), papel: hex("#f6f8f6") };
    const SITC = { caducado: C.rojo, vence_pronto: C.ambar, al_dia: C.verdeOsc, inscrito: C.azul, sin_formacion: C.gris };

    const doc = await PDFDocument.create();
    doc.setTitle(`Informe de adiestramiento · ${taller.nombre}`); doc.setAuthor("WORTACH"); doc.setCreator("Gestión de adiestramientos WORTACH");
    const R = await doc.embedFont(StandardFonts.Helvetica), B = await doc.embedFont(StandardFonts.HelveticaBold);
    const logoB = new Uint8Array(await (await fetch("icons/logo.png")).arrayBuffer());
    const logo = await doc.embedPng(logoB);
    const W = 595.28, H = 841.89, M = 42;

    // pdf-lib mide con kerning pero dibuja sin él: medimos carácter a carácter
    const limpio = (f, s) => [...String(s ?? "")].map(ch => { try { f.encodeText(ch); return ch; } catch { return "?"; } }).join("");
    const ancho = (f, s, t) => [...limpio(f, s)].reduce((a, ch) => a + f.widthOfTextAtSize(ch, t), 0);
    const recorta = (f, s, t, max) => {
      s = limpio(f, s); if (ancho(f, s, t) <= max) return s;
      while (s.length > 1 && ancho(f, s + "…", t) > max) s = s.slice(0, -1);
      return s.trimEnd() + "…";
    };

    let page, y, nPag = 0;
    const paginas = [];
    function nueva() {
      page = doc.addPage([W, H]); paginas.push(page); nPag++;
      page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: C.verde });
      const lw = 112, lh = lw * 247 / 959;
      page.drawImage(logo, { x: M, y: H - 26 - lh, width: lw, height: lh });
      const t = "Informe de adiestramiento";
      page.drawText(t, { x: W - M - ancho(B, t, 10), y: H - 34, size: 10, font: B, color: C.gris });
      const f = `Generado el ${fecha(hoy)}`;
      page.drawText(f, { x: W - M - ancho(R, f, 9), y: H - 47, size: 9, font: R, color: C.gris });
      y = H - 26 - lh - 22;
    }
    const txt = (s, x, yy, { f = R, t = 10, c = C.tinta, max } = {}) => page.drawText(max ? recorta(f, s, t, max) : limpio(f, s), { x, y: yy, size: t, font: f, color: c });
    const sitio = h => { if (y - h < 58) { nueva(); return true; } return false; };

    nueva();
    // Título
    page.drawText(recorta(B, taller.nombre, 22, W - 2 * M), { x: M, y: y - 18, size: 22, font: B, color: C.tinta }); y -= 34;
    const sub = [taller.contacto, taller.telefono, taller.email].filter(Boolean).join("  ·  ");
    if (sub) { txt(sub, M, y, { t: 10.5, c: C.gris, max: W - 2 * M }); y -= 22; } else y -= 8;

    // Cifras
    const n = k => tecnicos.filter(t => t.situacion === k).length;
    const cif = [["Técnicos", tecnicos.length, C.gris], ["Al día", n("al_dia"), C.verde], ["Inscritos", n("inscrito"), C.azul],
      ["Vencen pronto", n("vence_pronto"), C.ambar], ["Caducados", n("caducado") + n("sin_formacion"), C.rojo]];
    const gap = 8, bw = (W - 2 * M - gap * (cif.length - 1)) / cif.length, bh = 52;
    cif.forEach(([l, v, col], i) => {
      const x = M + i * (bw + gap);
      page.drawRectangle({ x, y: y - bh, width: bw, height: bh, color: C.papel, borderColor: C.linea, borderWidth: .8 });
      page.drawRectangle({ x, y: y - 3, width: bw, height: 3, color: col });
      page.drawText(String(v), { x: x + 10, y: y - 30, size: 20, font: B, color: C.tinta });
      page.drawText(limpio(R, l), { x: x + 10, y: y - 44, size: 8.5, font: R, color: C.gris });
    });
    y -= bh + 26;

    // Tabla genérica
    function tabla(titulo, cols, filas, vacio) {
      sitio(60);
      page.drawText(limpio(B, titulo), { x: M, y, size: 13, font: B, color: C.tinta }); y -= 16;
      const cab = () => {
        page.drawRectangle({ x: M, y: y - 18, width: W - 2 * M, height: 18, color: C.suave });
        let x = M + 6;
        for (const c of cols) { page.drawText(recorta(B, c.t, 8.5, c.w - 8), { x, y: y - 12.5, size: 8.5, font: B, color: C.verdeOsc }); x += c.w; }
        y -= 18;
      };
      cab();
      if (!filas.length) { txt(vacio, M + 6, y - 16, { c: C.gris, t: 9.5 }); y -= 28; return; }
      for (const fila of filas) {
        const alto = fila.some(c => c && c.sub) ? 28 : 19;
        if (sitio(alto)) cab();
        let x = M + 6;
        fila.forEach((c, i) => {
          const w = cols[i].w - 8, o = typeof c === "object" && c ? c : { v: c };
          txt(o.v ?? "", x, y - 13, { f: o.b ? B : R, t: 9, c: o.c || C.tinta, max: w });
          if (o.sub) txt(o.sub, x, y - 23.5, { t: 7.5, c: C.gris, max: w });
          x += cols[i].w;
        });
        y -= alto;
        page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: .5, color: C.linea });
      }
      y -= 22;
    }

    const ord = { caducado: 0, sin_formacion: 1, vence_pronto: 2, inscrito: 3, al_dia: 4 };
    const T = [...tecnicos].sort((a, b) => ord[a.situacion] - ord[b.situacion] || String(a.renovar_antes || "").localeCompare(String(b.renovar_antes || "")) || a.nombre.localeCompare(b.nombre));
    const anchoT = W - 2 * M;
    tabla("Técnicos", [{ t: "TÉCNICO", w: anchoT * .33 }, { t: "DNI", w: anchoT * .13 }, { t: "ÚLTIMO CURSO", w: anchoT * .19 }, { t: "RENOVAR ANTES DE", w: anchoT * .2 }, { t: "SITUACIÓN", w: anchoT * .15 }],
      T.map(t => [{ v: t.nombre, b: true }, t.dni,
        t.ultimo_tipo ? { v: TIPO[t.ultimo_tipo], sub: fecha(t.ultima_fecha) } : "—",
        t.proximo_curso ? { v: fecha(t.proximo_curso), sub: "inscrito en ese curso" } : fecha(t.renovar_antes),
        { v: SIT[t.situacion], b: true, c: SITC[t.situacion] }]),
      "Este taller todavía no tiene técnicos.");

    const ES = { confirmada: "Confirmada", lista_espera: "Lista de espera", cancelada: "Baja" };
    const I = [...inscripciones].sort((a, b) => b.cursos.fecha_inicio.localeCompare(a.cursos.fecha_inicio));
    tabla("Historial de cursos", [{ t: "FECHAS", w: anchoT * .2 }, { t: "CURSO", w: anchoT * .17 }, { t: "SEDE", w: anchoT * .13 }, { t: "TÉCNICO", w: anchoT * .34 }, { t: "ESTADO", w: anchoT * .16 }],
      I.map(i => {
        const c = i.cursos, celebrado = c.fecha_fin < hoy;
        const est = c.estado === "cancelado" ? ["Curso cancelado", C.rojo] : i.estado === "confirmada"
          ? (celebrado ? (i.asistio === false ? ["No asistió", C.rojo] : ["Realizado", C.verdeOsc]) : ["Inscrito", C.azul]) : [ES[i.estado], i.estado === "cancelada" ? C.gris : C.ambar];
        return [fecha(c.fecha_inicio), TIPO[c.tipo], c.sede, i.tecnicos?.nombre || "", { v: est[0], c: est[1], b: true }];
      }), "Sin cursos registrados.");

    // Nota y pies
    sitio(40);
    txt("El adiestramiento se renueva cada año: la fecha límite es un año después del primer día del último curso realizado.", M, y, { t: 8.5, c: C.gris, max: W - 2 * M });
    paginas.forEach((p, i) => {
      p.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: .5, color: C.linea });
      p.drawText("WORTACH · Asistencia Técnica · asistencia@wortach.com · 954 360 572", { x: M, y: 27, size: 8, font: R, color: C.gris });
      const pg = `Página ${i + 1} de ${paginas.length}`;
      p.drawText(pg, { x: W - M - ancho(R, pg, 8), y: 27, size: 8, font: R, color: C.gris });
    });

    const bytes = await doc.save();
    const base = String(taller.nombre).toUpperCase().normalize("NFC").replace(/[\\/:*?"<>|,;.]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_");
    return { blob: new Blob([bytes], { type: "application/pdf" }), nombre: `INFORME_${base}_${hoy}.pdf` };
  }
  window.Informes = { taller };
})();
