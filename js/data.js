/* ------------------------------------------------------------------
   Dati di configurazione e archivio dimostrativo
   Set di prova: nomi, aziende e numeri di pratica di fantasia.
   Contesto: azienda di servizi B2B/B2C, casella Customer Care unica.
   ------------------------------------------------------------------ */

const ENTE = {
  nome: "Novara Service S.r.l.",
  app: "Smistamento email",
  servizio: "Casella unica del Customer Care",
};

/* --- Categorie -----------------------------------------------------
   keywords  -> lessico usato dal motore per riconoscere la categoria
   priority  -> rompe gli ex aequo (più specifica = numero più basso)
   base      -> gravità di partenza della categoria (scala 0-100)
   ufficio   -> destinatario naturale
   alternative -> uffici ripiegabili mostrati nel passo 3
------------------------------------------------------------------- */
const CATEGORIE = [
  {
    id: "guasti",
    label: "Guasti e assistenza",
    priority: 1,
    base: 45,
    ufficio: "tecnico",
    alternative: ["logistica", "care"],
    keywords: [
      "guasto", "guasti", "rotto", "rotta", "non funziona", "non funzionano",
      "non parte", "non si accende", "si è bloccato", "bloccato", "bloccata",
      "malfunzionamento", "fuori servizio", "blackout", "senza corrente",
      "senza linea", "internet", "riavvia", "riavviare", "schermo nero",
      "ascensore", "caldaia", "termosifoni", "cancellello", "serratura",
      "allarme", "ronzio", "rumore strano", "perde acqua", "gocciola",
      "non chiude", "non raffredda", "non riscalda", "intervento tecnico",
    ],
  },
  {
    id: "fatturazione",
    label: "Fatture e pagamenti",
    priority: 2,
    base: 30,
    ufficio: "amministrazione",
    alternative: ["commerciale", "care"],
    keywords: [
      "fattura", "fatture", "pagamento", "pagamenti", "pagata", "pagato",
      "bonifico", "sollecito", "scaduto", "scadenza", "ricevuta",
      "nota di credito", "addebito", "ribaddebito", "codice cliente",
      "partita iva", "contabilità", "fatturato", "quietanza",
    ],
  },
  {
    id: "ordini",
    label: "Ordini e consegne",
    priority: 3,
    base: 35,
    ufficio: "logistica",
    alternative: ["amministrazione", "commerciale"],
    keywords: [
      "ordine", "ordini", "consegna", "consegne", "consegnato", "consegnata",
      "corriere", "spedizione", "tracciamento", "pacco", "pacchi", "reso",
      "merce", "mancante", "sbagliato", "sbagliata", "bancale", "magazzino",
      "fornitore", "ritiro", "sostituzione", "imballaggio",
    ],
  },
  {
    id: "commerciale",
    label: "Preventivi e contratti",
    priority: 4,
    base: 25,
    ufficio: "commerciale",
    alternative: ["amministrazione", "care"],
    keywords: [
      "preventivo", "preventivi", "offerta", "listino", "prezzo", "costo",
      "costi", "sconto", "sconti", "rinnovo", "contratto", "convenzione",
      "forfait", "pacchetto", "acquistare", "acquisto", "prodotto", "demo",
      "condizioni economiche",
    ],
  },
  {
    id: "personale",
    label: "HR e selezioni",
    priority: 5,
    base: 20,
    ufficio: "hr",
    alternative: ["amministrazione", "care"],
    keywords: [
      "candidatura", "candidare", "curriculum", "cv", "selezione", "selezioni",
      "annuncio", "assunzione", "assumere", "tirocinio", "stage", "colloquio",
      "busta paga", "buste paga", "cedolino", "tfr", "ferie", "malattia",
      "maternità", "inviare il cv", "risorse umane", "hr", "assunta",
    ],
  },
  {
    id: "reclami",
    label: "Reclami e contestazioni",
    priority: 6,
    base: 40,
    ufficio: "care",
    alternative: ["amministrazione", "tecnico"],
    keywords: [
      "reclamo", "contestazione", "contestiamo", "disservizio", "malservizio",
      "inadempienza", "insoddisfatto", "insoddisfatta", "lamento", "lamentele",
      "nessuno viene", "nessun operatore", "pulizie", "sporco", "sporca",
      "sporchi", "sporcizia", "spazzatura", "degrado", "incustodito",
      "incustodita", "reception",
    ],
  },
];

