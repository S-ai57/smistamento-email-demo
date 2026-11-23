/* Controllo del motore senza browser:  node prova-motore.js
   Esce con codice 1 se una decisione cambia rispetto all'atteso.
   Da rilanciare ogni volta che si tocca il lessico in js/data.js.

   I casi sono i messaggi che arrivano alla casella del Customer Care:
   gli attesi sono il verdetto che un operatore leggerebbe leggendo
   il messaggio. */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const base = path.join(__dirname, "js");
const contesto = { console };
vm.createContext(contesto);
["data.js", "engine.js"].forEach((f) =>
  vm.runInContext(fs.readFileSync(path.join(base, f), "utf8"), contesto, { filename: f })
);

/* cosa deve produrre ogni messaggio, nell'ordine in cui e' scritto nei dati.
   Il messaggio "Modulo sito" resta senza categoria di proposito: il motore
   non incontra nessuna parola chiave, quindi l'operatore deve scegliere a
   mano prima di inoltrare (e la pratica resta al Customer Care). */
const TABELLA = [
  /* gia' in coda all'apertura */
  { canale: "Email", categoria: "guasti", gravita: "critica", zona: "nord", ufficio: "tecnico", duplicato: "PRC-2026-00412" },
  { canale: "PEC", categoria: "fatturazione", gravita: "media", zona: "sud", ufficio: "amministrazione" },
  { canale: "Telefono", categoria: "guasti", gravita: "alta", zona: "sanrocco", ufficio: "tecnico" },
  { canale: "WhatsApp", categoria: "reclami", gravita: "media", zona: "sud", ufficio: "care", duplicato: "PRC-2026-00401" },
  { canale: "Modulo sito", categoria: null, gravita: "media", zona: null, ufficio: "care" },
  /* arrivi simulati */
  { canale: "Email", categoria: "personale", gravita: "bassa", zona: "nord", ufficio: "hr" },
  { canale: "Email", categoria: "guasti", gravita: "critica", zona: "nord", ufficio: "tecnico", duplicato: "PRC-2026-00412" },
  { canale: "Email", categoria: "reclami", gravita: "alta", zona: "est", ufficio: "care" },
  { canale: "Modulo sito", categoria: "ordini", gravita: "media", zona: "centro", ufficio: "logistica" },
  { canale: "Email", categoria: "guasti", gravita: "media", zona: "sud", ufficio: "tecnico" },
  { canale: "Telefono", categoria: "ordini", gravita: "bassa", zona: "centro", ufficio: "logistica" },
  { canale: "PEC", categoria: "commerciale", gravita: "media", zona: "ovest", ufficio: "commerciale" },
  { canale: "Email", categoria: "fatturazione", gravita: "bassa", zona: "centro", ufficio: "amministrazione" },
];

const esiti = vm.runInContext(
  `(function(){
     function analizzaTutti(lista) {
       return lista.map(function(m){
         var a = analizza(m.corpo, ARCHIVIO_INIZIALE);
         return {
           canale: m.canale,
           oggetto: m.oggetto,
           categoria: a.categoria.categoria,
           gravita: a.gravita.gravita,
           punteggio: a.gravita.punteggio,
           zona: a.zona.zona,
           ufficio: a.routing.ufficio,
           duplicati: a.duplicati.map(function(d){ return d.protocollo; })
         };
       });
     }
     return {
       iniziali: analizzaTutti(ARRIVI_INIZIALI),
       simulati: analizzaTutti(ARRIVI_SIMULATI),
       stessaAnalisi: (function(){
         var pulisci = function(o){ var c = JSON.parse(JSON.stringify(o)); delete c.timestamp; return JSON.stringify(c); };
         return pulisci(analizza(ARRIVI_INIZIALI[0].corpo, ARCHIVIO_INIZIALE)) === pulisci(analizza(ARRIVI_INIZIALI[0].corpo, ARCHIVIO_INIZIALE));
       })()
     };
   })()`,
  contesto
);

const righe = esiti.iniziali.concat(esiti.simulati);
let fallite = 0;

function verifica(etichetta, reale, atteso) {
  const ok = reale === atteso;
  if (!ok) fallite++;
  console.log(`  ${ok ? "ok  " : "STOP"} ${etichetta}: ${reale}${ok ? "" : "  → atteso " + atteso}`);
}

if (righe.length !== TABELLA.length) {
  console.log(`STOP  messaggi analizzati ${righe.length}, attesi ${TABELLA.length}`);
  process.exit(1);
}

righe.forEach((r, i) => {
  const atteso = TABELLA[i];
  console.log(`\n[${atteso.canale}] ${r.oggetto}`);
  verifica("categoria", String(r.categoria), String(atteso.categoria));
  verifica("gravità", r.gravita, atteso.gravita);
  verifica("zona", String(r.zona), String(atteso.zona));
  verifica("ufficio", r.ufficio, atteso.ufficio);
  if (atteso.duplicato) {
    verifica("duplicato", r.duplicati.indexOf(atteso.duplicato) !== -1 ? atteso.duplicato : "nessuno", atteso.duplicato);
  }
});

console.log("\nCasi limite");
verifica("messaggio vago → nessuna categoria", String(righe[4].categoria), "null");
verifica("messaggio vago → resta al Customer Care", righe[4].ufficio, "care");
verifica("lo stesso messaggio dà la stessa analisi", String(esiti.stessaAnalisi), "true");

console.log(fallite ? `\n${fallite} verifiche fallite` : "\nTutte le verifiche passate");
process.exit(fallite ? 1 : 0);
