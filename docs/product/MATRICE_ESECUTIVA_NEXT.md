# MATRICE ESECUTIVA NEXT

## Avvertenza critica audit generale 2026-03-30
- L'audit generale totale `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md` e il verdetto piu duro e aggiornato sullo stato reale della NEXT.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
  - la maggioranza del perimetro target non puo essere considerata `CHIUSO`
  - l'assenza di mount runtime madre sulle route ufficiali NON equivale a parity reale con la madre
- Moduli promossi a `CHIUSO` da questo audit:
  - `Gestione Operativa`
  - `IA Home`
  - `IA API Key`
- Moduli critici confermati `APERTO`:
  - `Home`
  - `Mezzi`
  - `Dossier Mezzo`
  - `Inventario`
  - `Materiali consegnati`
  - `Materiali da ordinare`
  - `Acquisti / Ordini / Preventivi / Listino`
  - `Lavori`
  - `Capo Costi`
  - `IA Libretto`
  - `IA Documenti`
  - `IA Copertura Libretti`
  - `Cisterna`
  - `Cisterna IA`
  - `Cisterna Schede Test`
  - `Colleghi`
  - `Fornitori`
  - `Autisti`
  - `Autisti Inbox / Admin`
  - `Manutenzioni`

## Avvertenza critica 2026-03-30
- L'audit finale `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md` resta la fonte che ha aperto il backlog reale sul perimetro target.
- Il prompt 42 ha usato quell'audit come contratto di execution e ha chiuso i gap confermati nel perimetro whitelistato, tracciandoli in `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`.
- Questo non vale come audit finale: il verdetto `NEXT autonoma sul perimetro target` resta sospeso finche un audit separato non conferma il codice reale.

Versione: 2026-03-29
Stato: CURRENT
Scopo: fissare la nuova base esecutiva della NEXT dopo la sospensione della strategia precedente.

## Nota di continuita
- La strategia NEXT precedente basata su shell autonoma, import dominio-centrica progressiva e divieto di clone UX legacy e sospesa.
- Le snapshot della strategia precedente restano archiviate in `docs/_archive/2026-03-10-next-strategia-pre-clone/`.
- Da questo momento la priorita operativa della NEXT e costruire in `src/next/*` un clone fedele `read-only` della madre, senza toccare la madre.

## Regole operative globali
- Madre intoccabile: resta il gestionale operativo principale.
- NEXT = clone fedele della madre come UX, ordine dei blocchi, navigazione pratica, linguaggio operativo e flussi visibili.
- Clone solo `read-only`: nessuna creazione, modifica, delete, upload, import o side effect sui dati reali.
- Il clone deve leggere gli stessi dati reali della madre, senza inventare dataset o placeholder quando il dato esiste gia.
- In caso di dubbio tra fedelta UX e rischio scrittura, prevale sempre il blocco della scrittura.
- Niente redesign, niente reinterpretazione creativa, niente nuova shell concettuale.
- Layer puliti, IA e tracking restano obiettivi successivi: si innestano sopra il clone, non lo sostituiscono.

## Fasi ufficiali
1. Archiviare la NEXT attuale e le snapshot documentali della strategia superata, mantenendo tracciabilita.
2. Ricreare `src/next/*` come clone `read-only` fedele delle schermate madre prioritarie.
3. Neutralizzare tutte le scritture nel clone, con prevalenza del blocco su qualunque dubbio operativo.
4. Verificare che il clone legga gli stessi dati reali letti dalla madre.
5. Solo dopo il clone stabile: sostituire progressivamente i punti critici con layer puliti dedicati, senza alterare la UX clone.
6. Solo dopo: innestare IA e tracking sopra il clone `read-only`.

## Perimetro prioritario del clone

