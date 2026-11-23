/* ------------------------------------------------------------------
   Persistenza locale della demo: casella di posta + registro pratiche.
   Solo il set di prova, solo su questo browser.
   Se localStorage non e' disponibile (es. file:// limitato) si ripiega
   su un archivio in memoria senza rompere la demo.
   ------------------------------------------------------------------ */

const CHIAVE_DEMO = "novaraservice.smistamento.v1";

const Store = {
  memoria: null,

  _leggi() {
    try {
      const grezzo = localStorage.getItem(CHIAVE_DEMO);
      return grezzo ? JSON.parse(grezzo) : null;
    } catch (e) {
      return this.memoria;
    }
  },

  _scrivi(doc) {
    this.memoria = doc;
    try {
      localStorage.setItem(CHIAVE_DEMO, JSON.stringify(doc));
    } catch (e) {
      /* nessuna persistenza: la demo continua in memoria */
    }
  },

  /* stato iniziale: messaggi gia' arrivati + archivio delle pratiche */
  carica() {
    const esistente = this._leggi();
    if (esistente && Array.isArray(esistente.segnalazioni) && Array.isArray(esistente.messaggi)) {
      return esistente;
    }
    const avvio = {
      messaggi: ARRIVI_INIZIALI.map((m) => JSON.parse(JSON.stringify(m))),
      prossimi: 0,
      segnalazioni: ARCHIVIO_INIZIALE.map((r) => JSON.parse(JSON.stringify(r))),
    };
    this._scrivi(avvio);
    return avvio;
  },

  salva(doc) {
    this._scrivi(doc);
  },

  nuovoProtocollo(segnalazioni) {
    const anno = new Date().getFullYear();
    let massimo = 400;
    segnalazioni.forEach((r) => {
      const n = parseInt(String(r.protocollo).split("-").pop(), 10);
      if (!isNaN(n) && n > massimo) massimo = n;
    });
    return `PRC-${anno}-${String(massimo + 1).padStart(5, "0")}`;
  },

  azzera() {
    this.memoria = null;
    try {
      localStorage.removeItem(CHIAVE_DEMO);
    } catch (e) {
      /* ignora */
    }
  },
};
