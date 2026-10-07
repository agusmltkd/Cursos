/* Detecta correos mal escritos (gmial.com, hotmail.con…) y propone la corrección.
   Funciona solo sobre cualquier <input type="email"> de la página. */
(function () {
  const DOMINIOS = ["gmail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es", "live.com", "msn.com", "yahoo.es", "yahoo.com",
    "ymail.com", "icloud.com", "me.com", "telefonica.net", "movistar.es", "orange.es", "vodafone.es", "jazztel.es", "gmx.es", "gmx.com",
    "protonmail.com", "proton.me", "wortach.com"];
  const FIJOS = { "gmail.es": "gmail.com", "gmail.co": "gmail.com", "gmai.com": "gmail.com", "hotmail.co": "hotmail.com", "outlook.co": "outlook.com" };
  const SIN_PUNTO = { gmail: "gmail.com", hotmail: "hotmail.com", outlook: "outlook.com", yahoo: "yahoo.es", icloud: "icloud.com", gmailcom: "gmail.com",
    hotmailcom: "hotmail.com", hotmailes: "hotmail.es", outlookcom: "outlook.com", outlookes: "outlook.es", yahooes: "yahoo.es" };
  const TLD = { con: "com", cmo: "com", cpm: "com", comm: "com", vom: "com", xom: "com", cim: "com", ocm: "com", om: "com", ees: "es", ess: "es", rs: "es" };

  function distancia(a, b) {
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }

  function sugerir(valor) {
    let v = String(valor || "").trim().toLowerCase().replace(/\s+/g, "").replace(/,/g, ".").replace(/\.+$/, "").replace(/\.\.+/g, ".");
    if (!v) return null;
    const partes = v.split("@");
    if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
    let [u, dom] = partes;
    if (DOMINIOS.includes(dom)) return v !== String(valor).trim().toLowerCase() ? `${u}@${dom}` : null;
    if (FIJOS[dom]) return `${u}@${FIJOS[dom]}`;
    if (SIN_PUNTO[dom]) return `${u}@${SIN_PUNTO[dom]}`;
    let mejor = null, dmin = 9;
    for (const k of DOMINIOS) { const x = distancia(dom, k); if (x < dmin) { dmin = x; mejor = k; } }
    if (mejor && dmin > 0 && dmin <= (dom.length >= 9 ? 2 : 1)) return `${u}@${mejor}`;
    const t = dom.match(/^(.+)\.([a-z]+)$/);
    if (t && TLD[t[2]]) return `${u}@${t[1]}.${TLD[t[2]]}`;
    if (v !== String(valor).trim().toLowerCase() && /^[^@]+@[^@]+\.[a-z]{2,}$/.test(v)) return v;
    return null;
  }

  const css = document.createElement("style");
  css.textContent = `.sug-correo{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:7px;font-size:13.5px;font-weight:500;color:#6e4700;background:#fbf0d9;border-radius:9px;padding:7px 10px;line-height:1.35}
.sug-correo b{color:#4a3000;word-break:break-all}
.sug-correo button{border:0;border-radius:7px;padding:4px 10px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.sug-correo .si{background:#268c56;color:#fff}.sug-correo .no{background:transparent;color:#6e4700;text-decoration:underline;text-underline-offset:3px}`;
  document.head.append(css);

  function caja(input) { return input.parentElement.querySelector(":scope > .sug-correo"); }
  function quitar(input) { caja(input)?.remove(); delete input.dataset.sugerencia; }
  function revisar(input) {
    if (!input || input.type !== "email") return null;
    const val = input.value.trim();
    if (!val || input.dataset.correoOk === val) { quitar(input); return null; }
    const s = sugerir(val);
    if (!s || s === val.toLowerCase()) { quitar(input); return null; }
    let c = caja(input);
    if (!c) { c = document.createElement("div"); c.className = "sug-correo"; c.setAttribute("role", "status"); input.insertAdjacentElement("afterend", c); }
    c.innerHTML = `<span>¿Quisiste decir <b></b>?</span><button type="button" class="si">Sí, corregir</button><button type="button" class="no">No, está bien así</button>`;
    c.querySelector("b").textContent = s;
    input.dataset.sugerencia = s;
    c.querySelector(".si").onclick = () => { input.value = s; quitar(input); input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); };
    c.querySelector(".no").onclick = () => { input.dataset.correoOk = val; quitar(input); input.focus(); };
    return s;
  }
  // Primer correo con una corrección sin resolver dentro de un formulario (o null)
  function pendiente(raiz) {
    for (const i of (raiz || document).querySelectorAll('input[type="email"]')) if (revisar(i)) return i;
    return null;
  }
  // un pequeño retraso para que el aviso no mueva el botón que se está pulsando
  document.addEventListener("focusout", e => { const i = e.target; if (i.matches?.('input[type="email"]')) setTimeout(() => revisar(i), 250); });
  document.addEventListener("input", e => { if (e.target.matches?.('input[type="email"]') && caja(e.target) && e.target.value.trim() !== e.target.dataset.correoOk) quitar(e.target); });
  window.Correos = { sugerir, revisar, pendiente };
})();
