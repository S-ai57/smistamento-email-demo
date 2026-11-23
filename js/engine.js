/* ------------------------------------------------------------------
   Motore di analisi — regole deterministiche, versione 1.0
   Stesso testo => stessa analisi. Nessuna chiamata di rete.
   Nel deploy reale questo file e' l'unico pezzo che viene
   sostituito da una capacita' di piattaforma chiamata dal BFF.
   ------------------------------------------------------------------ */

const VERSIONE_REGOLE = "regole v1.0";

/* minuscole + senza accenti, per confrontare in modo robusto */
function normalizza(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function frasi(t) {
  return String(t || "")
    .split(/[.!?\n;]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 3);
}

/* cerca un termine come parola intera: "urgenza" non attiva "urge",
   "allagato" non attiva "allagata". Restituisce la posizione o -1. */
function escapeRe(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cercaTermine(testoNormalizzato, termine) {
  const t = escapeRe(normalizza(termine));
  const m = testoNormalizzato.match(new RegExp("(^|[^a-z0-9])" + t + "([^a-z0-9]|$)"));
  return m ? m.index + m[1].length : -1;
}

/* premessa negativa: "non e pericoloso" non e un aggravamento.
   guardata solo sulle parole che alzano la gravita' */
const PREMESSA_NEGATA = /(?:^|[^a-z0-9])(?:non|no|mai)(?:\s+(?:e|stato|stata|piu|affatto|proprio|del tutto))*\s+$/;

function negato(testoNormalizzato, posizione) {
  return PREMESSA_NEGATA.test(testoNormalizzato.slice(0, posizione));
}

/* --- 1. Categoria: chi più parole chiave distinte incontra -------- */
function analizzaCategoria(testo) {
  const liste = frasi(testo);
  const candidati = CATEGORIE.map((cat) => {
    const prove = [];
    const trovate = {};
    liste.forEach((frase) => {
      const fn = normalizza(frase);
      cat.keywords.forEach((kw) => {
        if (trovate[kw]) return;
        if (cercaTermine(fn, kw) !== -1) {
          trovate[kw] = true;
          prove.push({ termine: kw, frase: frase });
        }
      });
    });
    return {
      categoria: cat.id,
      label: cat.label,
      punteggio: Object.keys(trovate).length,
      prove: prove.sort((a, b) => b.termine.length - a.termine.length).slice(0, 6),
      priorita: cat.priority,
    };
  });

  const migliori = candidati
    .filter((c) => c.punteggio > 0)
    .sort((a, b) => b.punteggio - a.punteggio || a.priorita - b.priorita);

  if (!migliori.length) {
    return {
      categoria: null,
      label: "Non classificabile",
      punteggio: 0,
      prove: [],
      alternative: [],
      nota:
        "Nessuna parola chiave del lessico incontrata: la categoria va scelta dall'operatore.",
    };
  }  return {
    categoria: migliori[0].categoria,
    label: migliori[0].label,
    punteggio: migliori[0].punteggio,
    prove: migliori[0].prove,
    alternative: migliori.slice(1, 4).map((c) => ({ categoria: c.categoria, label: c.label, punteggio: c.punteggio })),
    nota: migliori[0].punteggio > 1 ? "convergenza di più termini" : "un solo termine incontrato",
  };
}

/* --- 2. Gravita': base di categoria + lessico, scala 0-100 -------- */
function analizzaGravita(testo, categoriaId) {
  const cat = CATEGORIE.find((c) => c.id === categoriaId);
  let punteggio = cat ? cat.base : 30;
  const prove = [];
  const liste = frasi(testo);

  LESSICO_GRAVITA.forEach((riga) => {
    /* ogni riga del lessico contribuisce una volta sola:
       "urgente", "grave" e "pericoloso" nello stesso testo sono
       la stessa richiesta di urgenza, non tre aggravamenti */
    for (let i = 0; i < liste.length; i++) {
      const fn = normalizza(liste[i]);
      const posizione = riga.termini.map((t) => cercaTermine(fn, t)).find((p) => p !== -1);
      if (posizione === undefined) continue;
      if (riga.w > 0 && negato(fn, posizione)) continue;
      const termine = riga.termini.find((t) => cercaTermine(fn, t) !== -1);
      punteggio += riga.w;
      prove.push({ termine: termine, frase: liste[i], contributo: riga.w, motivo: riga.label });
      break;
    }
  });

  punteggio = Math.max(0, Math.min(100, punteggio));
  const banda = BANDITE.find((b) => punteggio >= b.soglia);
  prove.sort((a, b) => Math.abs(b.contributo) - Math.abs(a.contributo));
  return { punteggio: punteggio, gravita: banda.id, label: banda.label, sla: banda.sla, colore: banda.colore, prove: prove.slice(0, 4) };
}

/* --- 3. Zona: toponimi incontrati --------------------------------- */
function analizzaZona(testo) {
  const tn = normalizza(testo);
  const colpiti = [];
  TOPONIMI.forEach((top) => {
    const i = cercaTermine(tn, top.nome);
    if (i !== -1) colpiti.push({ toponimo: top.nome, zona: top.zona, posizione: i });
  });
  if (!colpiti.length) {
    return { zona: null, label: "Area da verificare", prove: [] };
  }
  /* il toponimo più lungo (quindi più specifico) vince */
  colpiti.sort((a, b) => b.toponimo.length - a.toponimo.length);
  const z = ZONE.find((x) => x.id === colpiti[0].zona);
  return {
    zona: z.id,
    label: z.label,
    prove: colpiti.map((c) => c.toponimo),
  };
}

/* --- 4. Instradamento -------------------------------------------- */
function instrada(categoriaId, gravita) {
  const cat = CATEGORIE.find((c) => c.id === categoriaId);
  if (!cat) {
    return { ufficio: "care", motivazione: "Nessuna categoria assegnata: il messaggio resta al Customer Care per la classificazione manuale.", alternative: [] };
  }
  const banda = BANDITE.find((b) => b.id === gravita);
  const ufficio = UFFICI[cat.ufficio];
  const motivazione =
    "Categoria “" + cat.label + "” gestita da " + ufficio.label +
    ". Priorità " + banda.label.toLowerCase() + " con SLA " + banda.sla +
    (gravita === "critica" ? " — ne viene data comunicazione anche alla Direzione." : ".");
  const alternative = (gravita === "critica" ? ["direzione"].concat(cat.alternative) : cat.alternative)
    .filter((id, i, a) => a.indexOf(id) === i && id !== cat.ufficio)
    .slice(0, 3)
    .map((id) => ({ id: id, label: UFFICI[id].label }));
  return { ufficio: cat.ufficio, motivazione: motivazione, alternative: alternative };
}

/* --- 5. Duplicati: sovrapposizione di lessico + zona/categoria ---- */
const STOP = new Set(
  "a ad al alle ai all agli ad di del dei degli la lo le i gl li un uno una e ed o od ma pero come che chi cui quale quali per con su sopra sotto tra fra nel nello nei nelle il lo la gli le questo questa questi queste quello quella sono essere ha hanno ha fatto fatto molto molta molti piu gia anche dopo prima quando dove se non si c e v sono stata stato era erano ieri oggi domani buongiorno buongiorno buonasera gentile prego grazie salutati salve spettabile segnalo segnaliamo segnalo vorremmo chiesto chiedere".split(" ")
);

function tokenizz(testo) {
  const parole = normalizza(testo)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w) && !/^[0-9]+$/.test(w));
  return new Set(parole);
}

