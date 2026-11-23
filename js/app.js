/* ------------------------------------------------------------------
   Interfaccia: casella di posta del Customer Care, analisi in 3 passi,
   registro e scheda. Vanilla JS, nessuna dipendenza, nessuna build.
   ------------------------------------------------------------------ */

const stato = {
  vista: "posta",
  passo: 1,
  cartella: "arrivo",
  messaggio: null,
  analisi: null,
  scelte: null,
  ultima: null,
  aperta: null,
  faseSmista: null,
  erroreAnalisi: null,
  faseModello: false,
  filtri: { stato: "", ufficio: "", categoria: "", q: "" },
  doc: Store.carica(),
};

const PASSI = ["Posta in arrivo", "Lettura AI", "Smistamento", "Registro"];

/* ---------- utilità ------------------------------------------------ */
function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Icone Lucide in linea (stroke = currentColor), come prevede il kit
   brand: gli stati si leggono con parola + icona, non col solo colore. */
const TRACCIATI_ICONA = {
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-check": '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
  "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "alert-octagon": '<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  store: '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
  "file-check": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m9 15 2 2 4-4"/>',
  "scan-search": '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
  sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  "folder-check": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="m9 13 2 2 4-4"/>',
  "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};

function icona(nome) {
  const tracciato = TRACCIATI_ICONA[nome];
  if (!tracciato) return "";
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tracciato}</svg>`;
}

/* tono = classe CSS (tinta del brand), non un colore qualsiasi */
function badge(etichetta, tono, nomeIcona) {
  return `<span class="badge ${esc(tono)}">${icona(nomeIcona)}${esc(etichetta)}</span>`;
}

function badgeBanda(b) {
  return badge(b.label, b.tono, b.icona);
}

function badgeStato(idStato) {
  const s = STATI[idStato] || STATI.nuova;
  return badge(s.label, s.tono, s.icona);
}

function iconaCanale(canale) {
  const c = String(canale || "");
  if (c.indexOf("PEC") !== -1) return "file-check";
  if (c === "Telefono") return "phone";
  if (c === "WhatsApp") return "message-square";
  if (c === "Modulo sito") return "globe";
  if (c === "App") return "smartphone";
  return "mail";
}

function cerca(sel) {
  return document.querySelector(sel);
}

function categoriaDi(id) {
  return CATEGORIE.find((c) => c.id === id) || null;
}

function labelCategoria(id) {
  const c = categoriaDi(id);
  return c ? c.label : "—";
}

function banda(id) {
  return BANDITE.find((b) => b.id === id) || BANDITE[BANDITE.length - 1];
}

function zonaDi(id) {
  return ZONE.find((z) => z.id === id) || null;
}

function labelZona(id) {
  const z = zonaDi(id);
  return z ? z.label : "Area da verificare";
}

function adesso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function breve(iso) {
  const parti = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!parti) return String(iso);
  return `${parti[3]}/${parti[2]} ${parti[4]}:${parti[5]}`;
}

/* orario relatifio: cosi' la casella sembra vera anche fra una settimana */
function daQuanto(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return String(iso);
  const quando = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const minuti = Math.round((Date.now() - quando.getTime()) / 60000);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min fa`;
  if (minuti < 60 * 24) return `${Math.round(minuti / 60)} ore fa`;
  if (minuti < 60 * 48) return `ieri ${m[4]}:${m[5]}`;
  return breve(iso);
}

/* dal campo "Da:" ricava il nome leggibile da mostrare in registro */
function nomeDa(da) {
  const s = String(da || "");
  const parentesi = s.match(/^([^<]+)</);
  if (parentesi) return parentesi[1].trim();
  return s.replace(/\s*—.*$/, "").trim();
}

function nomeCorrezione(chiave) {
  return { categoria: "categoria", gravita: "gravità", zona: "zona", ufficio: "ufficio" }[chiave] || chiave;
}

/* ---------- valori finali dopo le correzioni dell'operatore ------- */
function finale() {
  const a = stato.analisi;
  const categoria = stato.scelte.categoria || a.categoria.categoria;
  const gravita = stato.scelte.gravita || a.gravita.gravita;
  const zona = "zona" in stato.scelte ? stato.scelte.zona : a.zona.zona;
  const routing = instrada(categoria, gravita);
  const ufficio = stato.scelte.ufficio || routing.ufficio;
  return {
    categoria: categoria,
    gravita: gravita,
    banda: banda(gravita),
    zona: zona,
    routing: routing,
    ufficio: ufficio,
    correzioni: Object.entries({
      categoria: categoria !== a.categoria.categoria,
      gravita: gravita !== a.gravita.gravita,
      zona: zona !== a.zona.zona,
      ufficio: ufficio !== routing.ufficio,
    })
      .filter((c) => c[1])
      .map((c) => nomeCorrezione(c[0])),
  };
}

/* ---------- mini mappa schematica --------------------------------- */
function mappaSVG(zonaId) {
  const zone = ZONE.map((z) => {
    const attivo = z.id === zonaId;
    /* le zone a destra rischiano l'etichetta tagliata: ancora a destra */
    const spostaASinistra = z.x > 250;
    const xEtichetta = spostaASinistra ? z.x - 11 : z.x + 11;
    return `<circle cx="${z.x}" cy="${z.y}" r="${attivo ? 7 : 4}" fill="${attivo ? "#302A63" : "#8173B3"}"></circle>
      <text x="${xEtichetta}" y="${z.y + 4}" font-size="10" text-anchor="${spostaASinistra ? "end" : "start"}" fill="${attivo ? "#302A63" : "#665D7B"}">${esc(z.label)}</text>`;
  }).join("");

  const z = zonaDi(zonaId);
  const segnaposto = z
    ? `<g transform="translate(${z.x},${z.y - 20})">
        <path d="M0 20 C-11 7 -9 -9 0 -9 C9 -9 11 7 0 20 Z" fill="#7D328A"></path>
        <circle cx="0" cy="-2" r="3.6" fill="#fff"></circle>
       </g>`
    : "";

  return `<svg class="mappa" viewBox="0 0 400 260" width="100%" height="190" role="img" aria-label="Mappa schematica delle aree servite">
    <rect width="400" height="260" fill="#F3EDF7"></rect>
    <path d="M18 236 C110 205 150 152 250 140 C320 131 360 98 396 72" stroke="#D2EAF7" stroke-width="12" fill="none"></path>
    <path d="M0 92 L400 78" stroke="rgba(129,115,179,.35)" stroke-width="7" fill="none"></path>
    <path d="M124 0 L140 260" stroke="rgba(129,115,179,.35)" stroke-width="7" fill="none"></path>
    <path d="M266 0 L248 260" stroke="rgba(129,115,179,.35)" stroke-width="5" fill="none"></path>
    <text x="22" y="252" font-size="9" fill="#8173B3">fiume</text>
    ${zone}${segnaposto}
  </svg>`;
}

