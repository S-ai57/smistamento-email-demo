# Smistamento email (Customer Care) — demo locale Galene.AI

Demo di un assistente che prende in carico i messaggi che arrivano
alla casella unica di un'azienda di servizi (mail, PEC, telefonate verbalizzate,
WhatsApp, modulo del sito), li classifica, assegna una priorità e li **smista
nell'ufficio pertinente**.
Ambito: azienda generica B2B/B2C (**Novara Service S.r.l.**, inventata). È il primo di
una serie di mockup dimostrativi.

Il lettore dei messaggi è uno solo: un **modello vero**
(`Galene/DeepSeek-V4-Flash`, via il gateway Galene OpenAI-compatibile) dietro un
BFF locale (`server/`, un doppio clic per avviarlo). Se il modello non c'è
l'analisi **fallisce in modo visibile**, senza verdetti fingibili; il motore a
regole resta solo nei test automatici e negli stati congelati della QA. Il badge
in testata dice sempre chi sta leggendo.

Veste con il kit brand Galene.AI (skill `design-galene`): palette deep purple / soft violet /
magenta, font Apfel Grotezk, logo in testata, icone Lucide. Gli stati non usano verde/ambra/rosso
ma tinta del brand + **parola + icona**. Il progetto (problema, utente, prima fetta, release
successive e le due decisioni aperte) è in `BLUEPRINT.md`.

## Come si apre

Doppio clic su `index.html` o su **"Apri Smistamento Email.command"**, oppure:

```bash
open index.html
```

Nessuna installazione, nessuna dipendenza, nessuna build. Nomi, aziende,
indirizzi, numeri di pratica e messaggi sono inventati (Novara Service S.r.l.)
e restano nel browser (`localStorage`). **Per analizzare serve il modello**:
avvia prima il BFF con doppio clic su **"Avvia con modello vero.command"**
(sezione "Il modello vero dietro"); senza BFF la pagina si apre lo stesso e
**Analizza** risponde onestamente che il modello non c'è.

## Il flusso, in quattro passi

| Passo | Cosa fa l'operatore | Cosa vede |
|---|---|---|
| 1. Posta in arrivo | apre la **casella unica** e apre un messaggio (o ne fa arrivare uno nuovo) | cartelle, elenco con non letti e allegati, testo del messaggio così com'è arrivato; nessuno riscrive la richiesta a mano |
| 2. Lettura AI | preme **Analizza**, poi controlla e corregge | categoria, gravità (0-100 + SLA), area di servizio, avviso di pratica simile già aperta. Ogni decisione mostra le parole del messaggio che l'hanno prodotta |
| 3. Smistamento | conferma o dirotta | ufficio con responsabile, motivazione, scadenza di servizio, area sulla mappa |
| 4. Registro | filtra e apre una riga | messaggio originale, storico, correzioni applicate, versione delle regole usata |

### La casella di posta

Il primo passo non è un form: è la casella `info@novaraservice.it` (con la sua PEC),
divisa in **Posta in arrivo** e **Inoltrate agli uffici**. L'elenco mostra mittente,
oggetto, anteprima, orario relativo, messaggi non letti e file allegati; a destra il
messaggio aperto con la barra azioni **Analizza** / **Chiudi**.

- **Simula nuovo arrivo** (a sinistra, come il "scrivi" dei client di mail) fa capitare nella
  casella uno alla volta gli 8 messaggi pronti: utile per mostrare la presa in carico dal vivo
  invece che raccontare "immaginiamo che arrivi".
- Quando una pratica viene registrata, il messaggio **si sposta in "Inoltrate agli uffici"**
  con il suo numero di pratica: è il modo più corto per far vedere il prima e il dopo.

### La scena di smistamento

Premuto **Assegna e registra**, una breve animazione (~3 s) mostra il passaggio
concreto: la mail lascia la casella, percorre la linea e **atterra nell'ufficio
pertinente**, che si illumina con responsabile, motivazione e badge di esito
"Smistata in …". La pratica è già registrata quando la scena comincia: l'animazione
fa *vedere* lo smistamento, non aspetta nulla. Il link "mostra l'esito adesso" la
chiude subito. Stati congelabili per gli screenshot: `prova-stati.html#15`.