| Area madre | Target NEXT | Priorita | Stato atteso | Note |
| --- | --- | --- | --- | --- |
| `Home` / Centro di Controllo | Clone `read-only` fedele | 1 | Da costruire | Stessa chiarezza operativa del madre; nessuna reinterpretazione cockpit |
| `GestioneOperativa` | Clone `read-only` fedele | 1 | Da costruire | Stessi blocchi principali, stesse CTA, nessuna scrittura |
| `Mezzi` | Clone `read-only` fedele | 1 | Da costruire | Stessa esperienza di elenco/filtri/ingresso dossier, con azioni bloccate |
| `DossierMezzo` | Clone `read-only` fedele | 1 | Da costruire | Stesso ordine sezioni e stessa copertura funzionale visibile del madre |
| Moduli madre secondari collegati al Dossier | Clonazione progressiva | 2 | Da decidere dopo priorita 1 | Documenti, costi, PDF, analisi e altri blocchi vengono dopo il nucleo principale |
| Area Autisti | Fuori dal clone admin | Separata | Rimane legacy separata | Nessuna fusione nel backoffice NEXT |

## Task ammessi ora
- Archiviare la NEXT attuale senza perdita di recuperabilita.
- Archiviare le snapshot documentali della strategia precedente.
- Ricreare `/next/*` come clone fedele della madre.
- Disattivare o neutralizzare tutte le azioni di scrittura nel clone.
- Riutilizzare nel clone le letture reali gia usate dalla madre, purche la scrittura resti totalmente bloccata.
- Aggiungere guard-rail `read-only` espliciti lato clone per evitare scritture accidentali.

## Task vietati ora
- Proseguire con la shell NEXT reinterpretata attuale come base del progetto.
- Introdurre nuovi moduli NEXT dominio-centrici come strategia primaria prima del clone.
- Redesign o riordino creativo della UX madre.
- Aprire scritture NEXT business.
- Fondere l'area autisti nel clone admin.
- Sostituire la madre come runtime operativo principale.

## Stato documento
- Questa matrice sostituisce la precedente come base esecutiva `CURRENT`.
- Se un task NEXT non prepara, costruisce o consolida il clone `read-only` della madre, va rivalutato prima della patch.

## Aggiornamento operativo 2026-03-29
- Il principio esecutivo non cambia: madre intoccabile, NEXT solo perimetro di evoluzione e clone ancora `read-only`.
- Cambia pero lo stato reale del clone:
  - diverse route ufficiali NEXT non usano piu solo workbench o letture raw, ma montano la UI madre sopra bridge legacy-shaped puliti derivati dai domain NEXT;
  - il criterio operativo attivo diventa quindi `UI madre fuori + layer NEXT pulito sotto` ogni volta che il repo lo consente senza toccare la madre.

