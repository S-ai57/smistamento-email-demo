/* ------------------------------------------------------------------
   BFF locale della demo: un unico processo Node, zero dipendenze.
   Serve due cose:
     GET  /api/salute    -> il motore AI e' pronto? con che modello?
     POST /api/analizza  -> legge un messaggio e risponde l'analisi
                            (con DEMO_TOKEN attivo chiede anche il token)
     GET  /*             -> la app stessa: index.html, js/, css/, assets/
   Ascolta SOLO su 127.0.0.1: la chiave e il gateway restano locali.
   Per condividere un link col modello ci si mette davanti un tunnel
   HTTPS con "Condividi app col collega.command": cosi' il collega apre
   un solo indirizzo, senza installare niente e senza chiave propria.
   Avvio:  node server/server.js   (legge ../.env)
   ------------------------------------------------------------------ */
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { analizzaColModello } = require("./motore-ai.js");

function leggiEnv() {
  const file = path.join(__dirname, "..", ".env");
  const valori = {};
  try {
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((riga) => {
        const m = riga.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m) valori[m[1]] = m[2].replace(/^["']|["']$/g, "");
      });
  } catch (e) {
    /* niente .env: si puo' usare ancora l'ambiente */
  }
  return {
    baseUrl: process.env.AI_BASE_URL || valori.AI_BASE_URL || null,
    apiKey: process.env.AI_API_KEY || valori.AI_API_KEY || null,
    modello: process.env.AI_MODEL || valori.AI_MODEL || null,
    porta: Number(process.env.AI_PORT || valori.AI_PORT || 8787),
    demoToken: process.env.DEMO_TOKEN || valori.DEMO_TOKEN || null,
  };
}

const cfg = leggiEnv();
const pronto = Boolean(cfg.baseUrl && cfg.apiKey && cfg.modello);

/* -------------------- protezione del link condiviso --------------------
   Con DEMO_TOKEN nel .env, /api/analizza accetta solo chi porta il token
   (header X-Token o ?t=... nel link). Senza DEMO_TOKEN il BFF resta
   aperto, ma allora e' solo locale: non va mai esposto su un tunnel. */
function tokenOk(req) {
  if (!cfg.demoToken) return true;
  let dalLink = null;
  try {
    dalLink = new URL(req.url, "http://locale").searchParams.get("t");
  } catch (e) { /* URL ballerina: conta solo l'header */ }
  const ricevuto = req.headers["x-token"] || dalLink;
  return ricevuto === cfg.demoToken;
}

/* -------------------- la app, servita da qui -------------------- */
const RADICE = path.join(__dirname, "..");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function serviStatica(req, res) {
  let percorso;
  try {
    percorso = decodeURIComponent(req.url.split("?")[0]);
  } catch (e) {
    rispondi(res, 400, { ok: false, motivo: "percorso non valido" });
    return;
  }
  if (percorso === "/") percorso = "/index.html";
  const file = path.normalize(path.join(RADICE, percorso));
  const est = path.extname(file).toLowerCase();
  /* niente uscite dalla cartella della demo e niente file senza
     estensione nota: .env e i sorgenti server restano invisibili */
  if (!file.startsWith(RADICE + path.sep) || !(est in MIME)) {
    rispondi(res, 404, { ok: false, motivo: "non si trova (o non si serve)" });
    return;
  }
  fs.readFile(file, (err, dati) => {
    if (err) {
      rispondi(res, 404, { ok: false, motivo: "non si trova" });
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[est],
      "Cache-Control": "no-store",
      "Content-Length": dati.length,
    });
    res.end(req.method === "HEAD" ? undefined : dati);
  });
}

function ora() {
  return new Date().toTimeString().slice(0, 8);
}

function rispondi(res, codice, oggetto) {
  const corpo = JSON.stringify(oggetto);
  res.writeHead(codice, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Private-Network": "true",
    "Content-Length": Buffer.byteLength(corpo),
  });
  res.end(corpo);
}

function corpoRichiesta(req) {
  return new Promise((resolve, reject) => {
    let dati = "";
    req.on("data", (chunk) => {
      dati += chunk;
      if (dati.length > 60000) reject(new Error("richiesta troppo grande"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(dati || "{}"));
      } catch (e) {
        reject(new Error("body non JSON"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Token",
      /* pagine servite da internet (es. GitHub Pages) che chiamano il
         BFF su localhost: il browser chiede anche questo */
      "Access-Control-Allow-Private-Network": "true",
    });
    res.end();
    return;
  }

  if (req.url === "/api/salute" && req.method === "GET") {
    rispondi(res, 200, pronto
      ? { ok: true, motore: "modello", modello: cfg.modello }
      : { ok: false, motivo: "BFF senza chiave: configura .env (AI_BASE_URL, AI_API_KEY, AI_MODEL)" });
    return;
  }

  if (req.url.startsWith("/api/analizza") && req.method === "POST") {
    const t0 = Date.now();
    if (!tokenOk(req)) {
      console.log(`[smistam ${ora()}] analizza -> rifiutata: token demo mancante o errato`);
      rispondi(res, 401, { ok: false, motivo: "token della demo mancante: riaprire il link ricevuto per intero (quello con ?t=...)" });
      return;
    }
    if (!pronto) {
      console.log(`[smistam ${ora()}] analizza -> rifiutata: BFF non configurato`);
      rispondi(res, 503, { ok: false, motivo: "BFF non configurato: manca .env" });
      return;
    }
    let corpo;
    try {
      corpo = await corpoRichiesta(req);
    } catch (e) {
      rispondi(res, 400, { ok: false, motivo: e.message });
      return;
    }
    if (!corpo.corpo || String(corpo.corpo).trim().length < 10) {
      rispondi(res, 400, { ok: false, motivo: "messaggio vuoto" });
      return;
    }
    try {
      const analisi = await analizzaColModello(
        { canale: corpo.canale || "?", oggetto: corpo.oggetto || "", corpo: String(corpo.corpo) },
        Array.isArray(corpo.aperte) ? corpo.aperte : [],
        cfg
      );
      console.log(
        `[smistam ${ora()}] analizza -> ok ${Date.now() - t0}ms · ${analisi.categoria.categoria || "null"}` +
        ` ${analisi.gravita.gravita} (${analisi.gravita.punteggio}) · prove ${analisi.categoria.prove.length}`
      );
      rispondi(res, 200, Object.assign({ ok: true }, analisi));
    } catch (e) {
      console.log(`[smistam ${ora()}] analizza -> errore ${Date.now() - t0}ms · ${e.message}`);
      rispondi(res, 502, { ok: false, motivo: String(e.message || e).slice(0, 200) });
    }
    return;
  }

  if ((req.method === "GET" || req.method === "HEAD") && !req.url.startsWith("/api/")) {
    serviStatica(req, res);
    return;
  }

  rispondi(res, 404, { ok: false, motivo: "rota non conosciuta" });
});

server.listen(cfg.porta, "127.0.0.1", () => {
  console.log(`[smistam ${ora()}] BFF in ascolto su http://127.0.0.1:${cfg.porta}`);
  console.log(pronto
    ? `[smistam ${ora()}] motore: modello ${cfg.modello} via ${cfg.baseUrl}`
    : `[smistam ${ora()}] ATTENZIONE: .env assente o incompleto, /api/analizza rispondera' 503`);
});