/* --- Lessico di gravità -------------------------------------------
   w = contributo alla scala 0-100. Negativo = attenua.
------------------------------------------------------------------- */
const LESSICO_GRAVITA = [
  { w: 45, label: "danno a persone", termini: ["infortunio", "ferito", "feriti", "incidente", "caduto a terra", "caduta a terra", "si è fatto male", "fatto male", "colpito", "malore", "sotto shock", "rianimazione", "118"] },
  { w: 40, label: "pericolo immediato", termini: ["crollo", "cedimento", "crollato", "corto circuito", "scintille", "fumo", "incendio", "perdita di gas", "gas", "cavo elettrico", "cavo scoperto", "alta tensione"] },
  { w: 30, label: "utenza fragile coinvolta", termini: ["bambini", "bambine", "scuola", "asilo", "anziani", "anziana", "disabili", "carrozzina", "non vedenti", "ospedale", "degenti", "dialisi", "pazienti"] },
  { w: 15, label: "servizio interrotto", termini: ["senza linea", "senza corrente", "senza luce", "senza acqua", "da giorni", "da settimane", "da mesi", "non funziona", "fuori servizio", "inagibile", "offline", "irraggiungibile"] },
  { w: 15, label: "attività bloccata", termini: ["magazzino bloccato", "consegna saltata", "consegne saltate", "fermi lavoro", "non possiamo lavorare", "non può lavorare", "attività ferma", "linea ferma", "incassi bloccati", "impossibile incassare"] },
  { w: 20, label: "estensione dell'area", termini: ["tutta l'area", "tutto il piano", "tutti gli uffici", "tutte le sedi", "intero edificio", "interi piani", "tutto il complesso"] },
  { w: 15, label: "richiesta urgente del cliente", termini: ["urgente", "urgentissimo", "urge", "al più presto", "grave", "pericoloso", "pericolosa", "preoccupato", "denuncia"] },
  { w: 10, label: "igiene e salute", termini: ["topi", "ratti", "zanzare", "muffa", "scarafaggi", "puzza", "maleodorante", "liquami"] },
  { w: -20, label: "impatto contenuto dichiarato", termini: ["piccola", "piccolo", "lieve", "estetica", "estetico", "quando potete", "quando riuscite", "non urgente", "non è urgente", "fastidio minimo", "disagio contenuto"] },
];

/* tono = classe CSS del kit Galene (tinta + colore del testo),
   icona = Lucide: gravita e stati si leggono anche senza colore */
const BANDITE = [
  { id: "critica", label: "Critica", soglia: 75, sla: "24 ore", colore: "#7D328A", tono: "ferma", icona: "alert-octagon" },
  { id: "alta", label: "Alta", soglia: 50, sla: "3 giorni", colore: "#7D328A", tono: "allarme", icona: "alert-triangle" },
  { id: "media", label: "Media", soglia: 25, sla: "10 giorni", colore: "#8173B3", tono: "attesa", icona: "clock" },
  { id: "bassa", label: "Bassa", soglia: 0, sla: "30 giorni", colore: "#302A63", tono: "neutra", icona: "check" },
];

/* --- Uffici -------------------------------------------------------- */
const UFFICI = {
  tecnico: { label: "Ufficio Tecnico — manutenzioni e assistenza", responsabile: "Ing. M. Ferretti" },
  amministrazione: { label: "Amministrazione e finanza", responsabile: "Rag. F. Gasparini" },
  logistica: { label: "Logistica, acquisti e magazzino", responsabile: "Geom. L. Barbieri" },
  commerciale: { label: "Area commerciale — preventivi e contratti", responsabile: "Dott.ssa C. Bruni" },
  hr: { label: "Risorse umane e selezione", responsabile: "Dott.ssa S. Anselmi" },
  care: { label: "Customer Care — presa in carico unica", responsabile: "Coordinamento customer care" },
  direzione: { label: "Direzione", responsabile: "A. Rondelli, direttore" },
};

/* --- Aree servite e toponimi ---------------------------------------
   x/y sono coordinate nello schema 400x260 usato dalla mini-mappa.
------------------------------------------------------------------- */
const ZONE = [
  { id: "centro", label: "Novara — sede centrale", x: 198, y: 138 },
  { id: "nord", label: "Milano — filiale", x: 150, y: 52 },
  { id: "sud", label: "Torino — area servizi", x: 268, y: 216 },
  { id: "est", label: "Rho-Pero — centro servizi", x: 330, y: 118 },
  { id: "ovest", label: "Verbano — area laghi", x: 74, y: 170 },
  { id: "sanrocco", label: "Val d'Ossola — presidi", x: 352, y: 34 },
];