### Moduli oggi chiusi come `pari e puliti`
- `Home`
- `Centro di Controllo`
- `Mezzi`
- `Gestione Operativa`
- `Inventario`
- `Materiali consegnati`
- `Attrezzature cantieri`
- `Manutenzioni`
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`
- `Lavori da eseguire`
- `Lavori in attesa`
- `Lavori eseguiti`
- `Dettaglio lavoro`
- `Dossier Lista`
- `Dossier Mezzo`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Analisi Economica`
- `Materiali da ordinare`
- `Colleghi`
- `Fornitori`
- `IA Home`
- `IA API Key`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Libretti Export`
- `Capo`
- `Acquisti / Preventivi / Listino`
- `Cisterna`
- `Cisterna IA`
- `Cisterna Schede Test`

## Aggiornamento operativo 2026-03-30 - Audit finale post prompt 42
- La matrice esecutiva viene corretta dal nuovo audit `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`.
- Fatti confermati:
  - le route ufficiali del perimetro target non montano piu `NextMotherPage`;
  - le route ufficiali del perimetro target non montano piu `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**` come runtime finale;
  - la madre non risulta modificata nel worktree corrente.
- Fatti smentiti:
  - il perimetro target non e `CHIUSO`;
  - la NEXT non e ancora lavorabile in autonomia sul perimetro target.
- La sezione precedente `Moduli oggi chiusi come pari e puliti` non e piu considerata valida come verdetto finale di autonomia:
  - quei moduli vanno letti alla luce dell'audit 43 come `PARZIALI` o `DA VERIFICARE` finche non sia dimostrata parity esterna reale.
- Regola operativa conseguente:
  - dopo il prompt 42 e corretto considerare chiuso solo il punto `assenza runtime madre finale` sulle route ufficiali;
  - non e corretto considerare chiuso il punto `autonomia reale NEXT`.
- `Autisti / Inbox`

### Moduli ancora non chiusi nel perimetro target
- Il nuovo audit 43 smentisce la formula `nessuno`.
- Restano `PARZIALI`:
  - inventario, materiali, procurement, lavori, mezzi/dossier, capo costi, colleghi, fornitori, IA documentale/libretti, cisterna, autisti, autisti inbox/admin.
- Restano `DA VERIFICARE`:
  - home, centro di controllo, dossier lista, dossier gomme, dossier rifornimenti, capo mezzi, libretti export.

### Regola esecutiva sui residui
- Il backlog operativo del clone fedele non puo piu essere considerato chiuso sul perimetro target nel senso `autonomia reale NEXT`.
- Dopo l'audit 43, il solo punto chiuso con certezza resta `assenza runtime madre finale` sulle route ufficiali.
- `SERVE FILE EXTRA` resta vincolante per eventuali run successivi che richiedano file o contratti fuori whitelist.

## Aggiornamento operativo 2026-03-30 - Procedura madre->clone e backlog audit finale
- La procedura ufficiale del repository e ora fissata in `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`.
- La fonte esecutiva dei gap reali e `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`, derivata dall'audit finale avversariale e non dai report esecutivi precedenti.
- Chiusure runtime verificate in questo run:
  - il perimetro target non monta piu `NextMotherPage` nelle route ufficiali;
  - il perimetro target non monta `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale;
  - `Autisti / Inbox` usa ora adapter NEXT locali per storage/eventi e un bridge admin clone-only locale, senza dipendere da bridge Firebase/Storage legacy-shaped.
- Stato esecutivo della matrice:
  - `BACKLOG ESECUTIVO AUDIT FINALE CHIUSO`
  - `AUTONOMIA FINALE NON AUTO-CERTIFICABILE: SERVE AUDIT SEPARATO`

## Aggiornamento operativo 2026-03-30 - Chiusura moduli ex PARZIALI
- Fonte esecutiva del run: `docs/audit/BACKLOG_GAP_PARZIALI_EXECUTION.md`.
- Questa chiusura riguarda solo i moduli classificati `PARZIALI` dall'audit 43.
- Stato aggiornato dei moduli ex `PARZIALI`:
  - `Inventario` -> `CHIUSO`
  - `Materiali / Materiali consegnati / blocchi materiali collegati` -> `CHIUSO`
  - `Procurement` -> `CHIUSO`
  - `Lavori` -> `CHIUSO`
  - `Mezzi / Dossier` -> `CHIUSO`
  - `Capo Costi` -> `CHIUSO`
  - `Colleghi` -> `CHIUSO`
  - `Fornitori` -> `CHIUSO`
  - `IA documentale / libretti` -> `CHIUSO`
  - `Cisterna` -> `CHIUSO`
  - `Autisti` -> `CHIUSO`
  - `Autisti Inbox / Admin` -> `CHIUSO`
- Fatti runtime usati come base:
  - i moduli chiusi non montano la madre come runtime finale;
  - i flussi contestati dall'audit come bloccati o ancora dipendenti da endpoint reali ora sono chiusi nel clone oppure gia coerenti come overlay locali del clone;
  - nessuna scrittura business reale e stata riaperta.
- Limite che resta esplicito:
  - i moduli `DA VERIFICARE` non vengono promossi da questa sezione e restano fuori dal verdetto finale di autonomia NEXT.