## La fase di "analisi in corso"

Cliccando **Analizza** appare una schermata di lavoro che scorre i cinque passi
compiuti dal lettore. In attesa del modello i numeri mostrati sono solo quelli
già veri (canale, caratteri letti, pratiche aperte da confrontare); le cifre
dell'analisi (termini, elementi di gravità, destinazione) arrivano con la
risposta. Se il messaggio ha allegati, il primo passo lo dice: le immagini non
vengono lette.

- l'attesa è **vera**: il contatore conta i secondi della risposta del modello
  (in genere 7-9 s; il gateway mette in cache i messaggi già letti, le ripetizioni
  escono in mezzo secondo) e i numeri mostrati in attesa sono solo quelli veri
  (canale, caratteri, pratiche aperte); categoria, gravità e destinazione
  arrivano quando il modello risponde
- **annulla l'attesa** riporta al messaggio senza inventarsi un verdetto
- se il modello non risponde (BFF spento, timeout, risposta fuori schema) la
  schermata mostra la card **"Lettura non riuscita"** col motivo, l'istruzione
  per avviare il BFF e **Riprova**: nessun verdetto fingibile

## Il modello vero dietro (serve per analizzare)

Con il BFF locale acceso, la lettura la fa un **modello vero**
(`Galene/DeepSeek-V4-Flash` via il gateway Galene, OpenAI-compatibile): decide
categoria, gravità, area e duplicati motivando con citazioni dal testo. L'ufficio
continua a assegnarlo la **tabella aziendale** (categoria → ufficio), calcolata
lato server sulle stesse tabelle di `js/data.js`: la tabella è policy dell'azienda,
non intelligenza, e il modello non la tocca.

Niente ripiegamenti: BFF spento, modello lento o risposta non valida → la
schermata di lettura mostra **"Lettura non riuscita"** col motivo e **Riprova**.
Il badge in testata, il piè di pagina e la scheda dicono sempre quale modello
ha prodotto il verdetto (`modello Galene/DeepSeek-V4-Flash`), e la pratica
registrata se lo porta negli atti. Il motore a regole di `js/engine.js` non
partecipa più alle analisi della demo: resta nei 58 controlli automatici e negli
stati congelati di `prova-stati.html`, dove serve il determinismo.

La chiave **non entra mai nella pagina**: il BFF la legge da `.env` (permessi 600,
mai nel codice, mai condividerlo) e ascolta solo `127.0.0.1:8787`. Le prove citate
dal modello passano un **controllo di verità** lato server: ogni frase deve essere
realmente presente nel messaggio, le prove inventate vengono scartate.

```bash
cp .env.example .env     # incollare dentro AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_PORT
node server/server.js    # oppure doppio clic su "Avvia con modello vero.command"
open index.html          # la pagina si accorge del BFF da sola, al caricamento
```

**Privacy**: i testi dei messaggi partono verso il gateway. Per la demo va bene —
tutti i testi sono inventati — ma non farci passare mail di clienti veri senza una
convinzione sulla loro trattazione. Il `.env` resta sul tuo computer.

## I messaggi della demo

5 sono già nella casella all'apertura (uno di questi è già inoltrato, quindi sta in
"Inoltrate agli uffici"), 8 si fanno arrivare. Coprono tutte e sei le categorie, quattro
bande di gravità, tutti e cinque i canali e quattro situazioni messe lì per mettere alla prova
l'operatore:

