# AGENTS.md - Regole Operative Codex

## 0. Lettura iniziale obbligatoria
- All'inizio di OGNI sessione, prima di qualsiasi azione, l'agente (Claude Code, Codex o subagent) DEVE leggere:
  - `AGENTS.md` (questo file): regole operative complete.
  - `CLAUDE.md` (root): awareness toolbox/MCP e skill configurate.
  - le 3 config in `.claude/agents/` — `esploratore-firestore`, `guardiano-patch`, `revisore-audit` — per sapere quali subagent esistono e quando invocarli.
- Dal 2026-06-20 la riga precedente va intesa come elenco storico minimo: vanno lette tutte le config presenti in `.claude/agents/`, incluse quelle aggiunte dopo le prime 3.
- L'agente DEVE inoltre leggere i file di stato previsti dalla sez. 3 (`STATO_ATTUALE_PROGETTO.md` sempre; gli altri condizionali al tipo di task): per l'elenco completo e le condizioni vedi sez. 3.
- Questa lettura e un prerequisito non negoziabile: serve a evitare che l'utente debba rispiegare a ogni sessione l'infrastruttura di agenti e regole.

## 1. Fonte primaria
- `AGENTS.md` e la guida operativa primaria di Codex in questo repository.
- I documenti di progetto restano fonte di verita per stato, dati, sicurezza e decisioni.
- Se `AGENTS.md` e un report si contraddicono, conta il codice reale del repo e poi la documentazione ufficiale di stato, non il report esecutivo.

## 2. Confini non negoziabili
- Madre intoccabile.
- `src/next/*` e il perimetro della nuova applicazione ed e l'unico spazio sicuro di evoluzione applicativa.
- La NEXT non e piu da considerare globalmente `read-only`.
- Le scritture business reali nella NEXT si aprono solo modulo per modulo, con richiesta esplicita e coerente, dataset/operazioni dichiarati e documentazione allineata.
- `src/utils/cloneWriteBarrier.ts` resta il punto di controllo esplicito per abilitare o negare le scritture della NEXT.
- IA interna isolata sotto `/next/ia/interna*`.
- Nessun riuso runtime dei moduli IA legacy nel nuovo sottosistema IA interna.
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Matching, incroci e claim di parity devono essere strutturali e spiegabili.

## 3. Letture obbligatorie prima di agire
Tutti i path sotto puntano alla cartella canonica `docs/copia questi nel progetto in chat/` (vedi sez. 17).
- Sempre: `docs/copia questi nel progetto in chat/STATO_ATTUALE_PROGETTO.md`.
- Se il task tocca la NEXT: leggere e poi aggiornare `docs/copia questi nel progetto in chat/STATO_MIGRAZIONE_NEXT.md`.
- Se il task tocca il clone: aggiornare `docs/copia questi nel progetto in chat/REGISTRO_MODIFICHE_CLONE.md`.
- Se il task riguarda IA interna: leggere e aggiornare `docs/copia questi nel progetto in chat/CHECKLIST_IA_INTERNA.md`; leggere anche `docs/copia questi nel progetto in chat/STATO_AVANZAMENTO_IA_INTERNA.md` e `docs/copia questi nel progetto in chat/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`.
- Se il task tocca dati o domini: leggere `docs/copia questi nel progetto in chat/DOMINI_DATI_CANONICI.md`, `docs/copia questi nel progetto in chat/MAPPA_COMPLETA_DATI.md`, `docs/copia questi nel progetto in chat/REGOLE_STRUTTURA_DATI.md`.
- Se il task e architetturale, rischioso o tocca sicurezza: applicare `docs/copia questi nel progetto in chat/PROTOCOLLO_SICUREZZA_MODIFICHE.md` e leggere gli audit rilevanti (vedi `MANIFEST.md` della cartella).

## 4. Regola anti auto-certificazione
- Un report esecutivo non basta per dichiarare chiuso un modulo.
- Change report e continuity report sono tracciabilita, non prova.
- La prova valida e solo una combinazione di fatti verificati nel repo, tra cui:
  - route e file reali verificati;
  - assenza di mount legacy dove il target richiede autonomia NEXT;
  - parity esterna dimostrata;
  - layer NEXT usati davvero;
  - audit separato quando il task e grande, multi-modulo o sensibile.
- Se la prova non c'e, il modulo non e chiuso.