## Aggiornamento operativo 2026-03-30 - Audit finale bucket `DA VERIFICARE`
- Fonte audit: `docs/audit/AUDIT_FINALE_DA_VERIFICARE_NEXT_AUTONOMA.md`.
- Il bucket `DA VERIFICARE` non resta piu sospeso:
  - `Centro di Controllo` -> `CHIUSO`
  - `Dossier Lista` -> `CHIUSO`
  - `Dossier Gomme` -> `CHIUSO`
  - `Dossier Rifornimenti` -> `CHIUSO`
  - `Capo Mezzi` -> `CHIUSO`
  - `Home` -> `APERTO`
  - `Libretti Export` -> `APERTO`
- Conseguenza esecutiva:
  - il perimetro target non e ancora autonomo;
  - i gap residui verificati sono ora solo `Home` e `Libretti Export`.
- Verdetto netto della matrice:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Aggiornamento operativo 2026-03-30 - Chiusura execution di `Home` e `Libretti Export`
- Fonte esecutiva del run: `docs/audit/BACKLOG_ULTIMI_2_APERTI_EXECUTION.md`.
- Stato aggiornato degli ultimi 2 moduli rimasti `APERTO`:
  - `Home` -> `APERTO`
  - `Libretti Export` -> `CHIUSO`
- Fatti runtime usati come base:
  - `/next` non dipende piu da `NextLegacyStorageBoundary` e usa una modale eventi NEXT clone-safe, senza passare da `storageSync` raw;
  - `/next/libretti-export` replica di nuovo la UI madre a gruppi/carte selezionabili, ma legge e genera PDF sopra il domain NEXT pulito;
  - nessuno dei due moduli monta runtime madre finale e nessuno riapre scritture business reali.
- Nota specifica:
  - le suggestioni autista della `Home` sono state riallineate al criterio madre `sessioni + mezzi`; il gap mirato e chiuso nel clone.
- Limite che resta esplicito:
  - questa sezione chiude gli ultimi 2 moduli aperti come execution;
  - il verdetto finale `NEXT autonoma SI/NO` non viene promosso qui e resta demandato a un audit separato.

## Aggiornamento operativo 2026-03-30 - Audit finale conclusivo del perimetro target
- Fonte audit: `docs/audit/AUDIT_FINALE_CONCLUSIVO_NEXT_AUTONOMA.md`.
- Stato aggiornato del perimetro target dopo la verifica codice reale:
  - `CHIUSO`: Centro di Controllo, Mezzi, Dossier Lista, Dossier Mezzo, Dossier Gomme, Dossier Rifornimenti, Gestione Operativa, Inventario, Materiali consegnati, Materiali da ordinare, Acquisti / Ordini / Preventivi / Listino, Lavori, Capo Mezzi, Capo Costi, IA Home, IA Libretto, IA Documenti, IA Copertura Libretti, Libretti Export, Cisterna, Cisterna IA, Cisterna Schede Test, Colleghi, Fornitori, Autisti Inbox / Admin.
  - `APERTO`: Home, IA API Key, Autisti.
  - `DA VERIFICARE`: nessuno.
- Gap reali residui confermati dall'audit:
  - `IA API Key`: il clone mantiene il flusso di lettura ma non ricostruisce il salvataggio della chiave in forma equivalente.
  - `Autisti`: il runtime finale e NEXT, ma la home clone-safe blocca ancora il salvataggio del modale `Gomme`.
- Regola operativa conseguente:
  - il problema `mount finale madre` resta chiuso;
  - il problema `autonomia reale NEXT sul perimetro target` resta aperto.
- Verdetto netto della matrice:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Aggiornamento operativo 2026-03-30 - Chiusura execution dei 3 gap finali
- Fonte esecutiva del run: `docs/audit/BACKLOG_3_GAP_FINALI_EXECUTION.md`.
- Questo run chiude solo i gap reali finali riaperti nel backlog:
  - `IA API Key` -> `CHIUSO`
  - `Autisti` -> `CHIUSO`
  - `Gestione Operativa` -> `CHIUSO`
