/* Comunicación a Industria: «Planificación proceso de adiestramiento» (A4 apaisado, pdf-lib en el navegador).
   Calca el documento que se presenta a la comunidad autónoma antes de cada curso. */
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
  const y = (lista) => lista.length > 1 ? lista.slice(0, -1).join(", ") + " y " + lista.at(-1) : lista[0];

  // «22 y 23 de octubre de 2026» · «30 de septiembre y 1 de octubre de 2026»
  function fechasLargas(fechas) {
    const g = [];
    for (const f of [...fechas].sort()) {
      const d = D(f), k = d.getFullYear() * 12 + d.getMonth();
      if (!g.length || g.at(-1).k !== k) g.push({ k, m: d.getMonth(), a: d.getFullYear(), dias: [] });
      g.at(-1).dias.push(d.getDate());
    }
    const partes = g.map((x, i) => `${y(x.dias.map(String))} de ${MESES[x.m]}${i < g.length - 1 && g[i + 1].a !== x.a ? " de " + x.a : ""}`);
    return `${y(partes)} de ${g.at(-1).a}`;
  }
  function nombreArchivo(curso) {
    const g = fechasLargas(curso.fechas).replace(/ de \d{4}$/, "");
    const base = `COMUNICACION_PLANIFICACION_PROCESO_DE_ADIESTRAMIENTO_${g}_${D(curso.fechas[0]).getFullYear()}_${curso.sede}`;
    return base.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z0-9]+/g, "_").replace(/_+$/, "") + ".pdf";
  }

  /* d = { tipo, fechas, lugar, temario:[...], titular:{nombre,dni,curriculo}, sustituto:{...}|null, aprobador:{nombre,dni}, organismo, fecha_presentacion (AAAA-MM-DD), revision } */
  async function generar(d, curso) {
    await cargar(PDFLIB);
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const doc = await PDFDocument.create();
    doc.setTitle("Planificación proceso de adiestramiento"); doc.setAuthor("WORTACH"); doc.setCreator("Gestión de adiestramientos WORTACH");
    const R = await doc.embedFont(StandardFonts.Helvetica), B = await doc.embedFont(StandardFonts.HelveticaBold);
    const logo = await doc.embedPng(new Uint8Array(await (await fetch("icons/logo.png")).arrayBuffer()));
    const W = 841.92, H = 595.32, page = doc.addPage([W, H]);
    const NEGRO = rgb(0, 0, 0), GRIS = rgb(0.851, 0.851, 0.851);

    const limpio = (f, s) => [...String(s ?? "")].map(ch => { try { f.encodeText(ch); return ch; } catch { return "?"; } }).join("");
    const ancho = (f, s, t) => f.widthOfTextAtSize(limpio(f, s), t);
    // parte un texto en líneas que quepan en «max»
    function lineas(f, txt, t, max) {
      const out = [];
      for (const parrafo of String(txt ?? "").split("\n")) {
        let l = "";
        for (const p of parrafo.split(/\s+/).filter(Boolean)) {
          const prueba = l ? l + " " + p : p;
          if (ancho(f, prueba, t) <= max || !l) l = prueba; else { out.push(l); l = p; }
        }
        out.push(l);
      }
      return out;
    }
    const texto = (s, x, yy, { f = B, t = 9 } = {}) => page.drawText(limpio(f, s), { x, y: yy, size: t, font: f, color: NEGRO });

    // Cabecera
    const lw = 178, lh = lw * logo.height / logo.width;
    page.drawImage(logo, { x: 32.7, y: H - 24 - lh, width: lw, height: lh });
    const tit = "PLANIFICACION PROCESO DE ADIESTRAMIENTO", tt = 12, tw = ancho(B, tit, tt);
    texto(tit, (W - tw) / 2, H - 94, { t: tt });
    page.drawLine({ start: { x: (W - tw) / 2, y: H - 96 }, end: { x: (W + tw) / 2, y: H - 96 }, thickness: 0.8, color: NEGRO });

    // Tabla
    const X0 = 28.8, X1 = 814.2, FS = 10, LH = 11.1;
    let top = H - 120.4;
    const T = 10;  // tamaño de letra del temario
    // celda: [x0, x1, texto, {gris, alinear}]
    function fila(h, celdas) {
      for (const [a, b, txt, o = {}] of celdas) {
        if (o.gris) page.drawRectangle({ x: a, y: top - h, width: b - a, height: h, color: GRIS });
        const ls = lineas(B, txt, FS, b - a - 12);
        const alto = ls.length * LH, y0 = top - (h - alto) / 2 - FS + 1.5;
        ls.forEach((l, i) => {
          const w = ancho(B, l, FS), x = o.izq ? a + 7 : a + (b - a - w) / 2;
          texto(l, x, y0 - i * LH, { t: FS });
        });
        page.drawRectangle({ x: a, y: top - h, width: b - a, height: h, borderColor: NEGRO, borderWidth: 0.75 });
      }
      top -= h;
    }
    const altoPara = (celdas, min = 35.3) => Math.max(min, ...celdas.map(([a, b, txt]) => lineas(B, txt, FS, b - a - 12).length * LH + 3));
    const inicioTabla = top;

    const c1 = [[X0, 265.7, "Tipo de proceso de adiestramiento a celebrar:", { gris: true }], [265.7, X1, d.tipo]];
    fila(altoPara(c1), c1);
    const c2 = [[X0, 160.4, "Fechas celebración:", { gris: true }], [160.4, 314.8, d.fechas], [314.8, 462.1, "Lugar de celebración:", { gris: true }], [462.1, X1, d.lugar]];
    fila(altoPara(c2), c2);
    fila(35.3, [[X0, X1, "Temario a desarrollar:", { gris: true }]]);

    // temario: lista con guiones, alineada a la izquierda
    const items = (d.temario || []).filter(s => String(s).trim());
    const tl = items.map(s => lineas(B, "- " + String(s).trim().replace(/^-\s*/, ""), T, X1 - X0 - 10));
    const altoTem = Math.max(60, tl.reduce((s, l) => s + l.length * 11.1 + 4.6, 0) + 12);
    page.drawRectangle({ x: X0, y: top - altoTem, width: X1 - X0, height: altoTem, borderColor: NEGRO, borderWidth: 0.75 });
    let yy = top - 6 - T;
    for (const ls of tl) { ls.forEach(l => { texto(l, X0 + 7, yy, { t: T }); yy -= 11.1; }); yy -= 4.6; }
    top -= altoTem;

    const persona = p => p ? [p.nombre, p.dni].filter(Boolean).join(" ") : "";
    const cT = [[X0, 216.6, "Docente titular:", { gris: true }], [216.6, X1, persona(d.titular)]];
    fila(altoPara(cT), cT);
    const cC1 = [[X0, 216.6, "Currículo:", { gris: true }], [216.6, X1, d.titular?.curriculo || ""]];
    fila(altoPara(cC1), cC1);
    if (d.sustituto) {
      const cS = [[X0, 216.6, "Docente sustituto:", { gris: true }], [216.6, X1, persona(d.sustituto)]];
      fila(altoPara(cS), cS);
      const cC2 = [[X0, 216.6, "Currículo:", { gris: true }], [216.6, X1, d.sustituto.curriculo || ""]];
      fila(altoPara(cC2), cC2);
    }
    const fp = d.fecha_presentacion ? d.fecha_presentacion.split("-").reverse().join("/") : "";
    const cA = [[X0, 174.8, "Aprobado por:", { gris: true }], [174.8, 462.1, persona(d.aprobador)], [462.1, 618.6, "Fecha presentación CCAA:", { gris: true }], [618.6, X1, [d.organismo, fp].filter(Boolean).join(" ")]];
    fila(altoPara(cA), cA);

    // marco exterior algo más grueso, como el original
    page.drawRectangle({ x: X0, y: top, width: X1 - X0, height: inicioTabla - top, borderColor: NEGRO, borderWidth: 1.4 });
    const rev = `Rev.: ${d.revision ?? 0}`;
    texto(rev, X1 - 6 - ancho(R, rev, 11), top - 13, { f: R, t: 11 });

    const bytes = await doc.save();
    return { blob: new Blob([bytes], { type: "application/pdf" }), nombre: nombreArchivo(curso) };
  }
  window.Industria = { generar, fechasLargas };
})();
