/* ------------------------------------------------------------------
   BFF locale della demo: un unico processo Node, zero dipendenze.
   Espone alla pagina due sole route:
     GET  /api/salute    -> il motore AI e' pronto? con che modello?
     POST /api/analizza  -> legge un messaggio e risponde l'analisi
   Ascolta SOLO su 127.0.0.1: la chiave e il gateway restano locali.
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
  };
}

const cfg = leggiEnv();
const pronto = Boolean(cfg.baseUrl && cfg.apiKey && cfg.modello);

function ora() {
  return new Date().toTimeString().slice(0, 8);
}

function rispondi(res, codice, oggetto) {
  const corpo = JSON.stringify(oggetto);
  res.writeHead(codice, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
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
      "Access-Control-Allow-Headers": "Content-Type",
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

  if (req.url === "/api/analizza" && req.method === "POST") {
    const t0 = Date.now();
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

  rispondi(res, 404, { ok: false, motivo: "rota non conosciuta" });
});

server.listen(cfg.porta, "127.0.0.1", () => {
  console.log(`[smistam ${ora()}] BFF in ascolto su http://127.0.0.1:${cfg.porta}`);
  console.log(pronto
    ? `[smistam ${ora()}] motore: modello ${cfg.modello} via ${cfg.baseUrl}`
    : `[smistam ${ora()}] ATTENZIONE: .env assente o incompleto, /api/analizza rispondera' 503`);
});