- Fatti runtime usati come base:
  - `IA API Key` replica il flusso madre anche sul save e non rimanda piu la scrittura alla madre;
  - `Autisti` non blocca piu il save `Gomme` nel runtime home NEXT;
  - `Gestione Operativa` non si presenta piu come hub/workbench con viste incorporate ma come pagina madre-like che apre i moduli figli con route dedicate.
- Stato esecutivo della matrice dopo il prompt 48:
  - nessun modulo del backlog esecutivo finale resta `APERTO`;
  - il verdetto finale di autonomia resta comunque demandato a un audit separato.

## Aggiornamento operativo 2026-03-30 - Riallineamento `Manutenzioni` e formato date NEXT
- Fonte esecutiva del run: `docs/audit/BACKLOG_MANUTENZIONI_DATEFORMAT_EXECUTION.md`.
- Stato aggiornato dei due problemi reali trattati:
  - `Manutenzioni` -> `CHIUSO`
  - `Formato data visibile NEXT` -> `CHIUSO`
- Fatti runtime usati come base:
  - `src/next/domain/nextManutenzioniDomain.ts` non usa piu parsing ambiguo delle stringhe legacy `gg mm aaaa`;
  - `src/next/NextManutenzioniPage.tsx` legge la lista dallo storico manutenzioni dedicato e non da una snapshot operativa di supporto;
  - i record senza targa non vengono piu scartati implicitamente dal dataset manutenzioni globale;
  - le date visibili del clone sono uniformate a `gg mm aaaa` oppure `gg mm aaaa HH:mm` se la UI espone anche l'ora.
- Limite che resta esplicito:
  - il controllo live del documento remoto `storage/@manutenzioni` non e eseguibile da CLI nel contesto corrente per `permission-denied`;
  - la parity chiusa in questo run e quindi verificata su codice NEXT, parser, ordinamento, filtri e sweep delle date visibili.

## Aggiornamento operativo 2026-03-30 - Home read-only piu fedele, ma non promossa a chiusa
- Fonte execution: `docs/audit/BACKLOG_HOME_EXECUTION.md`.
- Stato modulo:
  - `Home` -> `APERTO`
- Fatti verificati nel run:
  - `/next` continua a usare una pagina NEXT vera;
  - la `Home` legge ora i dataset reali della madre senza overlay locali Home su alert, mezzi o eventi;
  - le azioni che scriverebbero nella madre restano bloccate in modo esplicito nel clone;
  - il pannello extra `D03 autisti`, assente nella madre, e stato rimosso dalla UI della `Home`.
- Motivo per cui non passa a `CHIUSO`:
  - il modulo e ora piu vicino a una copia fedele read-only della madre;
  - i flussi principali che nella madre mutano davvero i dati restano bloccati, quindi la parity esterna utile non e ancora promuovibile a chiusa senza un audit dedicato di riconferma.

## Aggiornamento operativo 2026-03-30 - Audit post execution Home
- Fonte audit: `docs/audit/AUDIT_HOME_POST_EXECUTION.md`.
  - Stato modulo:
    - `Home` -> `APERTO`
  - Fatti verificati nel codice:
    - `/next` monta una pagina NEXT vera, non `NextMotherPage`;
    - la `Home` legge i dataset reali della madre senza overlay clone-only locali;
    - la UI utile resta fedele alla madre e il pannello extra `D03 autisti` non c'e piu;
    - le scritture restano bloccate in modo read-only coerente;
    - le suggestioni autista restano piu ampie della madre perche includono ancora `autistiSnapshot.assignments`.
  - Conseguenza:
    - la `Home` resta nel backlog aperto finche il gap di parity sulle suggestioni non viene chiuso.

## Aggiornamento operativo 2026-03-30 - Audit finale separato `Home`
- Fonte audit finale: `docs/audit/AUDIT_HOME_FINAL.md`.
- Stato modulo:
  - `Home` -> `APERTO`
- Fatti verificati nel codice:
  - `/next` monta una pagina NEXT vera e non usa runtime finale madre;
  - la `Home` legge gli stessi dataset reali della madre tramite il layer D10 NEXT;
  - le suggestioni autista sono allineate al criterio madre `sessioni + mezzi`;
  - non restano overlay clone-only locali della `Home` su alert, mezzi o eventi;
  - le scritture reali sono bloccate in modo esplicito e coerente col contratto read-only.