function cercaDuplicati(testo, categoriaId, zonaId, archivio) {
  const A = tokenizz(testo);
  if (!A.size) return [];
  const risultati = [];
  (archivio || []).forEach((r) => {
    if (r.stato === "risolta") return;
    const B = tokenizz(r.testo);
    if (!B.size) return;
    let comuni = 0;
    A.forEach((w) => { if (B.has(w)) comuni++; });
    let jaccard = comuni / (A.size + B.size - comuni);
    const stessi = [];
    if (r.categoria === categoriaId) { jaccard += 0.1; stessi.push("stessa categoria"); }
    if (r.zona && r.zona === zonaId) { jaccard += 0.1; stessi.push("stessa zona"); }
    if (jaccard >= 0.3) {
      risultati.push({ protocollo: r.protocollo, somiglianza: Math.min(0.99, jaccaro(jaccard)), motivo: stessi, stato: r.stato });
    }
  });
  return risultati.sort((a, b) => b.somiglianza - a.somiglianza).slice(0, 3);
}
function jaccaro(v) { return Math.round(v * 100) / 100; }

/* --- Analisi completa -------------------------------------------- */
function analizza(testo, archivio) {
  const cat = analizzaCategoria(testo);
  const sev = analizzaGravita(testo, cat.categoria);
  const zona = analizzaZona(testo);
  const routing = instrada(cat.categoria, sev.gravita);
  const duplicati = cercaDuplicati(testo, cat.categoria, zona.zona, archivio);
  return {
    versione: VERSIONE_REGOLE,
    timestamp: new Date().toISOString(),
    categoria: cat,
    gravita: sev,
    zona: zona,
    routing: routing,
    duplicati: duplicati,
  };
}