const TOPONIMI = [
  { nome: "novara centro", zona: "centro" },
  { nome: "sede centrale", zona: "centro" },
  { nome: "via fabrizio", zona: "centro" },
  { nome: "corso cavour", zona: "centro" },
  { nome: "filiale di milano", zona: "nord" },
  { nome: "sede distaccata di milano", zona: "nord" },
  { nome: "milano", zona: "nord" },
  { nome: "stabilimento di torino", zona: "sud" },
  { nome: "cantiere di torino", zona: "sud" },
  { nome: "torino", zona: "sud" },
  { nome: "centro servizi di rho", zona: "est" },
  { nome: "rho", zona: "est" },
  { nome: "fiera", zona: "est" },
  { nome: "pero", zona: "est" },
  { nome: "lago maggiore", zona: "ovest" },
  { nome: "lago d'orta", zona: "ovest" },
  { nome: "verbania", zona: "ovest" },
  { nome: "hotel belvedere", zona: "ovest" },
  { nome: "intra", zona: "ovest" },
  { nome: "val d'ossola", zona: "sanrocco" },
  { nome: "domodossola", zona: "sanrocco" },
  { nome: "ossola", zona: "sanrocco" },
];

/* --- Coda dei messaggi in arrivo ---------------------------------
    Nella demo niente inserimento a mano: il messaggio arriva da
    un canale reale (mail, PEC, telefono verbalizzato, WhatsApp,
    modulo del sito) e il Customer Care lo prende in carico cosi'
    com'e'.
------------------------------------------------------------------- */

