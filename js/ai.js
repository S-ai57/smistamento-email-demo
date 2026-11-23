/* ------------------------------------------------------------------
   Collegamento al BFF locale (server/server.js). La pagina NON ha la
   chiave del modello: chiede solo al BFF di leggere il messaggio.
   Il modello e' l'UNICO motore di lettura della demo: se il BFF non
   c'e' o non risponde l'analisi fallisce in modo visibile, senza
   risultati fingibili. Il motore a regole serve solo ai test (58
   verifiche) e agli stati congelati di prova-stati.html.
   ------------------------------------------------------------------ */

const AI = {
  urlBase: "http://127.0.0.1:8787",
  pronto: false,
  modello: null,

  /* indaga: chiediamo al BFF se c'e' e con che modello risponde,
     solo per il badge in testata: l'analisi lo verifica da sola. */
  async indaga() {
    try {
      const resp = await fetch(this.urlBase + "/api/salute", { signal: AbortSignal.timeout(1500) });
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
    try {
      resp = await fetch(this.urlBase + "/api/analizza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      throw new Error("BFF non raggiungibile su " + this.urlBase + ": avviare con «node server/server.js» o con «Avvia con modello vero.command»");
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
