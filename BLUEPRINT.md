# Smistamento email — blueprint del prototipo (per approvazione)

Prototipo locale, **non deployato**: serve a far vedere il prodotto prima di costruirlo.
Legge i messaggi con un unico motore: un **modello vero dietro un BFF locale**. Senza
modello l'analisi fallisce in modo visibile, senza verdetti fingibili; le regole
deterministiche restano solo nei test automatici e negli stati congelati della QA.
Nessun dato reale: azienda, persone, indirizzi e messaggi sono inventati
(**Novara Service S.r.l.**, azienda di servizi B2B/B2C generica).

## Il problema

Le richieste dei clienti entrano da cinque canali — mail, PEC, telefono, WhatsApp,
modulo del sito — e finiscono tutte nella stessa casella. L'operatore del Customer Care le
**rilegge una per una**, le ricopia nel gestionale e gira la mail all'ufficio giusto.
Un ascensore bloccato con una persona dentro aspetta in coda quanto una richiesta di
chiarimenti su una pratica vecchia: **la coda è ordinata per arrivo, non per urgenza**.
E lo stesso guasto, segnalato da due colleghi della stessa cliente, diventa due pratiche.

## L'utente

L'operatore del Customer Care, che smista 40–60 messaggi al giorno tra telefono e casella.
Non è un analista e non vuole una dashboard: vuole aprire il messaggio, premere un pulsante
e trovare già scritti categoria, priorità, area di servizio e ufficio — **con le parole del
cliente che lo giustificano**, così un errore lo vede in tre secondi. E vuole non perdere
niente: quello che l'app sa leggere deve chiederlo, non inventarlo. Infine vuole **vedere**
il risultato: la mail che lascia la casella e atterra nell'ufficio pertinente.

## Flusso attuale (senza app)

Casella mail → lettura a mano → copia-incolla nel gestionale → telefonata all'ufficio o
mail di girata → foglio Excel con le "in attesa". Il criterio con cui una richiesta è stata
messa su una scrivania invece di un'altra non resta da nessuna parte, e i duplicati si
scoprono a lavoro fatto.

## Risultato di accettazione osservabile

Per ogni messaggio nella casella, premere **Analizza** produce in pochi secondi quattro
decisioni — categoria, fascia di gravità con SLA, area di servizio, ufficio — **ognuna con
le parole incontrate nel testo** (e la frase dove stavano). Se il motore non trova nulla, lo
dice e chiede all'operatore di scegliere: **non tira a indovinare**. La correzione
dell'operatore comanda l'assegnazione e resta agli atti nello storico. Prima di creare una
pratica, l'app segnala le pratiche aperte simili con la percentuale di sovrapposizione.
All'assegnazione, una breve scena mostra il messaggio **smistato nell'ufficio pertinente**,
con responsabile e motivazione. L'operatore non digita mai una richiesta: i messaggi
**arrivano** in casella dai canali aziendali.

## Prima fetta (quello che il prototipo mostra come sarà l'app vera)

- cassetto di posta vero (cartelle, non letti, allegati, mittenti), con arrivi simulati che
  entrano come nella realtà: mail, PEC, telefono, WhatsApp, modulo del sito;
- motore **unico: il modello vero** (`Galene/DeepSeek-V4-Flash` via gateway
  OpenAI-compatibile) dietro un **BFF locale** (`server/`, zero dipendenze, ascolta solo
  su 127.0.0.1, chiave in `.env` che il browser non vede mai): decide categoria, gravità,
  area e duplicati citando frasi del testo, e **ogni citazione è verificata come
  sottostringa reale del messaggio** prima di arrivare in pagina — prove inventate
  scartate, risposta fuori schema = analisi perduta;
  - se il modello non c'è o non risponde la demo **non finge nulla**: card "Lettura non
    riuscita" col motivo e Riprova; il badge in testata e il piè di pagina dichiarano
    sempre chi sta leggendo, e la pratica registrata si porta il modello negli atti;
  - l'ufficio lo assegna la **tabella aziendale** (categoria → ufficio, destinazioni
    alternative, Direzione sui casi critici), calcolata lato server sulle stesse tabelle;