## 5. Separazione execution / audit
- Execution e audit vanno separati quando il rischio e alto o il perimetro e grande.
- L'execution puo patchare; l'audit non deve patchare runtime.
- L'execution non puo auto-promuoversi a verita finale.
- L'audit deve verificare codice, route, mount, parity esterna, layer e blocchi reali.

## 5.1 Agenti automatici di controllo
- L'utente non deve chiedere ogni volta l'invocazione degli agenti: Codex/Claude deve attivarli automaticamente quando il task rientra nei trigger sotto.
- Gli agenti di audit/controllo sono read-only, salvo diversa istruzione esplicita del prompt. L'execution resta responsabile della patch e dell'integrazione.
- `analista-impatto-flussi`: prima di creare un modulo nuovo o modificare runtime, route, domain, writer, barrier, dati, IA, PDF, sicurezza o flussi cross-modulo.
- `verificatore-regressioni-postpatch`: dopo una patch runtime o logica per rileggere il diff e cercare regressioni laterali, consumer rotti, test mancanti o cambi fuori perimetro.
- `custode-contratti-dati`: quando il task tocca dataset, domain reader, writer, relazioni, campi Firestore/Storage, viste certificate o claim di assenza dati.
- `custode-documentazione-viva`: dopo patch che cambiano stato, route, convenzioni, chiavi dati, architettura, agenti o task completati/aperti, per indicare quali documenti vivi aggiornare senza creare report non richiesti.
- Restano attivi gli agenti gia presenti:
  - `esploratore-firestore` per Zero-Invenzioni e assenze dati da verificare;
  - `guardiano-patch` per regole dure del diff;
  - `revisore-audit` per audit separati, chiusura modulo e checklist a 7 punti.
- Se un task ha rischio `ELEVATO` o `EXTRA ELEVATO`, usare almeno `analista-impatto-flussi` prima della patch e `verificatore-regressioni-postpatch` o `guardiano-patch` dopo la patch, salvo task puramente documentale.
- Se un task coinvolge dati business, usare `custode-contratti-dati` o `esploratore-firestore` prima di dichiarare assenze, relazioni non certificate o mapping dati.

## 5.2 Correzione progressiva agenti
- Se un agente produce audit incompleto, sbagliato o troppo generico, l'errore va trattato come difetto delle istruzioni, non come fatto da ignorare.
- Dopo aver verificato l'errore sul codice o sui dati reali, aggiornare in modo mirato:
  - il file agente in `.claude/agents/<nome>.md`;
  - `AGENTS.md`, solo se serve una regola permanente comune;
  - `CONTEXT_CLAUDE.md`, se cambia una convenzione operativa rilevante.
- La correzione deve aggiungere una regola verificabile, un trigger o un formato di output, non una frase generica.
- Non correggere un agente sulla base di impressioni: servono evidenza `file:riga`, comando, diff o risultato Firestore read-only.
- Gli errori storici importanti vanno trasformati in regole operative concise, come gia fatto per `AUDIT-CERCA-PER-TARGA` e `TIMESTAMP-MAI-DA-CLICK`.

