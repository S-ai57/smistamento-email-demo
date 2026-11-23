/* ------------------------------------------------------------------
   Collegamento al BFF locale (server/server.js). La pagina NON ha la
   chiave del modello: chiede solo al BFF di leggere il messaggio.
   Il modello e' l'UNICO motore di lettura della demo: se il BFF non
   c'e' o non risponde l'analisi fallisce in modo visibile, senza
   risultati fingibili. Il motore a regole serve solo ai test (58
   verifiche) e agli stati congelati di prova-stati.html.
   ------------------------------------------------------------------ */

/* token della demo: chi apre il link ricevuto (quello con ?t=...) lo
   memorizza qui nel proprio browser e lo riporta al BFF a ogni chiamata.
   E' cio' che impedisce a sconosciuti di usare il modello col link. */
function tokenDemo() {
  try {
    return localStorage.getItem("novaraservice.demoToken") || "";
  } catch (e) {
    return "";
  }
}
(function memorizzaTokenDalLink() {
  try {
    const m = location.search.match(/[?&]t=([A-Za-z0-9_-]{4,128})/);
    if (m) localStorage.setItem("novaraservice.demoToken", m[1]);
  } catch (e) {
    /* niente localStorage o link senza token: si procedera' senza */
  }
})();

const AI = {
  /* se la pagina e' servita dal BFF stesso (link del tunnel, oppure
     http://127.0.0.1:8787) la chiamata e' same-origin: niente permessi
     da concedere al browser. Altrimenti (file:// o GitHub Pages) il
     BFF va raggiunto sul localhost di chi apre la pagina. */
  urlBase: (function () {
    const h = location.hostname || "";
    const servitaDalBff = location.protocol.indexOf("http") === 0 && !/\.github\.io$/.test(h);
    return servitaDalBff ? "" : "http://127.0.0.1:8787";
  })(),
  pronto: false,
  modello: null,

  /* indaga: chiediamo al BFF se c'e' e con che modello risponde,
     solo per il badge in testata: l'analisi lo verifica da sola. */
  async indaga() {
    try {
      const t = tokenDemo();
      const resp = await fetch(this.urlBase + "/api/salute", {
        headers: t ? { "X-Token": t } : {},
        signal: AbortSignal.timeout(1500),
      });
      const dati = await resp.json();
      this.pronto = Boolean(dati.ok);
      this.modello = dati.modello || null;
    } catch (e) {
      this.pronto = false;
      this.modello = null;
    }
    return this.pronto;
  },

  /* analizza: una sola chiamata, il BFF risponde con l'analisi gia'
     validata (stessa forma di engine.analizza). Gli errori diventano
     messaggi leggibili mostrati nella schermata di esito. */
  async analizza(messaggio, aperte) {
    let resp;
    const t = tokenDemo();
    const intestazioni = { "Content-Type": "application/json" };
    if (t) intestazioni["X-Token"] = t;
    try {
      resp = await fetch(this.urlBase + "/api/analizza", {
        method: "POST",
        headers: intestazioni,
        body: JSON.stringify({
          canale: messaggio.canale,
          oggetto: messaggio.oggetto,
          corpo: messaggio.corpo,
          aperte: aperte,
        }),
        signal: AbortSignal.timeout(45000),
      });
    } catch (e) {
      if (e && e.name === "TimeoutError") {
        throw new Error("il modello non ha risposto entro 45 secondi");
      }
      if (this.urlBase) {
        throw new Error("BFF non raggiungibile su " + this.urlBase + ": avviare con «node server/server.js» o con «Avvia con modello vero.command»");
      }
      throw new Error("il motore di questa pagina non risponde: chi condivide il link deve riavviarlo («Condividi app col collega.command»)");
    }
    const dati = await resp.json().catch(() => null);
    if (!resp.ok || !dati || !dati.ok) {
      throw new Error((dati && dati.motivo) || "il BFF ha dato una risposta che non si puo' leggere");
    }
    return dati;
  },
};

/* etichetta del motore corrente, da mostrare in testata e nel piè di pagina */
function etichettaMotore() {
  return AI.modello ? "modello " + AI.modello : "modello non raggiungibile";
}
function nomeModelloBreve() {
  return String(AI.modello || "").split("/").pop();
}

/* sondaggio all'avvio: serve solo ad accendere il badge; se il BFF
   arriva dopo (es. .env sistemato al volo) basta un "Riprova" */
AI.indaga().then(function (pronto) {
  if (pronto && typeof disegna === "function" && typeof stato !== "undefined") disegna();
});
