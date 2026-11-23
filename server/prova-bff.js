/* Prova d'insieme del BFF: chiede davvero al modello tre messaggi
   tipici della demo e verifica che la risposta arrivi valida.
   Richiede il BFF in esecuzione (node server/server.js) e .env.
   Uso:  node server/prova-bff.js                                   */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const radice = path.join(__dirname, "..");
const contesto = { console };
vm.createContext(contesto);
["js/data.js", "js/engine.js"].forEach((f) =>
  vm.runInContext(fs.readFileSync(path.join(radice, f), "utf8"), contesto, { filename: f })
);
const [ARRIVI, APERTE] = vm.runInContext(
  "[ARRIVI_INIZIALI.concat(ARRIVI_SIMULATI), ARCHIVIO_INIZIALE.filter((r) => r.stato !== 'risolta').map((r) => ({ protocollo: r.protocollo, oggetto: r.oggetto, testo: r.testo, categoria: r.categoria, zona: r.zona, stato: r.stato }))]",
  contesto
);

const casi = [
  { id: "MSG-01", categoria: "guasti", banda: "critica" },
  { id: "MSG-02", categoria: "fatturazione", banda: null },
  { id: "MSG-15", categoria: "guasti", banda: "media" },
];

function cerca(id) {
  const m = ARRIVI.find((x) => x.id === id);
  if (!m) throw new Error("messaggio " + id + " non trovato negli arrivi della demo");
  return m;
}

(async () => {
  let fallite = 0;
  for (const c of casi) {
    const m = cerca(c.id);
    const t0 = Date.now();
    let r;
    try {
      const resp = await fetch("http://127.0.0.1:8787/api/analizza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canale: m.canale, oggetto: m.oggetto, corpo: m.corpo, aperte: APERTE }),
      });
      r = await resp.json();
    } catch (e) {
      console.log(`MANCA IL BFF: ${e.message} (avvia con: node server/server.js)`);
      process.exit(1);
    }
    const ms = Date.now() - t0;
    const ok =
      r.ok &&
      r.categoria &&
      r.gravita &&
      r.routing &&
      Array.isArray(r.categoria.prove) &&
      Array.isArray(r.duplicati);
    const CatOk = !c.categoria || (r.ok && r.categoria.categoria === c.categoria);
    const bandaOk = !c.banda || (r.ok && r.gravita.gravita === c.banda);
    const passa = ok && CatOk && bandaOk;
    if (!passa) fallite += 1;
    console.log(
      `${passa ? "ok  " : "FAIL"} ${m.id} [${ms}ms] cat=${r.ok ? r.categoria.categoria : "-"} ` +
      `grav=${r.ok ? r.gravita.gravita + "(" + r.gravita.punteggio + ")" : "-"} ` +
      `area=${r.ok ? r.zona.zona : "-"} uff=${r.ok ? r.routing.ufficio : "-"} ` +
      `dup=${r.ok ? r.duplicati.map((d) => d.protocollo + ":" + d.somiglianza).join(",") || "-" : r.motivo}`
    );
  }
  console.log(fallite ? `${fallite} prove fallite` : `tutte le ${casi.length} prove sono passate`);
  process.exit(fallite ? 1 : 0);
})();