## 6. Regola meccanica di chiusura modulo
- Un modulo clone/NEXT e `CHIUSO` solo se tutte le condizioni seguenti sono vere:
  1. la route ufficiale NEXT non monta `NextMotherPage` come runtime finale;
  2. non monta `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale quando il target e autonomia NEXT;
  3. la UI esterna e equivalente alla madre;
  4. i flussi principali sono equivalenti;
  5. i modali principali sono equivalenti;
  6. i report o PDF principali sono equivalenti, se fanno parte del modulo;
  7. sotto usa layer NEXT puliti o chiaramente ripuliti.
- Se una voce critica e `NO`, il modulo non e chiuso.
- Stati ammessi: `CHIUSO`, `APERTO`, `PARZIALE`, `DA VERIFICARE`.

## 7. Regola backlog persistente
- Nei task grandi, backlog o multi-modulo, usare e aggiornare un file backlog persistente nel repo.
- Se il prompt indica gia un backlog file, usare quello.
- Se il prompt non lo indica, usare un file sotto `docs/audit/` con nome esplicito `BACKLOG`.
- Il backlog deve contenere solo:
  - moduli target;
  - stato iniziale;
  - stato finale;
  - blocchi reali;
  - path precisi.

## 8. Divieto di linguaggio plausibile
- Vietato usare formule vuote o auto-promozionali come:
  - `quasi chiuso`
  - `molto avanti`
  - `parity piu stretta`
  - `sostanzialmente chiuso`
  - `fortemente migliorato`
  - `non necessario` usato come scorciatoia
  - `non dimostrato` usato come formula vuota
- Se non e chiuso, va dichiarato aperto.
- Se e solo in parte verificato, va dichiarato `PARZIALE` o `DA VERIFICARE`.

## 9. Regola sui blocchi reali
- Se il task non e chiudibile nel perimetro consentito, fermarsi subito.
- Risposta minima obbligatoria:
  - `SERVE FILE EXTRA: <path>`
- Aggiungere al massimo una riga con motivo tecnico preciso e dimostrabile se il prompt lo consente.
- Non aggirare il blocco con patch laterali.

## 10. Protocollo operativo
- `MODE = OPERAIO` e il default.
- Ogni prompt operativo deve dichiarare numero, agente/modello e livello di ragionamento.
- Prima di patchare: classificare richiesta, perimetro e rischio.
- Modificare solo i file ammessi dal prompt.
- Se il task e documentale, non toccare codice runtime.
- Se il task modifica file del repo, change report e continuity report sono obbligatori.
- Eseguire build o lint solo se il task tocca runtime, logica, contratti o se il prompt lo richiede.
- Gate build canonico per cantieri e deploy: usare `npm run build` completo (`tsc -b && vite build`), non i comandi separati come prova finale.
- Se un fatto non e dimostrabile, scrivere `DA VERIFICARE`.

## 11. Rischio e sicurezza
- `BASSO`: typo, import, rename minori, micro-fix.
- `NORMALE`: UI/CSS, composizione, documentazione non critica.
- `ELEVATO`: logica dominio, dati, flussi cross-modulo, IA interna, shared boundary.
- `EXTRA ELEVATO`: architettura, Firebase/Storage, contratti cross-modulo, migrazioni, boundary read-only.
- Con rischio `ELEVATO` o `EXTRA ELEVATO` non si patcha alla cieca: prima analisi impatto, poi patch.

## 12. Divieti permanenti
- Vietato inventare regole, flussi o strutture dati non dimostrate dal repo.
- Vietato chiudere un modulo solo perche il report esecutivo lo dichiara.
- Vietato fare search-and-replace massivi o modifiche globali distruttive.
- Vietato introdurre cambi non richiesti in routing, contratti dati, IA, PDF o sicurezza.

## Regola operativa "Esplorazione prima di asserzione" (Zero-Invenzioni)

Quando un agente (Codex, Claude Code o altro) sta per produrre una asserzione del tipo:
- "il dato non esiste"
- "non disponibile"
- "non posso produrre relationProof"
- "campo non presente"
- "relazione non certificata"
- o equivalenti

PRIMA di emettere l'asserzione, l'agente DEVE eseguire una verifica esplorativa Firestore in sola lettura, entro il boundary readonly autorizzato (`internal-ai-firebase-readonly-boundary.js`), e riportare nel proprio output:

1. Cosa cercavo, in quali collection/documenti, con quali query.
2. Cosa ho trovato di rilevante (path, nomi campi, conteggio record, mai valori sensibili oltre quelli gia' pubblici nel contesto utente).
3. Cosa NON ho trovato.
4. Eventuali documenti o collection adiacenti non incluse nel boundary readonly attuale che sembrano contenere il dato cercato (segnalazione, NON azione: NON estendere mai il boundary da solo, NON istanziare Firestore Admin raw fuori boundary).
5. Conclusione operativa: "asserzione confermata" oppure "asserzione da rivedere — possibile fonte alternativa: <X>".

L'estensione di `internal-ai-firebase-readonly-boundary.js` o l'aggiunta di nuove regole al Relation Resolver e' decisione del project owner (Giuseppe), non dell'agente.

L'agente non puo' dichiarare "non disponibile" come verdetto finale senza aver prima eseguito questa esplorazione e averne riportato l'esito in chat.

Se l'accesso Firestore readonly NON e' disponibile (es. `credential.mode != ready`), oppure il boundary attuale non permette di verificare la fonte ipotizzata, l'agente NON deve dichiarare "non disponibile". Deve dichiarare:
"verifica non eseguita, non posso confermare l'assenza del dato — boundary o credenziali insufficienti per esplorazione".

Ambito di applicazione della regola:
- dati business del gestionale (autisti, mezzi, cantieri, rifornimenti, manutenzioni, fatture, documenti)
- relazioni tra entita' (autista-mezzo, mezzo-cantiere, mezzo-documento, ecc.)
- viste certificate (Driver360, Vehicle360, Site360, Euromecc360, Ricerca360)
- casi in cui esiste accesso Firestore readonly disponibile

Eccezioni: se Firestore readonly non e' disponibile o il dato cade fuori boundary, vedi paragrafo precedente — niente asserzione di assenza, solo dichiarazione "verifica non eseguita".

## 13. Formato minimo dei task
- `Obiettivo`
- `Perimetro` o `Whitelist`
- `Output richiesto`

## 14. Chiusura in chat
- Sintesi secca.
- File toccati.
- Rischio e impatto.
- Rischi residui.
- Change report e continuity report creati.
- Commit hash solo se esiste.
## 15. Aggiornamento CONTEXT_CLAUDE.md
- `CONTEXT_CLAUDE.md` nella root è il file di contesto sintetico 
  per l'AI assistant esterno (Claude).
- Dopo ogni patch che modifica uno o più dei seguenti elementi, 
  aggiornare `CONTEXT_CLAUDE.md`:
  - stato di un modulo (APERTO -> PARZIALE -> CHIUSO)
  - nuove route aggiunte o rimosse
  - nuove convenzioni o chiavi Firestore
  - cambi architetturali rilevanti
  - nuovi task completati o aperti
- L'aggiornamento deve essere sintetico e verificato — 
  non copiare log, solo stato attuale.
- Il file non deve superare 400 righe totali.
- Se l'aggiornamento richiederebbe più di 400 righe, 
  sintetizzare eliminando storia superata.

## 17. Documentazione canonica per chat — SUPERATA

Regola SUPERATA dalla "REGOLA FILE DI DOCUMENTAZIONE" piu' in basso. Il percorso canonico unico della documentazione attiva e `docs/_live/` (piu' i file di root elencati in quella regola). La cartella `docs/copia questi nel progetto in chat/` NON e piu' dichiarata percorso canonico della documentazione. Vedi "REGOLA FILE DI DOCUMENTAZIONE".

## 16. Cartella `docs/fonti-pronte/` — DEPRECATA

`docs/fonti-pronte/` e DEPRECATA dalla "REGOLA FILE DI DOCUMENTAZIONE" piu' in basso: non e piu' una raccolta canonica e non va creata, aggiornata o specchiata. La documentazione attiva vive solo in `docs/_live/` (piu' i file di root). Vedi "REGOLA FILE DI DOCUMENTAZIONE".

## REGOLA FILE DI DOCUMENTAZIONE

I file di documentazione attivi del progetto vivono ESCLUSIVAMENTE in `docs/_live/`. Ogni chat con Claude/Codex legge da li. Il resto del repo documentale e storico o archiviato e non va consultato ne aggiornato.

### File che vivono in root
- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT_CLAUDE.md`
- `README.md`