- Gap residui che tengono il modulo aperto:
  - il modal eventi autisti NEXT non replica la stessa superficie CTA della madre;
  - i modali data NEXT non replicano i testi visibili della madre su placeholder e validazione.
- Conseguenza:
  - il problema non e piu `DA VERIFICARE`;
  - il problema e parity visibile incompleta, quindi `APERTO`.

## Aggiornamento operativo 2026-03-30 - Loop `Home` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_home.md`
  - audit: `docs/audit/AUDIT_home_LOOP.md`
- Stato modulo nel loop:
  - `Home` -> `CHIUSO`
- Fatti verificati nel codice:
  - `/next` monta una pagina NEXT vera e non usa runtime finale madre;
  - il modal eventi `Home` riallinea le CTA visibili alla madre (`CREA LAVORO` / `GIÀ CREATO`, `IMPORTA IN DOSSIER`) senza aggiungere superfici clone-only;
  - i tre modali data riallineano placeholder e validazioni visibili alla madre;
  - i dati reali letti restano quelli della madre e le scritture reali restano bloccate in modo esplicito.
- Conseguenza di matrice:
  - `Home` esce dal backlog aperto del loop corrente;
  - il loop continua dal prossimo modulo non chiuso nel tracker, senza promozione globale della NEXT.

## Aggiornamento operativo 2026-03-30 - Loop `Centro di Controllo` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_centro-di-controllo.md`
  - audit: `docs/audit/AUDIT_centro-di-controllo_LOOP.md`
- Stato modulo nel loop:
  - `Centro di Controllo` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextCentroControlloParityPage`, non la madre;
  - il reader autisti usato dal runtime ufficiale non porta piu dati solo locali del clone;
  - il reader flotta usato dal runtime ufficiale non applica piu patch clone-only;
  - il formato data visibile torna uguale alla madre.
- Conseguenza di matrice:
  - `Centro di Controllo` esce dal backlog non chiuso del loop;
  - il loop prosegue dal modulo `Mezzi`.

## Aggiornamento operativo 2026-03-30 - Loop fermato su `Mezzi`
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_mezzi.md`
  - audit: `docs/audit/AUDIT_mezzi_LOOP.md`
- Stato modulo nel loop:
  - `Mezzi` -> `FAIL`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextMezziPage`, non la madre;
  - il runtime ufficiale usa ancora patch locali flotta e cancellazioni clone-only;
  - la UI ufficiale dichiara esplicitamente salvataggi locali e `IA locale`;
  - la lettura ufficiale non disattiva le patch clone-only del reader flotta.
- Conseguenza di matrice:
  - il loop si ferma su `Mezzi`;
  - il prossimo run deve ripartire dallo stesso modulo, senza avanzare oltre.

## Aggiornamento operativo 2026-03-31 - Loop `Mezzi` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_mezzi.md`
  - audit: `docs/audit/AUDIT_mezzi_LOOP.md`
- Stato modulo nel loop:
  - `Mezzi` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextMezziPage`, non la madre;
  - il runtime ufficiale replica la superficie madre del modulo `Mezzi` su foto, blocco `LIBRETTO (IA)`, form completo, CTA visibili e lista per categoria;
  - il runtime ufficiale legge `@mezzi_aziendali` e `@colleghi` tramite `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - `handleSave()`, `handleDelete()` e `handleAnalyzeLibrettoWithIA()` bloccano le azioni scriventi o side-effect reali con messaggio read-only esplicito;
  - `nextAnagraficheFlottaDomain` non applica piu patch clone-only per default.
- Conseguenza di matrice:
  - `Mezzi` esce dal backlog non chiuso del loop;
  - il prossimo modulo non `CLOSED` del tracker e `Dossier Lista`;
  - nessuna promozione globale della NEXT viene inferita da questa sezione.