/* ---------- blocchi riusabili ------------------------------------- */
/* evidenzia le parole che hanno prodotto la decisione, direttamente
   nella frase: vocali accentate tollerate, niente azzardi di matching */
const VOCALI_ACCENTATE = { a: "àá", e: "èé", i: "ìí", o: "òó", u: "ùú" };
const APERTURA = "\u0000";
const CHIUSURA = "\u0001";

function evidenzi(frase, termini) {
  let testo = esc(frase);
  termini.forEach((t) => {
    const schema = esc(String(t))
      .split("")
      .map((carattere) => {
        const c = carattere.toLowerCase();
        if (VOCALI_ACCENTATE[c]) return "[" + c + VOCALI_ACCENTATE[c] + "]";
        if (/[a-z0-9]/.test(c)) return c;
        return carattere.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    try {
      testo = testo.replace(new RegExp("(" + schema + ")", "gi"), APERTURA + "$1" + CHIUSURA);
    } catch (e) {
      /* termine inutilizzabile come regex: nessuna evidenza, l'analisi resta valida */
    }
  });
  return testo.split(APERTURA).join("<mark>").split(CHIUSURA).join("</mark>");
}

function bloccoProve(prove, testoVuoto) {
  if (!prove || !prove.length) {
    return `<div class="prove"><div class="titolo-prove">Motivo</div>
      <div class="prova" style="border:none;padding-left:0">${esc(testoVuoto)}</div></div>`;
  }
  /* una riga per frase, non una per parola chiave */
  const righe = [];
  prove.forEach((p) => {
    const chiave = (p.frase || "") + "|" + (p.motivo || "");
    let riga = righe.find((r) => r.chiave === chiave);
    if (!riga) {
      riga = { chiave: chiave, frase: p.frase || "", motivo: p.motivo || "", termini: [] };
      righe.push(riga);
    }
    if (riga.termini.indexOf(p.termine) === -1) riga.termini.push(p.termine);
  });

  const corpo = righe
    .slice(0, 3)
    .map((r) => {
      if (!r.frase) return `<div class="prova">${r.termini.map((t) => `<mark>${esc(t)}</mark>`).join(" · ")}</div>`;
      const etichetta = r.motivo ? `<span class="tag">${esc(r.motivo)}</span>` : "";
      return `<div class="prova">${etichetta}<p>${evidenzi(r.frase, r.termini)}</p></div>`;
    })
    .join("");

  return `<div class="prove"><div class="titolo-prove">Motivo — parole incontrate nel testo</div>${corpo}</div>`;
}

function intestazione() {
  const attivaRegistro = stato.vista === "registro" || stato.vista === "dettaglio" ? "attivo" : "";
  const daLeggere = stato.doc.messaggi.filter((m) => !m.letto && !m.pratica).length;
  return `<header class="testata"><div class="testata-interna">
    <div>
      <p class="occhiello">Galene.AI · prototipo per le aziende di servizi</p>
      <h1>${esc(ENTE.app)}</h1>
      <p class="sottotitolo">${esc(ENTE.nome)} — ${esc(ENTE.servizio)}
        <span class="pill" title="unica lettrice dei messaggi: il modello vero dietro il BFF locale">${AI.modello ? "modello " + esc(nomeModelloBreve()) : "modello non raggiungibile"}</span>
      </p>
    </div>
    <nav class="top">
      <button class="${stato.vista === "posta" ? "attivo" : ""}" data-azione="vista" data-v="posta">
        ${icona("inbox")}<span>Posta in arrivo${daLeggere ? ` <span class="contatore-avviso">${daLeggere}</span>` : ""}</span>
      </button>
      <button class="${attivaRegistro}" data-azione="vista" data-v="registro">${icona("folder-check")}<span>Registro</span></button>
    </nav>
    <div class="marchi">
      <img src="assets/logos/horizontal-gradient.png" alt="Galene.AI" height="40">
    </div>
  </div></header>`;
}

function piéDiPagina() {
  return `<footer class="piede">Prototipo Galene.AI per ${esc(ENTE.nome)} · analisi con ${esc(etichettaMotore())}
    · <button class="b minimo" data-azione="reset">ripristina demo</button></footer>`;
}

/* ---------- passo 1 : la casella di posta --------------------------
   L'operatore apre la casella del Customer Care e trova i messaggi
   gia' li', cosi' come arrivano. Da qui non si digita nulla a mano.
------------------------------------------------------------------- */
const CASSETTO = {
  indirizzo: "info@novaraservice.it",
  pec: "novaraservice@pec.it",
};

const CARTELLE = [
  { id: "arrivo", label: "Posta in arrivo" },
  { id: "inoltrate", label: "Inoltrate agli uffici" },
];

function mittenteDi(m) {
  const testo = String(m.da || "");
  const angolari = testo.match(/^(.*?)\s*<([^>]+)>$/);
  if (angolari) return { nome: angolari[1].trim(), indirizzo: angolari[2].trim() };
  return { nome: testo.trim(), indirizzo: "" };
}

function iniziali(m) {
  if (m.canale === "Telefono") return "CC";
  if (m.canale === "WhatsApp") return "WA";
  if (m.canale === "Modulo sito") return "MS";
  const parole = mittenteDi(m).nome.split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean);
  return ((parole[0] || "?").charAt(0) + (parole[1] ? parole[1].charAt(0) : "")).toUpperCase();
}

function anteprima(testo, max) {
  const pulito = String(testo).replace(/\s+/g, " ").trim();
  const limite = max || 74;
  return pulito.length > limite ? pulito.slice(0, limite).trimEnd() + "…" : pulito;
}

function rigaPosta(m) {
  const mitt = mittenteDi(m);
  const nonLetto = !m.letto && !m.pratica;
  const scelta = stato.messaggio && stato.messaggio.id === m.id;
  const allegati = (m.allegati || []).length;
  return `<div class="riga-posta${nonLetto ? " nonletto" : ""}${scelta ? " selezionata" : ""}" data-azione="apri-messaggio" data-id="${esc(m.id)}">
    <span class="avatar">${esc(iniziali(m))}</span>
    <div class="riga-contenuto">
      <div class="mittente"><span class="mittente-nome">${esc(mitt.nome)}</span><span class="quando-list">${esc(daQuanto(m.ricevuto))}</span></div>
      <div class="oggetto-list">${esc(m.oggetto)}</div>
      <div class="anteprima">${esc(anteprima(m.corpo))}</div>
      ${m.pratica ? `<div class="inoltrata">inoltrata agli uffici · ${esc(m.pratica)}</div>` : ""}
      ${allegati ? `<div class="allegati-list">${allegati} ${plurale(allegati, "file allegato", "file allegati")}</div>` : ""}
    </div>
  </div>`;
}

function cassettoPosta() {
  const tutti = stato.doc.messaggi.slice().sort((a, b) => String(b.ricevuto).localeCompare(String(a.ricevuto)));
  const arrivo = tutti.filter((m) => !m.pratica);
  const inoltrate = tutti.filter((m) => m.pratica);
  const attiva = stato.cartella === "inoltrate" ? "inoltrate" : "arrivo";
  const elenco = attiva === "inoltrate" ? inoltrate : arrivo;
  const daLeggere = arrivo.filter((m) => !m.letto).length;
  const prossimi = ARRIVI_SIMULATI.length - stato.doc.prossimi;
  const etichetta = CARTELLE.find((c) => c.id === attiva).label;

  const cartelle = CARTELLE.map((c) => {
    const numero = c.id === "inoltrate" ? inoltrate.length : arrivo.length;
    return `<button class="cartella${c.id === attiva ? " attiva" : ""}" data-azione="cartella" data-c="${c.id}">
      <span>${c.id === "arrivo" && daLeggere ? '<span class="pallino"></span>' : ""}${esc(c.label)}</span>
      <span class="num">${numero}</span>
    </button>`;
  }).join("");

  const righe = elenco.length
    ? elenco.map(rigaPosta).join("")
    : `<div class="riga-vuota">Nessun messaggio in questa cartella.</div>`;

  return `<section class="posta">
    <aside class="lato">
      <div class="account"><b>${esc(CASSETTO.indirizzo)}</b>PEC ${esc(CASSETTO.pec)}</div>
      <button class="b primario largo" data-azione="simula-arrivo"${prossimi ? "" : " disabled"}
        title="fa arrivare un messaggio vero nella casella della demo">
        ${icona("sparkles")}<span>${prossimi ? "Simula nuovo arrivo" : "Nessun arrivo in sospeso"}</span>
      </button>
      <p class="nota-arrivi">${prossimi ? `In arrivo nella simulazione: ${prossimi} ${plurale(prossimi, "messaggio", "messaggi")}` : "Simulazione messaggi esaurita"}</p>
      <nav class="cartelle">${cartelle}</nav>
      <p class="nota-lato">${daLeggere ? `<b>${daLeggere} ${plurale(daLeggere, "messaggio da leggere", "messaggi da leggere")} in Posta in arrivo.</b><br>` : "<b>Nessun messaggio da leggere.</b><br>"}I messaggi entrano dai
        canali aziendali: mail, PEC, telefono, WhatsApp, modulo del sito. Qui non si trascrive nulla.</p>
    </aside>
    <div class="elenco">
      <div class="elenco-testa"><span class="titolo">${esc(etichetta)}</span><span class="quando-list">${elenco.length} messaggi</span></div>
      <div class="righe">${righe}</div>
    </div>
    ${letturaMessaggio()}
  </section>`;
}

/* ---------- passo 1 : il messaggio letto nella casella ------------- */
function letturaMessaggio() {
  const m = stato.messaggio;
  if (!m) {
    return `<div class="lettura"><div class="vuoto-lettura">
      <span class="icona-busta">${icona("mail")}</span>
      <b>Nessun messaggio aperto</b>
      <span>Scegline uno nell'elenco: trovi il testo così com'è arrivato.<br>Poi premi <b>Analizza</b>.</span>
    </div></div>`;
  }
  const mitt = mittenteDi(m);
  const allegati = m.allegati || [];
  return `<article class="lettura">
    <h2>${esc(m.oggetto)}</h2>
    <div class="mittente-card">
      <span class="avatar grande">${esc(iniziali(m))}</span>
      <div class="riga-contenuto">
        <span class="da-nome">${esc(mitt.nome)}</span>${mitt.indirizzo ? ` <span class="indirizzo">&lt;${esc(mitt.indirizzo)}&gt;</span>` : ""}
        <div class="a">a ${esc(CASSETTO.indirizzo)} · ${badge(m.canale, "neutra", iconaCanale(m.canale))}</div>
      </div>
      <div class="data-mail">${esc(breve(m.ricevuto))}<span>${esc(daQuanto(m.ricevuto))}</span></div>
    </div>
    <div class="testo-segnalazione">${esc(m.corpo)}</div>
    ${
      allegati.length
        ? `<div class="file-allegati">${allegati.map((f) => `<span class="allegato">${esc(f)}</span>`).join("")}</div>
           <p class="nota-allegati">Le immagini allegate non vengono lette: l'analisi lavora sul testo.</p>`
        : ""
    }
    ${m.pratica ? `<div class="avviso neutro">Messaggio già inoltrato agli uffici: pratica <b>${esc(m.pratica)}</b>.</div>` : ""}
    <div class="barra-posta">
      <button class="b primario" data-azione="analizza">${icona("scan-search")}<span>Analizza</span></button>
      <button class="b secondo" data-azione="chiudi-messaggio">Chiudi</button>
    </div>
  </article>`;
}

/* ---------- fase intermedia: l'analisi che avviene ---------------
   I numeri mostrati qui sono veri: escono dall'analisi gia' calcolata,
   non e' una barra d'attesa decorativa.
------------------------------------------------------------------- */
const FASI_ANALISI = [
  { titolo: "Estrazione del testo dal messaggio", dettaglio: (d) => `${d.canale} · ${d.caratteri} caratteri letti senza riscrivere nulla${d.allegati ? ` · ${d.allegati} ${plurale(d.allegati, "allegato letto", "allegati letti")} come testo, le immagini non vengono analizzate` : ""}` },
  { titolo: "Allineamento al registro delle pratiche", dettaglio: (d) => `${d.aperte} ${plurale(d.aperte, "pratica aperta", "pratiche aperte")} confrontate` },
  { titolo: "Riconoscimento categoria e area di servizio", dettaglio: (d) => d.dalModello ? "categoria e area lette dal modello" : (d.termini ? `${d.termini} ${plurale(d.termini, "termine", "termini")} del lessico incontrati` : "nessun termine del lessico incontrato") },
  { titolo: "Stima della priorità e dello SLA", dettaglio: (d) => d.dalModello ? "gravità stimata dal modello" : (d.aggravamenti ? `${d.aggravamenti} ${plurale(d.aggravamenti, "elemento", "elementi")} di gravità nel testo` : "nessun elemento di gravità nel testo") },
  { titolo: "Preparazione della scheda di assegnazione", dettaglio: (d) => d.dalModello ? "destinazione decisa dal modello" : `destinazione proposta: ${d.ufficio}` },
];

function plurale(n, singolare, pluraleForma) {
  return n === 1 ? singolare : pluraleForma;
}

/* durata totale ~2,6 secondi: abbastanza da leggere i passi,
   troppo poco per dare noia a una presentazione.
   ?lento=1 allunga la fase per collaudi a schermo. */
const AI_MS = /[?&]lento=1/.test(location.search) ? 40000 : 2700;
const PASSI_IN_MILLISECONDI = [420, 900, 1450, 1950, 2400, 2700].map((r) => Math.round((r / 2700) * AI_MS));
let sessioneAnalisi = 0;
let sessioneSmista = 0;

function fermaAnalisi() {
  sessioneAnalisi += 1;
  stato.faseAnalisi = null;
  fermaSmistamento();
}

/* ---------- smistamento animato ----------------------------------
   Breve scena dopo "Assegna e registra": mostra il messaggio che
   lascia la casella e atterra nell'ufficio pertinente. La pratica e'
   gia' registrata quando la scena comincia: qui non si aspetta nulla,
   si fa vedere il lavoro gia' compiuto.
------------------------------------------------------------------- */
const PASSI_SMISTA_MS = [0, 850, 2100, 3300];

function fermaSmistamento() {
  sessioneSmista += 1;
  stato.faseSmista = null;
}

function datiSmistamento() {
  const f = finale();
  const p = stato.ultima;
  return {
    passo: 0,
    protocollo: p.protocollo,
    oggetto: p.oggetto || "",
    ufficio: f.ufficio,
    motivazione: f.routing.motivazione,
  };
}

function avviaSmistamento() {
  fermaSmistamento();
  const s = ++sessioneSmista;
  stato.faseSmista = datiSmistamento();
  PASSI_SMISTA_MS.forEach(function (ritardo, i) {
    setTimeout(function () {
      if (s !== sessioneSmista || stato.vista !== "posta" || stato.passo !== 4) return; /* l'operatore e' andato via */
      if (i === PASSI_SMISTA_MS.length - 1) {
        stato.faseSmista = null;
        disegna();
      } else {
        stato.faseSmista.passo = i + 1;
        disegna();
      }
    }, ritardo);
  });
}

function smistamentoAnimata() {
  const f = stato.faseSmista;
  const uff = UFFICI[f.ufficio];
  const inVolo = f.passo >= 1;
  const atterrata = f.passo >= 2;
  const uffici = Object.keys(UFFICI).filter((id) => id !== "direzione");
  const chip = (id) => {
    const meta = id === f.ufficio;
    const classe = "uff-chip" + (meta ? (atterrata ? " meta atterrata" : " meta") : "");
    return `<div class="${classe}">
      <span class="nodo-ufficio">${icona(meta ? (atterrata ? "check-check" : "arrow-right") : "folder-check")}</span>
      <div class="uff-testo"><b>${esc(UFFICI[id].label)}</b>${meta ? `<span class="resp">${esc(uff.responsabile)}</span>` : ""}</div>
    </div>`;
  };
  const esito = atterrata
    ? `<div class="avviso neutro"><b>${icona("check-check")} Smistata in ${esc(uff.label)}.</b><br>
        ${esc(f.motivazione)}<br>Responsabile che la riceve: <b>${esc(uff.responsabile)}</b>.</div>`
    : `<p class="eta-ai">Apertura della pratica ${esc(f.protocollo)} e assegnazione in corso…</p>`;
  return `<section class="card">
    <h2>Smistamento</h2>
    <p class="guida">Il messaggio <b>${esc(f.oggetto)}</b> è stato acquisito come pratica <b>${esc(f.protocollo)}</b> e ora lascia la casella del Customer Care.</p>
    <div class="smista-scena">
      <div class="nodo partenza${inVolo ? " vuoto" : ""}">
        ${icona("inbox")}
        <div class="nodo-testo"><b>Posta in arrivo</b><span>${esc(CASSETTO.indirizzo)}</span></div>
      </div>
      <div class="linea-smista${inVolo ? " in-volo" : ""}${atterrata ? " compiuta" : ""}">
        <span class="busta${inVolo ? " vola" : ""}">${icona("mail")}</span>
      </div>
      <div class="uffici-fila">${uffici.map(chip).join("")}</div>
    </div>
    ${esito}
    <div class="azioni">
      ${atterrata ? "" : '<button class="b minimo" data-azione="salta-smistamento">mostra l\'esito adesso</button>'}
    </div>
  </section>`;
}

function analisiInCorso() {
  const f = stato.faseAnalisi;
  const percentuale = Math.round((f.indice / FASI_ANALISI.length) * 100);

  const righe = FASI_ANALISI.map((fase, i) => {
    const fatta = i < f.indice;
    const classe = fatta ? "fatta" : i === f.indice ? "in-corso" : "";
    const dettaglio = i <= f.indice ? `<span class="dettaglio-fase">${esc(fase.dettaglio(f.dati))}</span>` : "";
    return `<li class="${classe}"><span class="marcatore"></span><div>${esc(fase.titolo)}${dettaglio}</div></li>`;
  }).join("");

  return `<section class="card">
    <h2>2. Lettura automatica</h2>
    <p class="guida">Sto leggendo <b>${esc(stato.messaggio.oggetto)}</b> come è arrivato.</p>
    <div class="progresso"><i style="width:${percentuale}%"></i></div>
    <div class="eta-ai" id="etaAI">${stato.faseModello ? `Lettura del modello in corso · ${Math.max(1, Math.round((Date.now() - (stato.tAnalisi || Date.now())) / 1000))}s` : `Lettura AI in corso · ancora ~${Math.max(1, Math.ceil((AI_MS - (Date.now() - (stato.tAnalisi || Date.now()))) / 1000))}s`}</div>
    <ul class="fasi">${righe}</ul>
    <div class="azioni">
      <button class="b minimo" data-azione="annulla-analisi">annulla l'attesa</button>
    </div>
  </section>`;
}

/* ---------- passo 2 : lettura -------------------------------------- */
function passo2() {
  const a = stato.analisi;
  const f = finale();

  const sceltaCategoria = `<select data-campo="categoria">
      <option value=""${f.categoria ? "" : " selected"}>— scegli la categoria —</option>${CATEGORIE.map(
        (c) => `<option value="${c.id}" ${f.categoria === c.id ? "selected" : ""}>${esc(c.label)}</option>`
      ).join("")}</select>`;

  const sceltaGravita = `<select data-campo="gravita">${BANDITE.map(
    (b) => `<option value="${b.id}" ${f.gravita === b.id ? "selected" : ""}>${esc(b.label)}</option>`
  ).join("")}</select>`;

  const sceltaZona = `<select data-campo="zona"><option value="">Area da verificare</option>${ZONE.map(
    (z) => `<option value="${z.id}" ${f.zona === z.id ? "selected" : ""}>${esc(z.label)}</option>`
  ).join("")}</select>`;

  const duplicati = a.duplicati.length
    ? `<div class="avviso"><b>Pratica simile già aperta.</b> ${a.duplicati
        .map(
          (d) =>
            `${esc(d.protocollo)} (${Math.round(d.somiglianza * 100)}% di sovrapposizione${d.motivo.length ? ", " + esc(d.motivo.join(", ")) : ""})`
        )
        .join(" · ")} — verifica se unirla prima di aprirne una seconda.</div>`
    : "";

  const barra = `<div class="barra-punti"><i style="width:${a.gravita.punteggio}%;background:${f.banda.colore}"></i></div>`;

  return `${duplicati}
  <section class="card">
    <h2>2. Lettura automatica</h2>
    <p class="copertina">Analisi ${esc(a.versione)}${a.motore === "ai" ? " · prove verificate frase per frase sul testo del messaggio" : ""}</p>
    <p class="guida">Il testo del messaggio non è stato riscritto: le decisioni qui sotto vengono da come è arrivato.
      Ogni scelta mostra le parole che l'hanno prodotta; se qualcosa non torna, correggi e la correzione resta agli atti.</p>
    <div class="griglia-esiti">
      <div class="decisione"><h3>Categoria</h3>
        <div class="valore">${esc(labelCategoria(f.categoria))}</div>
        ${sceltaCategoria}
        ${f.correzioni.indexOf("categoria") !== -1 ? notaManuale() : bloccoProve(a.categoria.prove, "Nessuna parola chiave incontrata: scegli la categoria a mano.")}
      </div>
      <div class="decisione"><h3>Gravità</h3>
        <div class="valore">${badgeBanda(f.banda)}</div>
        ${sceltaGravita}
        ${barra}
        ${f.correzioni.indexOf("gravità") !== -1 ? notaManuale() : bloccoProve(a.gravita.prove, "Nessun elemento di aggravamento nel messaggio.")}
        <p class="copertina">Punteggio ${a.gravita.punteggio}/100 · SLA ${esc(f.banda.sla)}</p>
      </div>
      <div class="decisione"><h3>Area di servizio</h3>
        <div class="valore">${esc(labelZona(f.zona))}</div>
        ${sceltaZona}
        ${f.correzioni.indexOf("zona") !== -1 ? notaManuale() : bloccoProve(a.zona.prove.map((t) => ({ termine: t })), "Nessun toponimo riconosciuto: indica l'area a mano.")}
      </div>
    </div>
    <div class="azioni">
      <button class="b secondo" data-azione="passo" data-p="1">Indietro, al messaggio</button>
      <button class="b primario" data-azione="passo" data-p="3"${f.categoria ? "" : " disabled"}>${icona("arrow-right")}<span>Smista all'ufficio</span></button>
      <button class="b minimo" data-azione="analizza">Rianalizza</button>
    </div>
  </section>`;
}

function notaManuale() {
  return `<p class="manuale">Valore corretto a mano dall'operatore: l'assegnazione segue questa scelta.</p>`;
}

/* ---------- passo 3 : instradamento -------------------------------- */
function passo3() {
  const f = finale();
  const proposte = [{ id: f.routing.ufficio, label: UFFICI[f.routing.ufficio].label, consigliato: true }].concat(f.routing.alternative);

  const scelteUfficio = proposte
    .map(
      (p) => `<label class="prova" style="border-left-color:${p.consigliato ? "var(--magenta)" : "var(--regola)"}">
        <input type="radio" name="ufficio" data-campo="ufficio" value="${p.id}" ${f.ufficio === p.id ? "checked" : ""} style="width:auto;margin-right:8px">${esc(p.label)}${
        p.consigliato ? ' <b style="font-size:11.5px;color:var(--magenta)">consigliato</b>' : ""
      }</label>`
    )
    .join("");

  const correzioni = f.correzioni.length
    ? `<p class="manuale">Correzioni applicate dall'operatore: ${esc(f.correzioni.join(", "))}</p>`
    : `<p class="copertina">Nessuna correzione: la pratica segue l'analisi automatica.</p>`;

  return `<section class="card">
    <h2>3. Smistamento</h2>
    <p class="guida">L'ufficio proposto dipende dalla categoria confermata al passo precedente. Puoi dirottare la pratica
      su un altro ufficio: la scelta viene tracciata nella scheda.</p>
    <div class="laboratorio">
      <div class="sinistra">
        <div class="campo-dettaglio"><div class="chiave">Assegnata a</div>
          <strong>${esc(UFFICI[f.ufficio].label)}</strong><br><span class="copertina">${esc(UFFICI[f.ufficio].responsabile)}</span></div>
        <div class="campo-dettaglio"><div class="chiave">Perché questo ufficio</div>${esc(f.routing.motivazione)}</div>
        <div class="campo-dettaglio"><div class="chiave">Scadenza di servizio</div>
          ${badgeBanda(f.banda)} entro ${esc(f.banda.sla)}</div>
        <p class="copertina"><b>Altre destinazioni possibili</b></p>
        ${scelteUfficio}
        ${correzioni}
      </div>
      <div class="destra">${mappaSVG(f.zona)}<p class="copertina">${esc(labelZona(f.zona))} — area ricavata dal messaggio.</p></div>
    </div>
    <div class="azioni">
      <button class="b secondo" data-azione="passo" data-p="2">Indietro</button>
      <button class="b primario" data-azione="registra">${icona("send")}<span>Assegna e registra</span></button>
    </div>
  </section>`;
}

