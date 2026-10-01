/* Generación de certificados de adiestramiento WORTACH (pdf-lib + JSZip, en el navegador) */
(function () {
  const LIBS = {
    pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
    zip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  };
  const cargar = src => new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement("script"); s.src = src; s.onload = ok;
    s.onerror = () => mal(new Error("No se ha podido cargar el generador de PDF. Revisa la conexión."));
    document.head.append(s);
  });
  const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const D = s => new Date(s + "T12:00:00");

  function formatoDni(dni) {
    const d = String(dni || "").toUpperCase().replace(/[\s.\-]/g, "");
    const pts = n => n.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (/^\d{8}[A-Z]$/.test(d)) return `${pts(d.slice(0, 8))} ${d[8]}`;
    if (/^[XYZ]\d{7}[A-Z]$/.test(d)) return `${d[0]}-${pts(d.slice(1, 8))} ${d[8]}`;
    return d;
  }
  // "23, 24, 25 y 26 de MARZO de 2026" · "30 de SEPTIEMBRE y 1 de OCTUBRE de 2026"
  function textoDias(fechas) {
    const d = fechas.map(D), grupos = [];
    for (const x of d) {
      const g = grupos.at(-1);
      if (g && g.m === x.getMonth() && g.a === x.getFullYear()) g.dias.push(x.getDate());
      else grupos.push({ m: x.getMonth(), a: x.getFullYear(), dias: [x.getDate()] });
    }
    const lista = a => a.length > 1 ? a.slice(0, -1).join(", ") + " y " + a.at(-1) : String(a[0]);
    const partes = grupos.map((g, i) => {
      const finAnio = i === grupos.length - 1 || grupos[i + 1].a !== g.a;
      return `${lista(g.dias)} de ${MESES[g.m]}${finAnio ? ` de ${g.a}` : ""}`;
    });
    return lista(partes);
  }
  function textoProxima(fechas) {
    const d = D(fechas[0]);
    return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear() + 1}`;
  }
  const nombreArchivo = s => String(s).toUpperCase().normalize("NFC").replace(/[\\/:*?"<>|,;]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_");

  async function bytes(url) {
    if (url.startsWith("data:")) { const b = atob(url.split(",")[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
    const r = await fetch(url); if (!r.ok) throw new Error("No se encuentra " + url); return new Uint8Array(await r.arrayBuffer());
  }
  async function imagen(doc, url) {
    const b = await bytes(url);
    return (b[0] === 0x89 && b[1] === 0x50) ? doc.embedPng(b) : doc.embedJpg(b);
  }

  /* --------- dibujo de texto con negritas / subrayado y ajuste de línea --------- */
  function palabras(segs) {
    const out = [];
    for (const s of segs) {
      const trozos = String(s.t).split(/( )/);
      for (const t of trozos) if (t !== "") out.push({ ...s, t });
    }
    return out;
  }
  // pdf-lib aplica kerning al medir pero no al dibujar: se mide carácter a carácter
  const anchoTexto = (f, t, size) => { let w = 0; for (const ch of t) w += f.widthOfTextAtSize(ch, size); return w; };
  function lineas(segs, fuentes, size, ancho) {
    const ws = palabras(segs), res = []; let linea = [], w = 0;
    const medir = p => anchoTexto(fuentes[p.b ? "b" : "r"], p.t, size);
    for (const p of ws) {
      const pw = medir(p);
      if (p.t === " " && !linea.length) continue;
      if (w + pw > ancho && linea.length && p.t !== " ") {
        while (linea.length && linea.at(-1).t === " ") { w -= medir(linea.at(-1)); linea.pop(); }
        res.push({ items: linea, w }); linea = []; w = 0;
      }
      if (p.t === " " && !linea.length) continue;
      linea.push(p); w += pw;
    }
    while (linea.length && linea.at(-1).t === " ") { w -= medir(linea.at(-1)); linea.pop(); }
    if (linea.length) res.push({ items: linea, w });
    return res.map(l => ({ ...l, medir }));
  }
  function escribir(page, segs, o) {
    const { fuentes, size, x = 0, ancho, top, alinear = "centro", interlinea = size * 1.17, color, H } = o;
    const ls = lineas(segs, fuentes, size, ancho);
    let t = top;
    for (const l of ls) {
      let cx = alinear === "centro" ? x + (ancho - l.w) / 2 : alinear === "derecha" ? x + ancho - l.w : x;
      const base = H - t - size * 0.86;
      for (const p of l.items) {
        const f = fuentes[p.b ? "b" : "r"], w = anchoTexto(f, p.t, size);
        const c = p.color || color;
        page.drawText(p.t, { x: cx, y: base, size, font: f, color: c });
        if (p.u) page.drawLine({ start: { x: cx, y: base - size * 0.12 }, end: { x: cx + w, y: base - size * 0.12 }, thickness: size * 0.06, color: c });
        cx += w;
      }
      t += interlinea;
    }
    return t;
  }

  /* --------- un certificado --------- */
  async function pagina(doc, rec, alumno, curso, opc) {
    const { rgb } = PDFLib;
    const W = 595.32, H = 841.92;
    const page = doc.addPage([W, H]);
    const negro = rgb(0, 0, 0), azul = rgb(0.02, 0.39, 0.76);
    const F = rec.fuentes, base = { fuentes: F, H, color: negro };
    const ini = curso.tipo === "iniciacion";

    page.drawImage(rec.logo, { x: 17.4, y: H - 91.4, width: 294.2, height: 77.6 });

    let t = 131;
    t = escribir(page, [{ t: "WORTACH, S.L.", b: 1 }, { t: " como centro de adiestramiento de tacógrafos", b: 1 }, { t: "," }], { ...base, size: 14, x: 40, ancho: 515, top: t });
    t = escribir(page, [{ t: "Certifica la participación de" }], { ...base, size: 14, x: 40, ancho: 515, top: 158 });
    const nb = " ";
    t = escribir(page, [{ t: `D. ${alumno.nombre.toUpperCase()} con `, b: 1 }, { t: `D.N.I.${nb}${formatoDni(alumno.dni).replace(/ /g, nb)}`, b: 1 }],
      { ...base, size: 18, x: 40, ancho: 515, top: 192, interlinea: 21 });
    t = escribir(page, [{ t: "Perteneciente al Centro Técnico / Taller / Entidad" }], { ...base, size: 14, x: 40, ancho: 515, top: t + 8 });
    t = escribir(page, [{ t: String(alumno.centro || "").toUpperCase(), b: 1 }], { ...base, size: 18, x: 45, ancho: 505, top: t + 17, interlinea: 21 });
    t = escribir(page, [{ t: "En el proceso de adiestramiento según el Real Decreto 125/2017 de 24 de febrero" }], { ...base, size: 14, x: 30, ancho: 535, top: t + 13 });
    t = escribir(page, [{ t: `ADIESTRAMIENTO TIPO A, ${ini ? "INICIACIÓN" : "ACTUALIZACIÓN"}`, b: 1 }], { ...base, size: 18, x: 40, ancho: 515, top: t + 14 });

    const p12 = { ...base, size: 12, x: 48, ancho: 522, interlinea: 13.8, alinear: "izq" };
    t = escribir(page, [{ t: "Para " }, { t: "TACÓGRAFOS ANALÓGICOS", b: 1, u: 1 }, { t: " (según marco legislativo relativo al tacógrafo, regulado por el Reglamento CE 165/2014):" }], { ...p12, top: t + 18 });
    for (const m of ["Actia 028", "Continental, Kienzle, VDO, Siemens 1311, 1314, 1318, 1319 y 1324", "Motometer EGK100", "Stoneridge, Veeder Root 8400 y 2400"])
      t = escribir(page, [{ t: m, b: 1 }], { ...p12, alinear: "centro", top: t });
    t = escribir(page, [{ t: "Para " }, { t: "TACÓGRAFOS DIGITALES PRIMERA GENERACIÓN", b: 1, u: 1 }, { t: " (según marco legislativo relativo al tacógrafo, regulado por el Reglamento CE 165/2014)." }], { ...p12, top: t + 13 });
    t = escribir(page, [{ t: "Para " }, { t: "TACÓGRAFOS DIGITALES SEGUNDA GENERACIÓN, VERSIÓN 1 y VERSIÓN 2", b: 1, u: 1 }, { t: " (según marco legislativo al tacógrafo, regulado por el Reglamento CE 165/ 2014, así como con el Anexo 1C del Reglamento de Ejecución UE 2016/799 y Reglamento de Ejecución UE 2021/ 1228)." }], { ...p12, top: t + 14 });

    const lugar = curso.sede === "Online" ? [{ t: "modalidad online", b: 1 }] : [{ t: curso.sede, b: 1 }];
    t = escribir(page, [{ t: "Celebrado durante " }, { t: `${opc.horas} horas`, b: 1 }, { t: " en " }, ...lugar, { t: ", los días " }, { t: textoDias(curso.fechas), b: 1 }, { t: "." }],
      { ...base, size: 14, x: 25, ancho: 545, top: t + 14, interlinea: 16 });
    escribir(page, [{ t: "Fecha próximo proceso de adiestramiento: " }, { t: `antes del ${textoProxima(curso.fechas)}`, b: 1 }, { t: "." }],
      { ...base, size: 14, x: 25, ancho: 545, top: t + 9 });

    // firmas
    const xa = 345;
    escribir(page, [{ t: "Docente adiestramiento:" }], { ...base, size: 14, x: 58, ancho: 260, top: 633, alinear: "izq" });
    escribir(page, [{ t: "Aprobado por:" }], { ...base, size: 14, x: xa, ancho: 220, top: 633, alinear: "izq" });
    const firma = (img, caja) => {
      if (!img) return;
      const k = Math.min(caja.w / img.width, caja.h / img.height);
      let w = img.width * k; const h = img.height * k;
      // firmas muy estrechas: se ensanchan como en la plantilla de Word (hasta 2x)
      if (w < caja.w * 0.55) w = Math.min(caja.w * 0.95, w * 2);
      page.drawImage(img, { x: caja.x + (caja.w - w) / 2, y: H - caja.top - caja.h, width: w, height: h });
    };
    firma(rec.firmaDocente, { x: 50, top: 652, w: 215, h: 88 });
    firma(rec.firmaAprobador, { x: 335, top: 646, w: 215, h: 94 });
    escribir(page, [{ t: opc.docente.nombre }], { ...base, size: 14, x: 58, ancho: 270, top: 743, alinear: "izq" });
    escribir(page, [{ t: opc.docente.cargo || "Docente WORTACH" }], { ...base, size: 10, x: 58, ancho: 270, top: 759, alinear: "izq" });
    escribir(page, [{ t: opc.aprobador.nombre }], { ...base, size: 14, x: xa, ancho: 240, top: 743, alinear: "izq" });
    escribir(page, [{ t: opc.aprobador.cargo }], { ...base, size: 10, x: xa, ancho: 240, top: 759, alinear: "izq" });

    // pie
    const p7 = { ...base, size: 7, interlinea: 8.4 };
    if (rec.tel) page.drawImage(rec.tel, { x: 34.9, y: H - 818.1, width: 19.3, height: 19.3 });
    if (rec.wa) page.drawImage(rec.wa, { x: 95.1, y: H - 818.1, width: 27.4, height: 19.9 });
    escribir(page, [{ t: "954 360 572" }], { ...p7, x: 30, ancho: 50, top: 812.5, alinear: "izq" });
    escribir(page, [{ t: "606 241 669" }], { ...p7, x: 120, ancho: 50, top: 812.5, alinear: "izq" });
    escribir(page, [{ t: "www.wortach.com", u: 1, color: azul }], { ...p7, x: 67.8, ancho: 80, top: 820.5, alinear: "izq" });
    let tp = 798.5;
    for (const [txt, b] of [["WORTACH, SL", 1], ["Poligono Industrial Calonge", 0], ["C/ Aviación nº 31, local 11 (Edificio Vilaser)", 0], ["41007 Sevilla", 0]])
      tp = escribir(page, [{ t: txt, b }], { ...p7, x: 200, ancho: 200, top: tp });
    tp = 798.5;
    for (const m of ["central@wortach.com", "logistica@wortach.com", "asistencia@wortach.com"])
      tp = escribir(page, [{ t: m, u: 1, color: azul }], { ...p7, x: 440, ancho: 115, top: tp, alinear: "derecha" });
  }

  async function recursos(doc, opc) {
    const { StandardFonts } = PDFLib;
    const r = {
      fuentes: { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold) },
      logo: await imagen(doc, "icons/cert-logo.png"),
    };
    try { r.tel = await imagen(doc, "icons/cert-tel.png"); r.wa = await imagen(doc, "icons/cert-wa.png"); } catch {}
    if (opc.docente.firma) r.firmaDocente = await imagen(doc, opc.docente.firma);
    if (opc.aprobador.firma) r.firmaAprobador = await imagen(doc, opc.aprobador.firma);
    return r;
  }
  async function nuevoDoc(titulo) {
    const doc = await PDFLib.PDFDocument.create();
    doc.setTitle(titulo); doc.setAuthor("WORTACH, S.L."); doc.setCreator("Adiestramientos WORTACH"); doc.setLanguage("es-ES");
    return doc;
  }

  /**
   * opc: { curso:{tipo,sede,fechas}, alumnos:[{nombre,dni,centro}], docente:{nombre,cargo,firma}, aprobador:{nombre,cargo,firma}, horas, formato:'zip'|'unico', progreso?(n,total) }
   * devuelve { blob, nombre }
   */
  async function generar(opc) {
    await cargar(LIBS.pdf);
    const tipoTxt = opc.curso.tipo === "iniciacion" ? "Iniciacion" : "Actualizacion";
    const base = `Certificados_${tipoTxt}_${opc.curso.sede}_${opc.curso.fechas[0]}`;
    if (opc.formato === "unico" || opc.alumnos.length === 1) {
      const doc = await nuevoDoc(`Certificados adiestramiento ${tipoTxt} ${opc.curso.sede}`);
      const rec = await recursos(doc, opc);
      for (let i = 0; i < opc.alumnos.length; i++) { await pagina(doc, rec, opc.alumnos[i], opc.curso, opc); opc.progreso?.(i + 1, opc.alumnos.length); }
      const nombre = opc.alumnos.length === 1 ? nombreArchivo(`${opc.alumnos[0].centro}_${opc.alumnos[0].nombre}`) + ".pdf" : base + ".pdf";
      return { blob: new Blob([await doc.save()], { type: "application/pdf" }), nombre };
    }
    await cargar(LIBS.zip);
    const zip = new JSZip(), usados = new Set();
    for (let i = 0; i < opc.alumnos.length; i++) {
      const a = opc.alumnos[i];
      const doc = await nuevoDoc(`Certificado adiestramiento ${a.nombre}`);
      await pagina(doc, await recursos(doc, opc), a, opc.curso, opc);
      let n = nombreArchivo(`${a.centro}_${a.nombre}`), k = 2;
      while (usados.has(n)) n = nombreArchivo(`${a.centro}_${a.nombre}`) + "_" + k++;
      usados.add(n);
      zip.file(n + ".pdf", await doc.save());
      opc.progreso?.(i + 1, opc.alumnos.length);
    }
    return { blob: await zip.generateAsync({ type: "blob" }), nombre: base + ".zip" };
  }

  window.Certificados = { generar, formatoDni, textoDias, textoProxima };
})();