### File che Codex DEVE aggiornare quando pertinenti a una patch
- `docs/_live/STATO_MIGRAZIONE_NEXT.md` (se la patch cambia stato di un modulo NEXT)
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md` (voce BREVE 5-10 righe, non voce lunga)
- `CONTEXT_CLAUDE.md` (bullet in cima a `Ultimo task completato`)
- la SPEC del modulo toccato (se esiste in `docs/_live/spec/`)

### Cosa Codex NON DEVE fare
- NON creare nuovi change-report o continuity-report. Le directory `docs/change-reports/` e `docs/continuity-reports/` sono deprecate. Lo storico e compresso in `docs/_live/STORICO_PATCH_COMPRESSO.md`.
- NON creare nuovi audit se non richiesti esplicitamente. Lo storico e in `docs/_live/STORICO_AUDIT_COMPRESSO.md`.
- NON creare nuove SPEC se non si tratta di un nuovo modulo.
- NON creare mirror o copie di file. La cartella `docs/fonti-pronte/` e deprecata.
- NON scrivere file MD fuori da `docs/_live/`, tranne nei 4 file root.

### Formato voci `REGISTRO_MODIFICHE_CLONE.md`
Voce `YYYY-MM-DD HHMM`

DATA: `YYYY-MM-DD`
TITOLO: `<titolo secco>`
FILE TOCCATI: `<lista breve>`
COSA: `<2-3 righe asciutte>`
ESITO: `FATTO | FATTO_CON_VERIFICA_MANCANTE | ROLLBACK`
NOTE: `<opzionale>`

### Eccezioni
Se l'utente chiede esplicitamente un audit, un change-report, un continuity-report o una nuova SPEC, Codex lo crea in `docs/_live/`. Altrimenti, non-proliferazione assoluta.

## Regole audit

### AUDIT-CERCA-PER-TARGA

Negli audit di record correlati a un mezzo, **cercare sempre per targa, mai solo per legame**.

Esempio: per auditare il ciclo segnalazione/manutenzione del mezzo TI298409, filtrare ogni
collection rilevante (`@manutenzioni`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`,
`@gomme_eventi`) per **tutti i campi targa possibili** (`targa`, `targaCamion`, `targaMotrice`,
`targaRimorchio`) e riportare TUTTI i record trovati, anche quelli senza legami bidirezionali.