- **duplicato** — due colleghi della stessa cliente segnalano l'ascensore bloccato alla
  filiale di Milano (una pratica simile era già aperta: l'avviso compare da solo);
- **dissociazione canale/mittente** — una PEC di un'impresa edile che in realtà contesta
  una fattura, non parla di lavori;
- **negazione** — "Non è pericoloso adesso, ma col freddo..." non deve alzare la gravità;
- **non classificabile** — la richiesta generica di una cliente: nessuna categoria,
  pratica lasciata al Customer Care con la scelta manuale da fare.

## Cosa c'è dentro

```
index.html                  struttura della pagina
css/style.css               veste Galene.AI (token del kit, stati a tinta + parola + icona, scena di smistamento)
assets/fonts/               Apfel Grotezk Mittel 500 e Fett 700 (dal kit design-galene)
assets/logos/               logo Galene.AI orizzontale (gradiente per fondi chiari)
js/data.js                  categorie, uffici, aree servite, toponimi, lessico di gravità, messaggi della casella, archivio iniziale
js/engine.js                le regole: categoria, gravità, area, smistamento, pratiche simili
js/store.js                 persistenza su localStorage con ripiegamento in memoria (chiave `novaraservice.smistamento.v1`)
js/ai.js                    ponte verso il BFF locale: sondaggio, chiamata, etichetta del motore
js/app.js                   casella di posta, wizard, scena di smistamento animata, registro, scheda di dettaglio, icone Lucide
server/server.js            BFF locale: /api/salute e /api/analizza, ascolta solo su 127.0.0.1, legge ../.env
server/motore-ai.js         prompt, chiamata al gateway, validazione e "controllo di verità" sulle prove citate
server/prova-bff.js         prova d'insieme del BFF in esecuzione (3 messaggi, richiede .env)
.env                        chiave del gateway (solo locale, permessi 600, mai condivisa); .env.example è il modello
prova-motore.js             controlli automatici sulle decisioni (node prova-motore.js)
prova-stati.html            pilota i 15 stati della demo in browser reale (per screenshot QA)
prova-bff-ui.html           click-through reale col modello in Chrome: apre MSG-01, Analizza, attende il verdetto
Apri Smistamento Email.command        lanciatore con doppio clic (regole, zero rete)
Avvia con modello vero.command        lanciatore con doppio clic: avvia il BFF, apre la pagina, chiudendo la finestra lo spegne
BLUEPRINT.md                il da-approvare: problema, utente, prima fetta, release successive, decisioni aperte
```

## Controlli automatici

```bash
node prova-motore.js        # 58 verifiche, esce con codice 1 se un verdetto cambia
node server/prova-bff.js    # 3 messaggi reali al modello: schema e verdetti attesi (BFF in esecuzione)
```

Copre i 13 messaggi (categoria, gravità, area, ufficio), tre casi di pratica simile,
il caso non classificabile e il determinismo. Da rilanciare ogni volta che si tocca il
lessico in `js/data.js`.

La UI si pilota senza clic con `prova-stati.html#1` … `#15` (casella, messaggio aperto,
fase d'analisi congelata a metà, i tre passi, scena di smistamento congelata in volo,
registro, scheda, cartella "Inoltrate"): è il modo con cui è stata controllata in Chrome
reale stato per stato, screenshot e console pulita. Gli stati congelati usano il motore a
regole (determinismo senza rete): nella demo legge solo il modello. Il click-through reale
col modello — e l'esito onesto col BFF spento — si controllano con `prova-bff-ui.html`.

## Dove è finta, e va detto in demo

- **È** un'interfaccia reale e navigabile, e la lettura è fatta da un modello vero
  (negazioni, tono, duplicati capiti dal testo). Il modello può rispondere lento o
  male: la demo lo dichiara con l'esito onesto, non con verdetti di scorta.
- **Non è** un agente. Il verdetto si ferma alla scheda: nessuno risponde al cliente,
  nessuno apre ticket in altri sistemi, nessuna azione a valle dello smistamento.
- La presa in carico dei messaggi è **simulata** (casella precompilata + "Simula nuovo
  arrivo"): non c'è nessuna casella vera dietro.
- La scena di smistamento è una **resa visiva** della registrazione già compiuta: in un
  rilascio vero gli stessi stati arrivano dalla chiamata al BFF, non da un timer.
- Il BFF locale è la versione in miniatura di quello che servirà: in un rilascio vero
  va dentro il tenant, chiamato con l'identità del tenant, e il modello diventa una
  capacità di piattaforma al posto della chiave personale nel `.env`.

## Se vuoi rimettere a zero

Il link *ripristina demo* in fondo alla pagina. I dati di partenza sono
`ARRIVI_INIZIALI`, `ARRIVI_SIMULATI` e `ARCHIVIO_INIZIALE` in `js/data.js`.
