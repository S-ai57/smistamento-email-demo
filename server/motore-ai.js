/* ------------------------------------------------------------------
   Motore AI lato server: prompt, chiamata, verifica della risposta.
   Zero dipendenze: usa il fetch di Node. Le tabelle (categorie, aree,
   uffici, fasce) vengono lette da js/data.js e js/engine.js, le stesse
   fonti della demo: il verdetto del modello viene vincolato qui e la
   mappatura categoria -> ufficio resta tabella aziendale.
   La chiave API vive solo dentro il BFF: il browser non la vede mai.
   ------------------------------------------------------------------ */
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
const tabelle = vm.runInContext(
  "({ CATEGORIE, UFFICI, ZONE, BANDITE, LESSICO_GRAVITA })",
  contesto
);
const instrada = vm.runInContext("instrada", contesto);

function normalizza(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* la prova citata dal modello deve essere una frase reale del messaggio:
   se il modello inventa la "parola incontrata", la prova viene scartata */
function fraseReale(frase, corpo) {
  const f = normalizza(frase).replace(/\s+/g, " ").trim();
  if (!f || f.length > 320) return false;
  return normalizza(corpo).replace(/\s+/g, " ").includes(f);
}

function promptSistema() {
  const cat = tabelle.CATEGORIE.map((c) => `- ${c.id} = ${c.label}`).join("\n");
  const aree = tabelle.ZONE.map((z) => `- ${z.id} = ${z.label}`).join("\n");
  const elementi = tabelle.LESSICO_GRAVITA.map((r) =>
    r.w < 0 ? `${r.label} (attenua)` : r.label
  ).join(", ");
  return [
    "Sei il motore di lettura della casella customer care di un'azienda di servizi italiana.",
    "Leggi UN messaggio arrivato alla casella unica e rispondi SOLO con un oggetto JSON valido, senza testo fuori dal JSON, in italiano.",
    "",
    "CATEGORIE (usa l'id; metti null se il testo non permette di decidere con onesta':",
    "non tirare a indovinare):",
    cat,
    "AREE DI SERVIZIO (usa l'id; null se il messaggio non dice dove):",
    aree,
    "",
    "REGOLE DI LETTURA:",
    "- decidi solo da cio' che il messaggio dice davvero;",
    '- "non e\' pericoloso adesso, ma..." NON e\' un aggravamento;',
    "- un fastidio piccolo dichiarato tale dall'autore va attenuato;",
    "- danno a persone, pericolo immediato o utenza fragile coinvolta alzano molto il punteggio;",
    "- un disservizio che blocca l'attivita' del cliente alza il punteggio;",
    "- il tono della mail (formale, scortese, in maiuscolo) NON cambia la gravita'.",
    "punteggio = gravita' 0-100: da 75 = critica, 50-74 = alta, 25-49 = media, 0-24 = bassa.",
    `elemento di gravita' ammessi: ${elementi}.`,
    "",
    "PROVE: per ogni decisione cita frasi ESISTENTI nel messaggio, copiate parola per",
    "parola (max 3 per tipo). Se non hai prove, lista vuota: NON inventare mai prove.",
    "duplicati: confronta il messaggio SOLO con le pratiche aperte fornite, con",
    "somiglianza onesta tra 0 e 1; nessuna somiglianza reale = lista vuota.",
    "",
    "SCHEMA JSON ATTESO:",
    '{',
    '  "categoria": "id" | null,',
    '  "prove_categoria": [{"parola": "termine citato", "frase": "frasi esatta del messaggio"}],',
    '  "punteggio": 0,',
    '  "prove_gravita": [{"elemento": "uno dei ammessi", "parola": "termine citato", "frase": "frase esatta"}],',
    '  "area": "id" | null,',
    '  "prove_area": ["toponimo citato nel messaggio"],',
    '  "duplicati": [{"protocollo": "PRC-...", "somiglianza": 0.0, "motivo": ["stessa categoria"]}]',
    '}',
  ].join("\n");
}

function promptUtente(messaggio, aperte) {
  const casi = (aperte || [])
    .map(
      (r) =>
        `- ${r.protocollo} [${r.stato}/${r.categoria}] ${String(r.oggetto || "").slice(0, 90)}: ${String(r.testo || "").replace(/\s+/g, " ").slice(0, 220)}`
    )
    .join("\n");
  return [
    `CANALE: ${messaggio.canale}`,
    `OGGETTO: ${messaggio.oggetto}`,
    "MESSAGGIO:",
    String(messaggio.corpo).slice(0, 6000),
    "",
    "PRATICHE APERTE A CUI ASSOMIGLIARE:",
    casi || "(nessuna pratica aperta)",
    "",
    "Rispondi ora solo con il JSON.",
  ].join("\n");
}

function estraiJSON(testo) {
  if (!testo) return null;
  try {
    return JSON.parse(testo);
  } catch (e) {
    const a = testo.indexOf("{");
    const b = testo.lastIndexOf("}");
    if (a !== -1 && b > a) {
      try {
        return JSON.parse(testo.slice(a, b + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

function pesoElemento(etichetta) {
  const r = tabelle.LESSICO_GRAVITA.find((x) => x.label === etichetta);
  return r ? r.w : null;
}

/* trasforma la risposta del modello nello stesso oggetto che produce
   engine.analizza(), cosi' l'interfaccia non cambia e il ripiegamento
   sulle regole e' trasparente */
function costruisciAnalisi(risposta, messaggio, aperte, modello) {
  const r = risposta;
  const corpo = String(messaggio.corpo);

  const cat = tabelle.CATEGORIE.find((c) => c.id === r.categoria) || null;
  const proveCategoria = (Array.isArray(r.prove_categoria) ? r.prove_categoria : [])
    .filter((p) => p && fraseReale(p.frase, corpo))
    .slice(0, 3)
    .map((p) => ({ termine: String(p.parola || "").slice(0, 40), frase: String(p.frase) }));

  const punteggio = Math.max(0, Math.min(100, Math.round(Number(r.punteggio) || 0)));
  const banda = tabelle.BANDITE.find((b) => punteggio >= b.soglia);
  const proveGravita = (Array.isArray(r.prove_gravita) ? r.prove_gravita : [])
    .filter((p) => p && fraseReale(p.frase, corpo))
    .slice(0, 4)
    .map((p) => ({
      termine: String(p.parola || "").slice(0, 40),
      frase: String(p.frase),
      contributo: pesoElemento(p.elemento),
      motivo: String(p.elemento || "valutazione del modello"),
    }));

  const zonaOk = tabelle.ZONE.find((z) => z.id === r.area) || null;
  const proveZona = (Array.isArray(r.prove_area) ? r.prove_area : [])
    .filter((t) => typeof t === "string" && normalizza(corpo).includes(normalizza(t)))
    .slice(0, 4);

  const protocolliAperti = new Map((aperte || []).map((x) => [x.protocollo, x]));
  const duplicati = (Array.isArray(r.duplicati) ? r.duplicati : [])
    .filter((d) => d && protocolliAperti.has(d.protocollo))
    .map((d) => ({
      protocollo: d.protocollo,
      somiglianza: Math.max(0, Math.min(0.99, Math.round((Number(d.somiglianza) || 0) * 100) / 100)),
      motivo: (Array.isArray(d.motivo) ? d.motivo : []).map(String).slice(0, 3),
      stato: protocolliAperti.get(d.protocollo).stato,
    }))
    .slice(0, 3);

  const routing = instrada(cat ? cat.id : null, banda.id);

  return {
    versione: `modello ${modello}`,
    motore: "ai",
    timestamp: new Date().toISOString(),
    categoria: {
      categoria: cat ? cat.id : null,
      label: cat ? cat.label : "Non classificabile",
      punteggio: proveCategoria.length,
      prove: proveCategoria,
      alternative: [],
      nota: cat
        ? proveCategoria.length
          ? "prova citata dal modello sul testo"
          : "il modello non ha citato prove sul testo"
        : "Il modello non ha riconosciuto una categoria: scegli a mano.",
    },
    gravita: {
      punteggio: punteggio,
      gravita: banda.id,
      label: banda.label,
      sla: banda.sla,
      colore: banda.colore,
      prove: proveGravita,
    },
    zona: {
      zona: zonaOk ? zonaOk.id : null,
      label: zonaOk ? zonaOk.label : "Area da verificare",
      prove: proveZona,
    },
    routing: routing,
    duplicati: duplicati,
  };
}

async function chiamaModello(cfg, utente, senzaJsonFormat) {
  const corpo = {
    model: cfg.modello,
    temperature: 0.15,
    max_tokens: 4000,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: promptSistema() },
      { role: "user", content: utente },
    ],
  };
  if (!senzaJsonFormat) corpo.response_format = { type: "json_object" };
  const risposta = await fetch(cfg.baseUrl.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.apiKey },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(cfg.timeoutMs || 35000),
  });
  if (!risposta.ok) {
    const testo = await risposta.text().catch(() => "");
    throw new Error(`gateway ${risposta.status}: ${testo.slice(0, 160)}`);
  }
  const dati = await risposta.json();
  const scelta = dati.choices && dati.choices[0] && dati.choices[0].message;
  if (!scelta || !scelta.content) {
    throw new Error("risposta vuota dal modello");
  }
  return scelta.content;
}

async function analizzaColModello(messaggio, aperte, cfg) {
  const utente = promptUtente(messaggio, aperte);
  let contenuto;
  try {
    contenuto = await chiamaModello(cfg, utente, false);
  } catch (e) {
    /* alcuni gateway non accettano response_format json_object: riprova senza,
       l'estrazione difensiva di estraiJSON() copre il testo libero */
    if (!String(e.message).includes("gateway 4")) throw e;
    contenuto = await chiamaModello(cfg, utente, true);
  }
  const parsed = estraiJSON(contenuto);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("la risposta del modello non era JSON valido");
  }
  return costruisciAnalisi(parsed, messaggio, aperte, cfg.modello);
}

module.exports = { analizzaColModello, promptSistema, costruisciAnalisi };