I record orfani — con `linkedLavoroId`/`chiusuraRefId`/`origineRefId` che puntano a target
inesistenti — esistono nella realta' (cancellazioni manuali, record fantasma PROMPT 41/42)
e vanno **identificati esplicitamente** verificando l'esistenza di ogni target referenziato.

**Lezione storica**: PROMPT 45 T5 ha sbagliato l'audit di TI298409 perche' ha seguito solo
i legami uscenti da `@manutenzioni` (back-link `origineRefId`) e ha ignorato segnalazioni/
controlli per la stessa targa che avevano `linkedLavoroId` orfani. PROMPT 46 ha corretto.
Riferimento: `docs/_live/AUDIT_TI298409_RICCARDO_FENDERICO_2026-05-15.md`.

## Regole scrittura

### TIMESTAMP-MAI-DA-CLICK

I campi temporali persistiti (`chiusuraData`, `dataPresaInCarico`, `dataEsecuzione`,
`dataChiusura`, ecc.) **non devono mai essere scritti con `Date.now()` come effetto
collaterale di operazioni non temporali** (aggancio retroattivo, riassegnazione,
modifica metadata, cambio legame, sgancio, completamento automatico, ecc.).

Regole operative:

1. **Solo le azioni utente esplicitamente temporali** possono scrivere timestamp
   con `Date.now()` come "ora del click". Esempi validi:
   - Bottone "Prendi in carico" → `dataPresaInCarico = toISO(new Date())`
   - Bottone "Completa intervento" → `dataEsecuzione = toISO(new Date())`
   - Modale di chiusura manuale con campo data utente

2. **Per chiusure derivate** (es. propagazione automatica della chiusura di una
   manutenzione alla segnalazione collegata), il timestamp **deve ereditare** dal
   record di origine — es. `chiusuraData = data della manutenzione collegata`,
   mai `Date.now()`.

3. **Effetti collaterali con timestamp sono vietati**. Un'operazione di "aggancio",
   "merge", "cambio legame", "sgancio" NON deve toccare i campi `dataPresaInCarico`,
   `chiusuraData`, ecc. — neanche per "comodita' di display". La frase storia che
   ne risulta deve essere coerente con lo stato semantico, non con il momento del
   click.

4. **Per chiusura propagata**: scrivere `chiusuraData = parseISO(target.data)`
   (la data della manutenzione target). Se nemmeno `target.data` e' valorizzato,
   accettare `Date.now()` come ultimo fallback documentato (caso degenere).

**Lezione storica**: PROMPT 44 D7 scriveva `dataPresaInCarico = toISO(new Date())` in
`patchSegnalazione` come effetto della creazione della manutenzione daFare da segnalazione.
PROMPT 47 (`agganciaSegnalazioneAManutenzioneEsistente`) scriveva `dataPresaInCarico =
toISO(new Date())` come effetto dell'aggancio, e `chiusuraData = Date.now()` (via fallback
`buildChiusuraPatch`) quando il target era `eseguita` ma senza `chiusuraData` esplicita.
Risultato visibile: su TI298409, dopo aggancio del 15/05 17:45 alla manutenzione gomme
del 12/05, la frase mostrava "presa in carico il 15/05" e la segnalazione veniva chiusa
con timestamp 15/05 17:45 invece di 12/05. PROMPT 50 ha corretto:
- writer P47 + closureOrchestrator ereditano `chiusuraData` da `target.data`
- `patchSegnalazione` non scrive piu' `dataPresaInCarico`
- nuovo writer `segnaPresaInCaricoSegnalazione` e' la sola via per scrivere quel campo
Riferimento: `docs/_live/REPORT_PROMPT50_TIMESTAMP_FIX_2026-05-15.md`.

## Lingua
Comunica SEMPRE in italiano, in OGNI parte della risposta: spiegazioni,
domande, richieste di chiarimento, conferme e messaggi di stato. Mai inglese,
nemmeno per le domande che fai a me. Se stai per scrivermi una domanda in
inglese, riscrivila in italiano prima di inviarla.