/* ---------- passo 4 : esito + registro ----------------------------- */
function passo4() {
  const p = stato.ultima;
  if (!p) {
    tornaAllaCoda();
    return cassettoPosta();
  }
  return `<section class="card">
    <h2>4. Pratica registrata e smistata</h2>
    <p class="guida">Il messaggio è passato nella cartella <b>Inoltrate agli uffici</b> e la pratica è entrata nel registro di ${esc(UFFICI[p.ufficio] ? UFFICI[p.ufficio].label : "l'ufficio destinatario")}.</p>
    <div class="avviso neutro"><b>${esc(p.protocollo)}</b> — ${esc(p.oggetto || "")}<br>
      Assegnata a ${esc(UFFICI[p.ufficio].label)} · priorità ${esc(banda(p.gravita).label)}, SLA ${esc(banda(p.gravita).sla)}.</div>
    <div class="azioni">
      <button class="b primario" data-azione="apri" data-id="${esc(p.protocollo)}">Apri la scheda</button>
      <button class="b secondo" data-azione="vista" data-v="registro">Vai al registro</button>
      <button class="b minimo" data-azione="nuova">Torna alla posta in arrivo</button>
    </div>
  </section>${registro()}`;
}

/* ---------- registro ------------------------------------------------ */
function registro() {
  const filtri = stato.filtri;
  const righe = stato.doc.segnalazioni
    .filter((r) => {
      if (filtri.stato && r.stato !== filtri.stato) return false;
      if (filtri.ufficio && r.ufficio !== filtri.ufficio) return false;
      if (filtri.categoria && r.categoria !== filtri.categoria) return false;
      if (filtri.q) {
        const q = normalizza(filtri.q);
        if (normalizza(`${r.testo} ${r.protocollo} ${r.cliente || ""} ${r.oggetto || ""}`).indexOf(q) === -1) return false;
      }
      return true;
    })
    .sort((a, b) => String(b.creato).localeCompare(String(a.creato)));

  const tutte = stato.doc.segnalazioni;
  const conta = (n, etichetta) => `<div class="conto"><b>${n}</b><span>${etichetta}</span></div>`;
  const contatori =
    conta(tutte.length, "pratiche") +
    conta(tutte.filter((r) => r.stato === "nuova").length, "da assegnare") +
    conta(tutte.filter((r) => r.stato === "assegnata").length, "assegnate") +
    conta(tutte.filter((r) => r.gravita === "critica" || r.gravita === "alta").length, "alta o critica");

  const corpo = righe.length
    ? righe
        .map((r) => {
          const b = banda(r.gravita);
          const uff = UFFICI[r.ufficio] ? UFFICI[r.ufficio].label.replace(/^Settore\s[^—]*—\s*/, "") : "—";
          return `<tr class="riga-clik" data-azione="apri" data-id="${esc(r.protocollo)}">
            <td><b>${esc(r.protocollo)}</b><br><span class="copertina">${esc(breve(r.creato))} · ${esc(r.canale)}</span></td>
            <td>${esc(r.oggetto || labelCategoria(r.categoria))}<br><span class="copertina">${esc(labelCategoria(r.categoria))} · ${esc(labelZona(r.zona))}</span></td>
            <td>${badgeBanda(b)}</td>
            <td>${esc(uff)}</td>
            <td>${badgeStato(r.stato)}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5" class="copertina">Nessuna pratica con questi filtri.</td></tr>`;

  return `<section class="card">
    <h2>Registro delle pratiche</h2>
    <p class="guida">Clicca una riga per aprire la scheda, con il messaggio originale, la motivazione
      dell'assegnazione e lo storico.</p>
    <div class="contatori">${contatori}</div>
    <div class="filtri">
      <select data-campo="f-stato"><option value="">Tutti gli stati</option>${Object.keys(STATI)
        .map((k) => `<option value="${k}" ${filtri.stato === k ? "selected" : ""}>${esc(STATI[k].label)}</option>`)
        .join("")}</select>
      <select data-campo="f-ufficio"><option value="">Tutti gli uffici</option>${Object.keys(UFFICI)
        .map((k) => `<option value="${k}" ${filtri.ufficio === k ? "selected" : ""}>${esc(UFFICI[k].label)}</option>`)
        .join("")}</select>
      <select data-campo="f-categoria"><option value="">Tutte le categorie</option>${CATEGORIE.map(
        (c) => `<option value="${c.id}" ${filtri.categoria === c.id ? "selected" : ""}>${esc(c.label)}</option>`
      ).join("")}</select>
      <input type="text" data-campo="f-q" placeholder="Oggetto, testo, numero di pratica" value="${esc(filtri.q)}">
    </div>
    <table class="registro">
      <thead><tr><th>Protocollo</th><th>Oggetto</th><th>Gravità</th><th>Ufficio</th><th>Stato</th></tr></thead>
      <tbody>${corpo}</tbody>
    </table>
  </section>`;
}

/* ---------- scheda di dettaglio ------------------------------------- */
function dettaglio() {
  const r = stato.doc.segnalazioni.find((x) => x.protocollo === stato.aperta);
  if (!r) {
    stato.vista = "registro";
    return registro();
  }
  const b = banda(r.gravita);
  const a = r.analisi;
  const dopo = { nuova: "assegnata", assegnata: "risolta", risolta: null }[r.stato];

  const proveCat = a && a.proveCategoria && a.proveCategoria.length ? bloccoProve(a.proveCategoria, "") : "";
  const proveGrav = a && a.proveGravita && a.proveGravita.length ? bloccoProve(a.proveGravita, "") : "";
  const correzioni = a && a.correzioni && a.correzioni.length
    ? `<p class="manuale">Correzioni dell'operatore: ${esc(a.correzioni.join(", "))}</p>`
    : "";
  const azioneStato = dopo
    ? `<button class="b secondo" data-azione="avanza" data-id="${esc(r.protocollo)}" data-stato="${dopo}">${
        dopo === "assegnata" ? "Conferma assegnazione" : "Segna come risolta"
      }</button>`
    : "";

  return `<section class="card">
    <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1 1 320px">
        <h2>${esc(r.protocollo)}</h2>
        <p class="guida">${esc(r.oggetto || "Senza oggetto")} · ${esc(breve(r.creato))} · ${esc(r.canale)}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${badgeStato(r.stato)}${azioneStato}</div>
    </div>

    <div class="intestazione-messaggio">
      <div><span class="chiave">Arrivata da</span>${esc(r.da || r.cliente || "anonimo")}</div>
      <div><span class="chiave">Canale</span>${esc(r.canale)}</div>
    </div>
    <div class="testo-segnalazione">${esc(r.testo)}</div>

    <div class="laboratorio" style="margin-top:22px">
      <div class="sinistra">
        <div class="griglia-esiti">
          <div class="decisione"><h3>Categoria</h3><div class="valore">${esc(labelCategoria(r.categoria))}</div>${proveCat}</div>
          <div class="decisione"><h3>Gravità</h3><div class="valore">${badgeBanda(b)}</div>
            <div class="barra-punti"><i style="width:${r.punteggio}%;background:${b.colore}"></i></div>
            ${proveGrav}<p class="copertina">Punteggio ${r.punteggio}/100</p></div>
        </div>
        <div class="campo-dettaglio" style="margin-top:18px"><div class="chiave">Assegnazione</div>
          ${esc(UFFICI[r.ufficio] ? UFFICI[r.ufficio].label : "—")} · priorità ${esc(b.label)}, SLA ${esc(b.sla)}</div>
        ${correzioni}
        ${a ? `<p class="copertina">Analisi ${esc(a.versione)} del ${esc(breve(a.timestampISO || r.creato))}</p>` : ""}
      </div>
      <div class="destra">${mappaSVG(r.zona)}
        <p class="copertina">${esc(labelZona(r.zona))}</p>
        <p class="copertina"><b>Storico</b></p>
        <ul class="storico">${r.storico
          .map((s) => `<li><span class="quando">${esc(s.data)}</span>${esc(s.testo)}</li>`)
          .join("")}</ul>
      </div>
    </div>
    <div class="azioni"><button class="b secondo" data-azione="vista" data-v="registro">Torna al registro</button></div>
  </section>`;
}

/* ---------- barra dei passi + render --------------------------------- */
function barraPassi() {
  return `<div class="passi">${PASSI.map((label, i) => {
    const n = i + 1;
    const classe = n === stato.passo ? "attivo" : n < stato.passo ? "fatto" : "";
    return `<div class="passo ${classe}"><span class="n">${n}</span>${esc(label)}</div>`;
  }).join("")}</div>`;
}

function disegna() {
  let corpo;
  if (stato.passo === 4 && !stato.ultima) stato.passo = 1;
  if (stato.vista === "posta") {
    corpo = barraPassi();
    if (stato.passo === 1) corpo += cassettoPosta();
    else if (stato.passo === 2) corpo += stato.faseAnalisi ? analisiInCorso() : stato.analisi ? passo2() : erroreAnalisiCard();
    else if (stato.passo === 3) corpo += passo3();
    else corpo += stato.faseSmista ? smistamentoAnimata() : passo4();
  } else if (stato.vista === "registro") {
    corpo = registro();
  } else {
    corpo = dettaglio();
  }
  document.getElementById("app").innerHTML = intestazione() + `<main>${corpo}</main>` + piéDiPagina();
}

/* ---------- azioni ------------------------------------------------------ */
function tornaAllaCoda() {
  fermaAnalisi();
  stato.cartella = "arrivo";
  stato.messaggio = null;
  stato.analisi = null;
  stato.scelte = null;
  stato.erroreAnalisi = null;
  stato.passo = 1;
}

function cambiaCartella(id) {
  tornaAllaCoda();
  stato.cartella = id === "inoltrate" ? "inoltrate" : "arrivo";
}

function apriMessaggio(id) {
  const m = stato.doc.messaggi.find((x) => x.id === id);
  if (!m) return;
  fermaAnalisi();
  m.letto = true;
  Store.salva(stato.doc);
  stato.messaggio = m;
  stato.analisi = null;
  stato.scelte = null;
  stato.erroreAnalisi = null;
  stato.passo = 1;
}

function simulaArrivo() {
  const prossimo = ARRIVI_SIMULATI[stato.doc.prossimi];
  if (!prossimo) return;
  fermaAnalisi();
  const copia = JSON.parse(JSON.stringify(prossimo));
  copia.ricevuto = adesso();
  copia.letto = false;
  stato.doc.messaggi.unshift(copia);
  stato.doc.prossimi += 1;
  Store.salva(stato.doc);
  stato.vista = "posta";
  stato.cartella = "arrivo";
  stato.messaggio = copia;
  stato.analisi = null;
  stato.scelte = null;
  stato.erroreAnalisi = null;
  stato.passo = 1;
}

/* Strumento di prova-stati.html SOLO: gli stati congelati della QA
   hanno bisogno di un'analisi deterministica, e il motore a regole fa
   quello. Nella demo vera non esiste più un percorso a regole: legge
   solo il modello, o l'analisi fallisce in modo visibile. */
function analisiRegolePerProva() {
  const a = analizza(stato.messaggio.corpo, stato.doc.segnalazioni);
  stato.analisi = a;
  stato.scelte = { categoria: null, gravita: null, ufficio: null };
  stato.passo = 2;
  return a;
}
function datiFaseRegole(a) {
  return {
    canale: stato.messaggio.canale,
    caratteri: stato.messaggio.corpo.length,
    aperte: stato.doc.segnalazioni.filter((r) => r.stato !== "risolta").length,
    allegati: (stato.messaggio.allegati || []).length,
    termini: a.categoria.prove.length,
    aggravamenti: a.gravita.prove.length,
    ufficio: UFFICI[a.routing.ufficio].label,
    dalModello: false,
  };
}

/* La lettura la fa SEMPRE il modello vero dietro il BFF: la chiamata
   parte subito e le fasi scorrono in parallelo. I numeri mostrati in
   attesa sono solo quelli veri (canale, caratteri, pratiche aperte).
   Se il BFF non c'e' o il modello non risponde l'analisi fallisce con
   una card d'esito onesta: niente verdetti finti dalle regole. */
function analizzaEVai() {
  const sessione = ++sessioneAnalisi;
  const m = stato.messaggio;
  stato.passo = 2;
  stato.analisi = null;
  stato.scelte = null;
  stato.erroreAnalisi = null;
  stato.faseModello = true;
  stato.tAnalisi = Date.now();
  stato.faseAnalisi = {
    indice: 0,
    dati: {
      canale: m.canale,
      caratteri: m.corpo.length,
      aperte: stato.doc.segnalazioni.filter((r) => r.stato !== "risolta").length,
      allegati: (m.allegati || []).length,
      dalModello: true,
    },
  };
  clearInterval(stato.etaTimer);
  stato.etaTimer = setInterval(function () {
    const el = document.getElementById("etaAI");
    if (!el || sessione !== sessioneAnalisi) { clearInterval(stato.etaTimer); return; }
    el.textContent = "Lettura del modello in corso · " + Math.max(1, Math.round((Date.now() - stato.tAnalisi) / 1000)) + "s";
  }, 900);
  PASSI_IN_MILLISECONDI.slice(0, -1).forEach(function (ritardo, i) {
    setTimeout(function () {
      if (sessione !== sessioneAnalisi || stato.vista !== "posta" || stato.passo !== 2 || !stato.faseAnalisi) return;
      stato.faseAnalisi = { indice: i + 1, dati: stato.faseAnalisi.dati };
      disegna();
    }, ritardo);
  });

  const aperte = stato.doc.segnalazioni
    .filter((r) => r.stato !== "risolta")
    .slice(0, 12)
    .map((r) => ({
      protocollo: r.protocollo,
      oggetto: r.oggetto,
      testo: String(r.testo || "").slice(0, 260),
      categoria: r.categoria,
      zona: r.zona,
      stato: r.stato,
    }));

  AI.analizza(m, aperte)
    .then(function (a) {
      if (sessione !== sessioneAnalisi || stato.passo !== 2) return; /* nel frattempo l'operatore e' andato */
      clearInterval(stato.etaTimer);
      stato.faseModello = false;
      stato.faseAnalisi = null;
      stato.analisi = a;
      stato.scelte = { categoria: null, gravita: null, ufficio: null };
      if (!AI.modello) AI.indaga().then(disegna); /* il badge si accende alla prima risposta vera */
      disegna();
    })
    .catch(function (err) {
      if (sessione !== sessioneAnalisi) return;
      clearInterval(stato.etaTimer);
      stato.faseModello = false;
      stato.faseAnalisi = null;
      stato.erroreAnalisi = String((err && err.message) || err);
      disegna();
    });
}

/* esito onesto quando il modello non ha letto nulla: nessun verdetto,
   il messaggio resta com'e', si riprova o si torna indietro */
function erroreAnalisiCard() {
  return `<section class="card">
    <h2>2. Lettura non riuscita</h2>
    <div class="avviso"><b>Il modello non ha letto il messaggio.</b> ${esc(stato.erroreAnalisi || "nessuna risposta")}.<br>
      I verdetti di questa demo li produce solo il modello vero: niente analisi fingibili.</div>
    <p class="copertina">Se non l'hai gia' fatto: avvia il BFF con <code>node server/server.js</code>
      o con doppio clic su <b>Avvia con modello vero.command</b>, poi premi Riprova.</p>
    <div class="azioni">
      <button class="b secondo" data-azione="passo" data-p="1">Indietro, al messaggio</button>
      <button class="b primario" data-azione="analizza">${icona("scan-search")}<span>Riprova</span></button>
    </div>
  </section>`;
}

function registraPratica() {
  const f = finale();
  const a = stato.analisi;
  const m = stato.messaggio;
  const protocollo = Store.nuovoProtocollo(stato.doc.segnalazioni);
  const pratica = {
    id: protocollo,
    protocollo: protocollo,
    creato: adesso(),
    canale: m.canale,
    da: m.da,
    cliente: nomeDa(m.da),
    oggetto: m.oggetto,
    messaggioId: m.id,
    testo: m.corpo,
    categoria: f.categoria,
    gravita: f.gravita,
    punteggio: a.gravita.punteggio,
    zona: f.zona,
    ufficio: f.ufficio,
    stato: "assegnata",
    storico: [
      { data: breve(adesso()), testo: `Messaggio ricevuto via ${m.canale} e preso in carico dal Customer Care` },
      { data: breve(adesso()), testo: `Smistata a ${UFFICI[f.ufficio].label} — SLA ${f.banda.sla}` },
    ],
    analisi: {
      versione: a.versione,
      motore: a.motore || "regole",
      timestampISO: adesso(),
      proveCategoria: a.categoria.prove,
      proveGravita: a.gravita.prove,
      correzioni: f.correzioni,
    },
  };
  stato.doc.segnalazioni.unshift(pratica);
  m.pratica = protocollo;
  Store.salva(stato.doc);
  stato.ultima = pratica;
  stato.passo = 4;
  avviaSmistamento();
}

function avanzaStato(protocollo, nuovo) {
  const r = stato.doc.segnalazioni.find((x) => x.protocollo === protocollo);
  if (!r) return;
  r.stato = nuovo;
  r.storico.push({ data: breve(adesso()), testo: STATI[nuovo].label + " dal Customer Care" });
  Store.salva(stato.doc);
}

/* ---------- eventi ------------------------------------------------------- */
document.addEventListener("click", function (ev) {
  const el = ev.target.closest("[data-azione]");
  if (!el) return;
  const azione = el.getAttribute("data-azione");

  if (azione === "simula-arrivo") {
    simulaArrivo();
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "apri-messaggio") {
    apriMessaggio(el.getAttribute("data-id"));
    disegna();
    return;
  }
  if (azione === "cartella") {
    cambiaCartella(el.getAttribute("data-c"));
    disegna();
    return;
  }
  if (azione === "chiudi-messaggio") {
    stato.messaggio = null;
    disegna();
    return;
  }
  if (azione === "analizza") {
    analizzaEVai();
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "annulla-analisi") {
    /* il modello non ha ancora risposto: si torna al messaggio senza
       inventarsi un verdetto; la risposta tardiva verra' ignorata */
    fermaAnalisi();
    stato.passo = 1;
    disegna();
    return;
  }
  if (azione === "salta-smistamento") {
    fermaSmistamento();
    disegna();
    return;
  }
  if (azione === "passo") {
    stato.passo = Number(el.getAttribute("data-p"));
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "registra") {
    registraPratica();
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "nuova") {
    tornaAllaCoda();
    stato.vista = "posta";
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "apri") {
    fermaAnalisi();
    stato.aperta = el.getAttribute("data-id");
    stato.vista = "dettaglio";
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "vista") {
    fermaAnalisi();
    stato.vista = el.getAttribute("data-v");
    if (stato.vista === "posta" && stato.passo === 4) tornaAllaCoda();
    disegna();
    window.scrollTo(0, 0);
    return;
  }
  if (azione === "avanza") {
    avanzaStato(el.getAttribute("data-id"), el.getAttribute("data-stato"));
    disegna();
    return;
  }
  if (azione === "reset") {
    Store.azzera();
    stato.doc = Store.carica();
    tornaAllaCoda();
    stato.vista = "posta";
    disegna();
    return;
  }
});

function aggiornaCampi(ev) {
  const el = ev.target.closest("[data-campo]");
  if (!el) return;
  const campo = el.getAttribute("data-campo");
  const valore = el.value;

  if (["categoria", "gravita", "zona", "ufficio"].indexOf(campo) !== -1) {
    stato.scelte[campo] = valore || null;
    disegna();
    return;
  }
  if (campo.indexOf("f-") === 0) {
    stato.filtri[campo.slice(2)] = valore;
    disegna();
    const diNuovo = document.querySelector(`[data-campo="${campo}"]`);
    if (diNuovo && diNuovo.tagName === "INPUT") diNuovo.focus();
  }
}

document.addEventListener("input", aggiornaCampi);
document.addEventListener("change", aggiornaCampi);

disegna();