- il vecchio **motore deterministico** (lessico per categoria con priorità, punteggio di
  gravità, toponimi, fasce SLA 24 ore / 3 / 10 / 30 giorni, tabella categoria → ufficio)
  resta identico ma **fuori dal percorso della demo**: è la base dei 58 controlli
  automatici e degli stati congelati della QA, dove serve il determinismo;
- fase "analisi in corso" con i numeri veri dell'analisi (caratteri, pratiche confrontate,
  termini incontrati), non una barra decorativa;
- **scena di smistamento animata** alla registrazione: la mail parte dalla casella e atterra
  nell'ufficio pertinente (responsabile, motivazione, esito "Smistata in …");
- registro pratiche con filtri, scheda, storico delle mosse e passaggi di stato;
- il messaggio inoltrato si sposta in "Inoltrate agli uffici" con il suo numero di pratica.

## Release successive (fuori dal prototipo, NON sono schermate)

connettori reali IMAP/PEC e API del sito aziendale, scrittura sul gestionale invece del
numero simulato, il BFF locale diventa il **BFF dell'app nel tenant** (autenticazione
delegata del tenant, modello come capacità di piattaforma con credenziali del tenant — non
la chiave personale del `.env`), estrazione di nominativi/indirizzi sul solo testo del
messaggio, antiduplicato semantico, notifiche agli uffici allo scadere dello SLA, misura
dell'accordo operatore/macchina per tarare lessico e prompt, multi-tenant.

## Branding

Kit Galene.AI ufficiale (skill `design-galene`): palette deep purple / soft violet / magenta
con le tinte del manuale, Apfel Grotezk (Mittel 500, Fett 700) da `assets/fonts/`, logo
orizzontale a gradiente in testata, icone Lucide del kit in linea. Gli stati **non** sono
verde/ambra/rosso: tinta del brand + parola + icona.

## Due decisioni di progetto — APERTE, le decide Sara prima di qualsiasi rilascio

1. **Tenant/ambiente target** (es. tenant di test quale, o produzione).
2. **Registry immagini** (registry OCI esterna gestita dal proprietario, o registry integrato Galene).

Nessuna delle due si deduce dall'esistenza di questo prototipo locale.

## Come è verificato

- motore: `js/engine.js`, puro, senza DOM; `js/data.js` contiene solo dati e lessico;
- test fuori dal browser: `node prova-motore.js` — **58 asserzioni** (categoria, fascia di
  gravità, area e ufficio su tutti i messaggi della demo, tre casi di pratica simile,
  messaggio vago → nessuna categoria e resta al Customer Care, determinismo: stesso
  messaggio → stessa analisi);
- QA in browser reale: `prova-stati.html#1…15` pilota i 15 stati della demo (casella,
  lettura, fase intermedia congelata, smistamento, scena animata congelata in volo,
  registro, scheda, cartella "Inoltrate") e passa senza errori di script; gli stati
  congelati usano il motore a regole, che garantisce il determinismo senza toccare la rete;
- BFF e modello: `node server/prova-bff.js` chiede 3 messaggi tipici al modello vero
  (verdetto atteso: critica sul caso ascensore, negazione che non alza la gravità);
  `prova-bff-ui.html` fa il click-through completo in Chrome — con BFF acceso
  `motore=ai` con duplicato al 95%, con BFF spento **esito onesto** ("Lettura non
  riuscita", badge "modello non raggiungibile") e mai un verdetto fingibile;
- i sorgenti restano divisi (`css/`, `js/`) perché il test node carica `data.js` e `engine.js`
  così come sono: nessuna build, si apre `index.html` con un doppio clic.