/* orologio della demo: gli orari di arrivo sono relativi all'apertura */
function faMinuti(minuti) {
  const d = new Date(Date.now() - minuti * 60000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* gia' nella casella di posta quando la pagina si apre */
const ARRIVI_INIZIALI = [
  {
    id: "MSG-01",
    canale: "Email",
    da: "Carla Viganò — Facility Milano <c.vigano@facilitymilano.it>",
    oggetto: "URGENTE: ascensore bloccato con persona dentro",
    ricevuto: faMinuti(38),
    letto: false,
    allegati: ["scala-bloccata.jpg"],
    corpo:
      "Buongiorno, stamattina alle 8:30 l'ascensore di servizio della filiale di Milano si è bloccato tra il secondo e il terzo piano " +
      "con un nostro addetto dentro. È rimasto chiuso quasi venti minuti ed è uscito sotto shock, adesso è in osservazione in ospedale. " +
      "L'impianto non si riavvia e la cabina risulta bloccata: tutto il piano è fermo e il personale lavora al piano terra. " +
      "Serve un intervento urgente, nessuno usa più la cabina da stamattina.\n\n" +
      "Cordiali saluti\nCarla Viganò",
  },
  {
    id: "MSG-02",
    canale: "PEC",
    da: "Edilfalco Costruzioni <amministrazionefalco@legalmail.it>",
    oggetto: "Vostra nota di addebito n. 2026/1042 — contestazione",
    ricevuto: faMinuti(95),
    letto: false,
    corpo:
      "Spett.le azienda, con la presente contestiamo la fattura n. 2026/1042 di 4.800 euro, già saldata con bonifico del 3 novembre " +
      "come da ricevuta che alleghiamo. Nonostante questo abbiamo ricevuto un sollecito di pagamento con avviso di sospensione. " +
      "Verificate presso la vostra contabilità e inviateci nota di credito di rettifica, altrimenti rivolgeremo la pratica a un soggetto terzo. " +
      "Lavoro già eseguito presso il cantiere di Torino.\n\nDistinti saluti\nUfficio amministrativo Edilfalco",
  },
  {
    id: "MSG-03",
    canale: "Telefono",
    da: "Customer Care — verbalizzazione chiamata delle 08:40",
    oggetto: "Signora Anselmi: internet e telefono giù in negozio",
    ricevuto: faMinuti(185),
    letto: true,
    corpo:
      "La cliente telefona dal suo negozio di Domodossola: l'internet e il telefono sono giù e senza linea da ieri pomeriggio, " +
      "i pagamenti con carta non partono e non riesce a raggiungere il fornitore. Ha un'attività tutta per sé e dice che così " +
      "resta ferma, chiede se passate oggi.",
  },
  {
    id: "MSG-04",
    canale: "WhatsApp",
    da: "WhatsApp — cliente utenza 4481",
    oggetto: "Pulizie del secondo piano saltate",
    ricevuto: faMinuti(1520),
    letto: true,
    pratica: "PRC-2026-00401",
    corpo:
      "Buongiorno, vi scrivo dallo stabilimento di Torino: da quasi una settimana nessuno viene a fare le pulizie del secondo piano, " +
      "i cestini sono pieni e gli uffici sporchi.\nCoordinate 45.0623, 7.6869. I colleghi lavorano tra la carta e sono giustamente infastiditi.",
  },
  {
    id: "MSG-05",
    canale: "Modulo sito",
    da: "Modulo sito — richiesta nº 9814",
    oggetto: "Capire chi segue la mia pratica",
    ricevuto: faMinuti(240),
    letto: false,
    corpo:
      "Gentili, sono una cliente che usa i vostri servizi da anni. Avrei bisogno di un chiarimento su una richiesta che ho " +
      "già fatto in passato e che a quanto pare risulta ancora in lavorazione. Potreste farmi sapere chi la segue e a quale " +
      "reparto interno devo rivolgermi? Non ho capito come funziona.",
  },
];

/* da far arrivare uno alla volta con il pulsante "Simula nuovo arrivo" */
const ARRIVI_SIMULATI = [
  {
    id: "MSG-11",
    canale: "Email",
    da: "Serena Bianchi <s.bianchi@gmail.com>",
    oggetto: "Candidatura — reception diurna al centro servizi di Rho",
    ricevuto: null,
    corpo:
      "Buongiorno, ho visto sul vostro sito l'annuncio per una addetta al front office diurno presso il centro servizi di Rho. " +
      "Vi invio il mio curriculum: abito vicino a Milano e la sede distaccata di Milano mi sarebbe comoda per gli spostamenti. " +
      "Sono disponibile da gennaio e, se il profilo può interessare, felice di un colloquio.",
  },
  {
    id: "MSG-12",
    canale: "Email",
    da: "Luca Ferraris — operaio sede Milano <l.ferraris@facilitymilano.it>",
    oggetto: "ascensore di milano corso italia: ieri bloccato, oggi scala invece del piano",
    ricevuto: null,
    corpo:
      "sono uno degli addetti della filiale di Milano. stamattina entrando nell'ascensore di servizio sono inciampato sul bordo " +
      "e mi sono fatto male a un ginocchio: la cabina è ancora ferma tra il secondo e il terzo piano da ieri, quando si è bloccato " +
      "con un collega dentro. adesso la luce interna sfarfalla e nessuno vuole più usarlo. servono i tempi di riparazione, " +
      "non possiamo lavorare portandoci le cose a mano fino al secondo piano.",
  },
  {
    id: "MSG-13",
    canale: "Email",
    da: "Giorgio Pellegatta — Centro Servizi Rho <g.pellegatta@centroservirho.it>",
    oggetto: "Reception incustodita e sala d'attesa sporca",
    ricevuto: null,
    allegati: ["sala-attesa-varco.jpg", "cestini-pieni.jpg"],
    corpo:
      "Sono il referente del centro servizi di Rho: da lunedì il banco reception al varco est è incustodito, i visitatori " +
      "vengono dirottati alla vigilanza e la sala d'attesa resta sporca, piena di bicchieri e spazzatura. Tutta l'area " +
      "sta andando nel degrado e il disservizio si ripete per la terza volta in un mese. Questa volta intendo fare reclamo formale.",
  },
  {
    id: "MSG-14",
    canale: "Modulo sito",
    da: "Modulo sito — richiesta nº 9822",
    oggetto: "Ordine 4471: dodici sedie mai consegnate",
    ricevuto: null,
    corpo:
      "Per i nuovi uffici della sede centrale di Novara centro abbiamo fatto un ordine di dodici sedie ergonomiche: la " +
      "spedizione risulta ferma al centro di smistamento e il pacco non arriva. Senza quelle sedie la sala riunioni resta inutilizzabile.",
  },
  {
    id: "MSG-15",
    canale: "Email",
    da: "Paola Neri <paola.neri@outlook.it>",
    oggetto: "Caldaia dello stabilimento di Torino in modalità ridotta",
    ricevuto: null,
    corpo:
      "Buongiorno, dallo stabilimento di Torino la caldaia dell'edificio nord lavora in modalità ridotta da qualche giorno e i " +
      "termosifoni del piano terreno sono tiepidi. Non è pericoloso adesso, ma col freddo se si ferma restiamo senza riscaldamento; " +
      "fate sapere se serve una verifica.",
  },
  {
    id: "MSG-16",
    canale: "Telefono",
    da: "Customer Care — verbalizzazione chiamata delle 11:15",
    oggetto: "Pacco del fornitore ammaccato: richiesta di sostituzione",
    ricevuto: null,
    corpo:
      "L'impiegata della sede centrale di Novara centro telefona: il pacco di cancelleria del fornitore è arrivato ammaccato " +
      "e alcuni pezzi sono mancanti. Dice che è un disagio piccolo, non è urgente: quando potete mandate la sostituzione. " +
      "Chiede come procedere per il reso.",
  },
  {
    id: "MSG-17",
    canale: "PEC",
    da: "Grand Hotel Belvedere Srl <amministrazione@hotelbelvedere.it>",
    oggetto: "Richiesta preventivo per rinnovo del servizio reception",
    ricevuto: null,
    corpo:
      "Con la presente chiediamo preventivo e listino aggiornato per il rinnovo del servizio di reception e accoglienza " +
      "del nostro hotel sul Lago Maggiore: il contratto attuale arriva fino a dicembre e dal prossimo anno vorremmo estendere " +
      "la copertura anche alla fascia serale. Valuteremo il rinnovo a condizioni confermate.",
  },
  {
    id: "MSG-18",
    canale: "Email",
    da: "Studio Associato Rizzi <segreteria@studiorizzi.it>",
    oggetto: "Ultime due fatture con codice cliente sbagliato",
    ricevuto: null,
    corpo:
      "Buongiorno, piccola segnalazione: le ultime due fatture riportano il nostro codice cliente sbagliato, e la nostra " +
      "contabilità non riesce a registrarle i pagamenti. È una cosa piccola e lieve, quando potete inviateci le fatture " +
      "corrette così chiudiamo tutto. Grazie, scriviamo dagli uffici di Novara centro.",
  },
];


/* --- Archivio già presente all'avvio ------------------------------ */
const ARCHIVIO_INIZIALE = [
  {
    id: "PRC-2026-00412",
    protocollo: "PRC-2026-00412",
    creato: "2026-11-11T08:40",
    canale: "PEC",
    da: "Carla Viganò <c.vigano@pec.facilitymilano.it>",
    cliente: "Facility Milano",
    oggetto: "Ascensore di servizio bloccato — filiale di Milano",
    testo:
      "L'ascensore di servizio della filiale di Milano si è bloccato tra il secondo e il terzo piano: la porta non si apre e " +
      "una persona all'interno ha avuto bisogno di aiuto per uscire. Impianto fuori servizio, serve intervento urgente perché " +
      "tutto il piano resta bloccato.",
    categoria: "guasti",
    gravita: "alta",
    punteggio: 63,
    zona: "nord",
    ufficio: "tecnico",
    stato: "assegnata",
    storico: [
      { data: "11/11 08:40", testo: "Messaggio ricevuto via PEC e preso in carico" },
      { data: "11/11 09:05", testo: "Assegnata a Ufficio Tecnico — SLA 3 giorni" },
    ],
  },
  {
    id: "PRC-2026-00408",
    protocollo: "PRC-2026-00408",
    creato: "2026-11-09T15:12",
    canale: "Email",
    da: "Modulo sito — richiesta nº 9740",
    cliente: "Anonimo",
    oggetto: "Addebito doppio sull'ultima fattura",
    testo:
      "L'ultima fattura riporta un addebito doppio della stessa prestazione, il pagamento risulterebbe il doppio del Preventivo concordato.",
    categoria: "fatturazione",
    gravita: "media",
    punteggio: 42,
    zona: "centro",
    ufficio: "amministrazione",
    stato: "risolta",
    storico: [
      { data: "09/11 15:12", testo: "Messaggio ricevuto e preso in carico" },
      { data: "09/11 16:00", testo: "Assegnata ad Amministrazione e finanza — SLA 10 giorni" },
      { data: "12/11 11:20", testo: "Nota di credito emessa, chiusura pratica" },
    ],
  },
  {
    id: "PRC-2026-00401",
    protocollo: "PRC-2026-00401",
    creato: "2026-11-06T10:05",
    canale: "WhatsApp",
    da: "WhatsApp — cliente utenza 4481",
    cliente: "S. R., stabilimento di Torino",
    oggetto: "Pulizie del secondo piano saltate",
    testo:
      "Da qualche giorno le pulizie del secondo piano dello stabilimento di Torino saltano spesso, uffici sporchi e cestini pieni. Un disagio contenuto che si ripete.",
    categoria: "reclami",
    gravita: "bassa",
    punteggio: 22,
    zona: "sud",
    ufficio: "care",
    stato: "nuova",
    storico: [{ data: "06/11 10:05", testo: "Messaggio ricevuto via WhatsApp e preso in carico" }],
  },
];

const STATI = {
  nuova: { label: "Nuova", colore: "#302A63", tono: "neutra", icona: "inbox" },
  assegnata: { label: "Assegnata", colore: "#8173B3", tono: "attesa", icona: "arrow-right" },
  risolta: { label: "Risolta", colore: "#302A63", tono: "chiusa", icona: "check-check" },
};
