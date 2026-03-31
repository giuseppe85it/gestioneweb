# MATRICE ESECUTIVA NEXT

## Audit finale globale V4 2026-03-31 - blocco extra-tracker `IA interna`
- L'audit finale globale separato aggiornato `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V4.md` prevale sul tracker del loop.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- I moduli del tracker e le route ufficiali gia corrette reggono nel codice reale.
- Resta pero un blocco grave su route ufficiali NEXT extra-tracker montate in `src/App.tsx`:
  - `/next/ia/interna`
  - `/next/ia/interna/sessioni`
  - `/next/ia/interna/richieste`
  - `/next/ia/interna/artifacts`
  - `/next/ia/interna/audit`
- `src/next/NextInternalAiPage.tsx` mantiene ancora persistenza e workflow scriventi reali del sottosistema IA interno:
  - upload e rimozione allegati;
  - save e archivio artifact;
  - workflow preview / approve / reject / rollback.
- Conseguenza:
  - nessun modulo `CLOSED` del tracker si riapre, ma il perimetro ufficiale NEXT completo non e ancora tutto read-only;
  - la NEXT non puo essere dichiarata lavorabile in autonomia sul perimetro target.

## Correzione post-audit globale V3 2026-03-31 - `Gestione Operativa` route ufficiale
- Il blocco grave rilevato dall'audit finale globale V3 sulla route ufficiale `/next/gestione-operativa` e stato corretto nel runtime ufficiale.
- `readNextOperativitaGlobaleSnapshot()` passa ora `includeCloneOverlays: false` a `Inventario`, `Materiali` e `Procurement` nel solo path ufficiale della route.
- Badge, preview e contatori restano madre-like fuori, ma ora leggono solo dati reali nel runtime ufficiale.
- La correzione chiude il blocco V3 della route, ma non sostituisce un nuovo audit finale globale separato.

## Riesecuzione audit finale globale V3 2026-03-31 - blocco `Gestione Operativa`
- L'audit finale globale separato aggiornato `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md` prevale sul tracker del loop.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- I fix finali di `Autisti`, `Autisti Inbox / Admin` e `Dossier Mezzo` reggono, ma il nuovo audit globale trova ancora un blocco grave extra-tracker su una route ufficiale NEXT:
  - `/next/gestione-operativa` e montata davvero da `src/App.tsx`;
  - `NextGestioneOperativaPage` usa `useNextOperativitaSnapshot`;
  - `readNextOperativitaGlobaleSnapshot()` legge ancora `Inventario`, `Materiali` e `Procurement` senza spegnere gli overlay clone;
  - i domain condivisi mantengono il default `includeCloneOverlays ?? true`;
  - quindi badge e preview della route ufficiale possono ancora mostrare dati clone-local.
- Conseguenza:
  - nessun nuovo falso `CLOSED` viene riaperto nei moduli del tracker gia corretti;
  - la NEXT complessiva resta comunque `NO` finche `Gestione Operativa` non viene resa totalmente real-only nel path ufficiale.

## Correzione post-audit globale V3 2026-03-31 - `Dossier Mezzo`
- Il blocco grave rilevato dall'audit finale globale V3 su `Dossier Mezzo` e stato corretto nel runtime ufficiale.
- Il composite ufficiale del dossier non legge piu i movimenti materiali con overlay clone abilitati.
- La tabella `Materiali e movimenti inventario` resta madre-like fuori, ma ora usa solo dati reali nel percorso ufficiale.
- Il modulo torna coerente col claim `CLOSED` del tracker, ma questa correzione non sostituisce un nuovo audit finale globale separato.

## Audit finale globale post-loop V3 2026-03-31
- L'audit finale globale separato aggiornato `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md` prevale sul tracker del loop.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Il fix finale di `Autisti Inbox / Admin` risolve il blocco del V2, ma il nuovo audit globale separato trova un altro blocco grave:
  - `Dossier Mezzo` e ancora marcato `CLOSED` nel tracker;
  - pero il runtime ufficiale usa ancora `readNextMaterialiMovimentiSnapshot()` senza spegnere gli overlay clone;
  - il default del domain materiali resta `includeCloneOverlays ?? true`;
  - il risultato entra nella tabella visibile `Materiali e movimenti inventario` della route ufficiale NEXT.
- Conseguenza:
  - almeno un modulo dichiarato chiuso non e chiuso davvero nel codice reale;
  - la NEXT non puo essere dichiarata lavorabile in autonomia sul perimetro target.

## Correzione post-audit globale V2 2026-03-31 - `Autisti Inbox / Admin`
- Il blocco grave rilevato dall'audit finale globale V2 su `Autisti Inbox / Admin` e stato corretto nel runtime ufficiale.
- I wrapper ufficiali home/admin non montano piu `NextLegacyStorageBoundary`.
- Il boundary legacy non inietta piu override `autisti` neppure sul perimetro ufficiale `/next/autisti-inbox*` e `/next/autisti-admin`.
- Il modulo torna coerente col claim `CLOSED` del tracker, ma questa correzione non sostituisce un nuovo audit finale globale separato.

## Audit finale globale post-loop V2 2026-03-31
- L'audit finale globale separato aggiornato `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V2.md` prevale sul tracker del loop.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Il fix finale di `Autisti` risolve il vecchio `NO`, ma il nuovo audit globale separato trova un altro blocco grave:
  - `Autisti Inbox / Admin` e ancora marcato `CLOSED` nel tracker;
  - pero il runtime ufficiale `/next/autisti-inbox*` e `/next/autisti-admin` passa ancora da `NextLegacyStorageBoundary` con preset `autisti`;
  - quel boundary reintroduce overlay clone-local nei dataset letti dal modulo, quindi la parity dati con la madre non e dimostrata.
- Conseguenza:
  - almeno un modulo dichiarato chiuso non e chiuso davvero nel codice reale;
  - la NEXT non puo essere dichiarata lavorabile in autonomia sul perimetro target.

## Correzione post-audit globale 2026-03-31 - `Autisti`
- Il blocco grave rilevato dall'audit finale globale sul modulo `Autisti` e stato corretto nel runtime ufficiale.
- Le navigazioni reali di `NextLoginAutistaNative.tsx`, `NextSetupMezzoNative.tsx` e `NextHomeAutistaNative.tsx` non puntano piu a `/autisti/*`.
- Il perimetro ufficiale resta confinato a `/next/autisti/*` e il boundary legacy non inietta piu override `autisti` sul solo subtree ufficiale dell'app.
- La correzione chiude il falso `CLOSED` del tracker, ma non sostituisce un nuovo audit finale globale separato.

## Avvertenza critica audit finale globale post-loop 2026-03-31
- L'audit finale globale separato `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP.md` prevale sul tracker del loop.
- Esito netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Blocco grave verificato:
  - `Autisti` e marcato `CLOSED` nel tracker, ma il flusso ufficiale NEXT continua a navigare verso `/autisti/*` dentro `NextLoginAutistaNative.tsx`, `NextSetupMezzoNative.tsx` e `NextHomeAutistaNative.tsx`;
  - quindi almeno un modulo dichiarato chiuso non e chiuso davvero nel codice reale.

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

## Aggiornamento operativo 2026-03-31 - `Autisti` chiuso, prossimo modulo `Autisti Inbox / Admin`
- Il loop ufficiale ha chiuso `Autisti` con audit separato `PASS`.
- Le route `/next/autisti/*` restano NEXT native e madre-like; le chiavi D03 gestite vengono lette senza overlay clone-only sul solo perimetro ufficiale dell'app autisti.
- Login e setup mantengono solo contesto UI locale coerente con la sessione madre gia esistente; controllo, cambio mezzo, rifornimento, richiesta attrezzature, segnalazioni e modal gomme mantengono la UI della madre ma bloccano ogni scrittura in read-only esplicito.
- `Autisti Inbox / Admin` non e stato toccato in questo run e resta il prossimo modulo non `CLOSED` del tracker.

## Aggiornamento operativo 2026-03-31 - `Colleghi` e `Fornitori` chiusi, `Autisti` ancora aperto
- Il loop ufficiale modulo-per-modulo ha chiuso `Colleghi` e `Fornitori` con audit separato `PASS`.
- Le route ufficiali `/next/colleghi` e `/next/fornitori` restano madre-like ma leggono i dataset reali senza overlay locali del clone.
- `Autisti` non e stato chiuso nello stesso run: il perimetro `/next/autisti/*` resta ancora un pacchetto clone-local multi-route e va ripreso come modulo dedicato.

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

## Aggiornamento operativo 2026-03-31 - Loop `Dossier Lista` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_dossier-lista.md`
  - audit: `docs/audit/AUDIT_dossier-lista_LOOP.md`
- Stato modulo nel loop:
  - `Dossier Lista` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextDossierListaPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre sul flusso `categorie -> mezzi -> dossier`;
  - il reader ufficiale usa `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - il click verso il dettaglio dossier usa l'alias NEXT `/next/dossiermezzi/:targa`, coerente con il percorso madre e montato su `NextDossierMezzoPage`;
  - il modulo non espone scritture o side effect business.
- Conseguenza di matrice:
  - `Dossier Lista` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Dossier Mezzo`.

## Aggiornamento operativo 2026-03-31 - Loop `Dossier Mezzo` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_dossier-mezzo.md`
  - audit: `docs/audit/AUDIT_dossier-mezzo_LOOP.md`
- Stato modulo nel loop:
  - `Dossier Mezzo` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextDossierMezzoPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su dati tecnici, foto, lavori, manutenzioni, materiali, rifornimenti, documenti e PDF;
  - il reader ufficiale usa `readNextDossierMezzoCompositeSnapshot()`, quindi sopra layer NEXT puliti e senza runtime legacy;
  - il bottone `Elimina` dei preventivi resta visibile ma blocca l'azione in read-only esplicito;
  - il runtime ufficiale non usa piu overlay clone-only per nascondere documenti.
- Conseguenza di matrice:
  - `Dossier Mezzo` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Dossier Gomme`.

## Aggiornamento operativo 2026-03-31 - Loop `Dossier Gomme` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_dossier-gomme.md`
  - audit: `docs/audit/AUDIT_dossier-gomme_LOOP.md`
- Stato modulo nel loop:
  - `Dossier Gomme` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextDossierGommePage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, ritorno dossier, statistiche, storico e grafici;
  - il reader ufficiale usa `NextGommeEconomiaSection` con `dataScope="legacy_parity"`, quindi la vista ufficiale mostra solo gli eventi ricavati da `@manutenzioni`, come la madre;
  - il layer NEXT sottostante resta pulito e read-only, senza rimettere runtime legacy nel modulo ufficiale;
  - il modulo non espone scritture o side effect business.
- Conseguenza di matrice:
  - `Dossier Gomme` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Dossier Rifornimenti`.

## Aggiornamento operativo 2026-03-31 - Loop `Dossier Rifornimenti` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_dossier-rifornimenti.md`
  - audit: `docs/audit/AUDIT_dossier-rifornimenti_LOOP.md`
- Stato modulo nel loop:
  - `Dossier Rifornimenti` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextDossierRifornimentiPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, ritorno dossier, riepilogo, ultimi rifornimenti e grafici;
  - il reader ufficiale usa `NextRifornimentiEconomiaSection` con `dataScope="legacy_parity"`, quindi la vista ufficiale esclude i record `solo_campo` e mantiene solo il perimetro dati visibile nella madre;
  - il layer NEXT sottostante resta pulito e read-only, senza rimettere runtime legacy nel modulo ufficiale;
  - il modulo non espone scritture o side effect business.
- Conseguenza di matrice:
  - `Dossier Rifornimenti` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Inventario`.

## Aggiornamento operativo 2026-03-31 - Loop `Inventario` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_inventario.md`
  - audit: `docs/audit/AUDIT_inventario_LOOP.md`
- Stato modulo nel loop:
  - `Inventario` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextInventarioPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, pulsanti PDF, form, lista, controlli quantita e modale modifica;
  - il reader ufficiale usa `readNextInventarioSnapshot({ includeCloneOverlays: false })`, quindi la vista ufficiale legge i dati reali di `@inventario` senza overlay clone-only;
  - le azioni scriventi restano visibili ma bloccate con messaggi read-only espliciti;
  - il modulo non usa piu writer clone-only nel runtime ufficiale.
- Conseguenza di matrice:
  - `Inventario` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Materiali consegnati`.

## Aggiornamento operativo 2026-03-31 - Loop `Materiali consegnati` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_materiali_consegnati.md`
  - audit: `docs/audit/AUDIT_materiali_consegnati_LOOP.md`
- Stato modulo nel loop:
  - `Materiali consegnati` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextMaterialiConsegnatiPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, pulsanti PDF, form, lista destinatari, dettaglio storico e modale PDF;
  - il reader ufficiale usa `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`, quindi la vista ufficiale legge i dati reali di `@materialiconsegnati` senza overlay clone-only;
  - la route usa anche `readNextInventarioSnapshot({ includeCloneOverlays: false })` e `readNextAnagraficheFlottaSnapshot()` per alimentare gli stessi ingressi reali della madre;
  - le azioni scriventi restano visibili ma bloccate con messaggi read-only espliciti;
  - il modulo non usa piu writer clone-only nel runtime ufficiale.
- Conseguenza di matrice:
  - `Materiali consegnati` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Materiali da ordinare`.

## Aggiornamento operativo 2026-03-31 - Loop `Materiali da ordinare` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_materiali-da-ordinare.md`
  - audit: `docs/audit/AUDIT_materiali-da-ordinare_LOOP.md`
- Stato modulo nel loop:
  - `Materiali da ordinare` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale monta `NextMaterialiDaOrdinarePage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, tab, form, tabella, sticky bar e modale placeholder;
  - il reader ufficiale usa `readNextFornitoriSnapshot({ includeCloneOverlays: false })`, quindi la vista ufficiale legge i dati reali di `@fornitori` senza overlay clone-only;
  - le azioni scriventi restano visibili ma bloccate con messaggi read-only espliciti;
  - il modulo non usa piu ordini clone-only, upload locali, editor locali o PDF clone-only nel runtime ufficiale.
- Conseguenza di matrice:
  - `Materiali da ordinare` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Acquisti / Ordini / Preventivi / Listino`.

## Aggiornamento operativo 2026-03-31 - Loop `Acquisti / Ordini / Preventivi / Listino` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_acquisti-ordini-preventivi-listino.md`
  - audit: `docs/audit/AUDIT_acquisti-ordini-preventivi-listino_LOOP.md`
- Stato gruppo nel loop:
  - `Acquisti / Ordini / Preventivi / Listino` -> `CHIUSO`
- Fatti verificati nel codice:
  - le route ufficiali `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` e `/next/dettaglio-ordine/:ordineId` montano `NextProcurementStandalonePage`, non la madre;
  - il runtime ufficiale legge `@ordini` tramite `readNextProcurementSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only nel gruppo ufficiale;
  - `NextProcurementReadOnlyPanel` replica il ramo procurement read-only della madre su header, tab, liste, dettaglio ordine e schede bloccate;
  - le azioni scriventi e i PDF restano visibili ma bloccati in modo esplicito;
  - il runtime ufficiale non usa piu writer clone-only, modali edit/add materiale o PDF locali.
- Conseguenza di matrice:
  - `Acquisti / Ordini / Preventivi / Listino` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Lavori`.

## Aggiornamento operativo 2026-03-31 - Loop `Lavori` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_lavori.md`
  - audit: `docs/audit/AUDIT_lavori_LOOP.md`
- Stato modulo nel loop:
  - `Lavori` -> `CHIUSO`
- Fatti verificati nel codice:
  - le route ufficiali `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti` e `/next/dettagliolavori/:lavoroId` montano runtime NEXT veri, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su form, liste, accordion, PDF, dettaglio e modali principali;
  - il reader ufficiale usa `@lavori` tramite `readNextLavoriInAttesaSnapshot({ includeCloneOverlays: false })`, `readNextLavoriEseguitiSnapshot({ includeCloneOverlays: false })` e `readNextDettaglioLavoroSnapshot(..., { includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - le azioni scriventi restano visibili ma bloccate con messaggi read-only espliciti;
  - il modulo non usa piu writer clone-only o scaffolding locale nel runtime ufficiale.
- Conseguenza di matrice:
  - `Lavori` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Capo Mezzi`.

## Aggiornamento operativo 2026-03-31 - Loop `Capo Mezzi` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_capo-mezzi.md`
  - audit: `docs/audit/AUDIT_capo-mezzi_LOOP.md`
- Stato modulo nel loop:
  - `Capo Mezzi` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/capo/mezzi` monta `NextCapoMezziPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, ricerca, gruppi per categoria, card mezzo e riepilogo costi;
  - il reader ufficiale usa `readNextCapoMezziSnapshot({ includeCloneDocuments: false })`, quindi senza documenti clone-only nel modulo ufficiale;
  - il modulo resta di sola lettura e non espone scritture reali o locali.
- Conseguenza di matrice:
  - `Capo Mezzi` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Capo Costi`.

## Aggiornamento operativo 2026-03-31 - Loop `Capo Costi` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_capo-costi.md`
  - audit: `docs/audit/AUDIT_capo-costi_LOOP.md`
- Stato modulo nel loop:
  - `Capo Costi` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/capo/costi/:targa` monta `NextCapoCostiMezzoPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su filtri, KPI, approvazioni preventivi, tabs, lista documenti e preview PDF;
  - il reader ufficiale usa `readNextCapoCostiMezzoSnapshot(targa, { includeCloneApprovals: false, includeCloneDocuments: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - `APPROVA`, `RIFIUTA`, `DA VALUTARE` e `ANTEPRIMA TIMBRATO` restano visibili ma bloccati in modo esplicito;
  - il runtime ufficiale non usa piu writer clone-only o PDF timbrati locali.
- Conseguenza di matrice:
  - `Capo Costi` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `IA Home`.

## Aggiornamento operativo 2026-03-31 - Loop `IA Home` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_ia-home.md`
  - audit: `docs/audit/AUDIT_ia-home_LOOP.md`
- Stato modulo nel loop:
  - `IA Home` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/ia` monta `NextIntelligenzaArtificialePage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su hero, badge API key, card attive e card `In arrivo`;
  - il reader ufficiale usa `readNextIaConfigSnapshot()` sullo stesso documento Firestore della madre;
  - il modulo non scrive.
- Conseguenza di matrice:
  - `IA Home` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `IA API Key`.

## Aggiornamento operativo 2026-03-31 - Loop `IA API Key` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_ia-apikey.md`
  - audit: `docs/audit/AUDIT_ia-apikey_LOOP.md`
- Stato modulo nel loop:
  - `IA API Key` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/ia/apikey` monta `NextIAApiKeyPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su banner, input, toggle, pulsanti e nota finale;
  - il reader ufficiale usa `readNextIaConfigSnapshot()` sullo stesso documento Firestore della madre;
  - `saveNextIaConfigSnapshot()` non scrive piu in Firestore e il bottone `Salva chiave` resta visibile ma bloccato in modo esplicito.
- Conseguenza di matrice:
  - `IA API Key` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `IA Libretto`.

## Aggiornamento operativo 2026-03-31 - Loop `IA Libretto` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_ia-libretto.md`
  - audit: `docs/audit/AUDIT_ia-libretto_LOOP.md`
- Stato modulo nel loop:
  - `IA Libretto` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/ia/libretto` monta `NextIALibrettoPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, step, upload, analisi, risultati, archivio e viewer;
  - il reader ufficiale usa `readNextIaConfigSnapshot()` sul documento reale `@impostazioni_app/gemini` e `readNextIaLibrettoArchiveSnapshot()` su `storage/@mezzi_aziendali`;
  - `Analizza con IA` e `Salva nei documenti del mezzo` restano visibili ma bloccano il comportamento con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu scaffold clone-only, handoff IA dedicato, preview facade locale o patch clone-only sul mezzo.
- Conseguenza di matrice:
  - `IA Libretto` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `IA Documenti`.

## Aggiornamento operativo 2026-03-31 - Loop `IA Documenti` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_ia-documenti.md`
  - audit: `docs/audit/AUDIT_ia-documenti_LOOP.md`
- Stato modulo nel loop:
  - `IA Documenti` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/ia/documenti` monta `NextIADocumentiPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su caricamento, anteprima, risultati analisi, archivio documenti salvati e modale valuta;
  - il reader ufficiale usa `readNextIaConfigSnapshot()`, `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })` e `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`;
  - `Analizza con IA`, `Salva Documento` e `Imposta valuta` restano visibili ma bloccati in modo esplicito;
  - il runtime ufficiale non usa piu preview legacy o writer clone-only per documenti e inventario.
- Conseguenza di matrice:
  - `IA Documenti` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `IA Copertura Libretti`.

## Aggiornamento operativo 2026-03-31 - Loop `IA Copertura Libretti` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_ia-copertura-libretti.md`
  - audit: `docs/audit/AUDIT_ia-copertura-libretti_LOOP.md`
- Stato modulo nel loop:
  - `IA Copertura Libretti` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/ia/copertura-libretti` monta `NextIACoperturaLibrettiPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su filtri, tabella copertura, area `Ripara libretti da lista ID` e debug DEV;
  - il reader ufficiale usa `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` e il layer D01 espone anche `librettoStoragePath` reale;
  - `ESEGUI RIPARAZIONE`, `Carica libretto` e `Ripara libretto` restano visibili ma bloccati in modo esplicito;
  - il runtime ufficiale non usa piu scaffold clone-only o patch locali sulla flotta.
- Conseguenza di matrice:
  - `IA Copertura Libretti` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Libretti Export`.

## Aggiornamento operativo 2026-03-31 - Loop `Libretti Export` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_libretti-export.md`
  - audit: `docs/audit/AUDIT_libretti-export_LOOP.md`
- Stato modulo nel loop:
  - `Libretti Export` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/libretti-export` monta `NextLibrettiExportPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, toolbar, selezione per categoria, anteprima PDF e azioni di condivisione;
  - il modulo usa `readNextLibrettiExportSnapshot()` e `generateNextLibrettiExportPreview()` in sola lettura, senza scritture reali o clone-only;
  - il fallback `librettoStoragePath` resta gestito nel layer NEXT ufficiale.
- Conseguenza di matrice:
  - `Libretti Export` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Cisterna`.

## Aggiornamento operativo 2026-03-31 - Loop `Cisterna` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_cisterna.md`
  - audit: `docs/audit/AUDIT_cisterna_LOOP.md`
- Stato modulo nel loop:
  - `Cisterna` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/cisterna` monta `NextCisternaPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, month picker, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio;
  - il reader ufficiale usa `readNextCisternaSnapshot(month, { includeCloneOverlays: false })`, quindi senza documenti, schede o parametri clone-only nel modulo ufficiale;
  - `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica` ed `Esporta PDF` restano visibili ma bloccati in modo esplicito;
  - il runtime ufficiale non usa piu scaffold clone-specifico, writer locali o export PDF locale.
- Conseguenza di matrice:
  - `Cisterna` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Cisterna IA`.

## Aggiornamento operativo 2026-03-31 - Loop `Cisterna IA` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_cisterna-ia.md`
  - audit: `docs/audit/AUDIT_cisterna-ia_LOOP.md`
- Stato modulo nel loop:
  - `Cisterna IA` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/cisterna/ia` monta `NextCisternaIAPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, note, upload, preview, pulsanti, risultato estrazione e campi del form;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, banner/handoff visibile, upload Storage, `extractCisternaDocumento()`, `addDoc()` o salvataggi clone-only;
  - `Analizza documento (IA)` e `Salva in archivio cisterna` restano visibili ma bloccano il comportamento in modo esplicito.
- Conseguenza di matrice:
  - `Cisterna IA` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Cisterna Schede Test`.

## Aggiornamento operativo 2026-03-31 - Loop fermato su `Cisterna Schede Test`
- Fonti del ciclo:
  - analisi/backlog: `docs/audit/BACKLOG_cisterna-schede-test.md`
  - audit preliminare: `docs/audit/AUDIT_cisterna-schede-test_LOOP.md`
- Stato modulo nel loop:
  - `Cisterna Schede Test` -> `APERTO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/cisterna/schede-test` monta una pagina NEXT vera ma ancora clone-specifica;
  - il runtime ufficiale usa ancora `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` e messaggi di salvataggio locale;
  - la controparte madre resta molto piu ampia su crop, calibrazione, estrazione IA, modali e conferma finale, quindi il gap non e riducibile in un micro-passaggio onesto.
- Conseguenza di matrice:
  - il loop si ferma su `Cisterna Schede Test` per budget operativo non sufficiente a chiuderlo in modo onesto;
  - il prossimo modulo da affrontare resta `Cisterna Schede Test`.

## Aggiornamento operativo 2026-03-31 - Loop `Cisterna Schede Test` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_cisterna-schede-test.md`
  - audit: `docs/audit/AUDIT_cisterna-schede-test_LOOP.md`
- Stato modulo nel loop:
  - `Cisterna Schede Test` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/cisterna/schede-test` monta `NextCisternaSchedeTestPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su header, mese, archivio, `EDIT MODE`, tabs, inserimento manuale, crop/calibrazione, tabella IA, modal anteprima e conferma finale;
  - il reader ufficiale usa `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` e `readNextCisternaSchedaDetail(..., { includeCloneOverlays: false })`, quindi senza overlay clone-only nel modulo ufficiale;
  - le azioni scriventi e IA restano visibili ma bloccate con messaggi read-only espliciti;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, `upsertNextCisternaCloneScheda()` o salvataggi locali clone-only.
- Conseguenza di matrice:
  - `Cisterna Schede Test` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Colleghi`.

## Aggiornamento operativo 2026-03-31 - Loop `Autisti Inbox / Admin` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_autisti-inbox-admin.md`
  - audit: `docs/audit/AUDIT_autisti-inbox-admin_LOOP.md`
- Stato modulo nel loop:
  - `Autisti Inbox / Admin` -> `CHIUSO`
- Fatti verificati nel codice:
  - le route ufficiali `/next/autisti-inbox*` e `/next/autisti-admin` montano runtime NEXT veri, non `src/autistiInbox/**` come mount finale;
  - i wrapper ufficiali non espongono piu handoff o summary clone-specifici non presenti nella madre;
  - il boundary D03 ufficiale ignora overlay locali anche nel perimetro inbox/admin;
  - l'admin mantiene la UI madre-like ma blocca in modo esplicito le azioni scriventi su sessioni, storico, segnalazioni, richieste, gomme, rifornimenti, dossier e lavori;
  - lint e build risultano `OK`.
- Conseguenza di matrice:
  - `Autisti Inbox / Admin` esce dal backlog non chiuso del loop;
  - il prossimo modulo del tracker e `Manutenzioni`.

## Aggiornamento operativo 2026-03-31 - Loop fermato su `Manutenzioni`
- Fonti del ciclo:
  - analisi/backlog: `docs/audit/BACKLOG_manutenzioni.md`
  - audit preliminare: `docs/audit/AUDIT_manutenzioni_LOOP.md`
- Stato modulo nel loop:
  - `Manutenzioni` -> `APERTO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/manutenzioni` monta una pagina NEXT vera, ma ancora clone-specifica;
  - `src/next/NextManutenzioniPage.tsx` usa `NextClonePageScaffold` e non replica la superficie madre su form, inventario, movimenti, gomme e PDF;
  - il gap con `src/pages/Manutenzioni.tsx` e troppo ampio per un micro-passaggio onesto nel budget residuo.
- Conseguenza di matrice:
  - il loop si ferma su `Manutenzioni`;
  - il prossimo modulo da affrontare resta `Manutenzioni`.

## Aggiornamento operativo 2026-03-31 - Loop `Manutenzioni` chiuso con audit PASS
- Fonti del ciclo:
  - execution: `docs/audit/BACKLOG_manutenzioni.md`
  - audit: `docs/audit/AUDIT_manutenzioni_LOOP.md`
- Stato modulo nel loop:
  - `Manutenzioni` -> `CHIUSO`
- Fatti verificati nel codice:
  - la route ufficiale `/next/manutenzioni` monta `NextManutenzioniPage`, non la madre;
  - il runtime ufficiale replica la stessa UI pratica della madre su form, materiali, storico, filtri, modal gomme e CTA principali;
  - il reader ufficiale usa `readNextManutenzioniWorkspaceSnapshot()` per `@manutenzioni` / `@mezzi_aziendali` e `readNextInventarioSnapshot({ includeCloneOverlays: false })` per `@inventario`;
  - il runtime ufficiale non usa piu `NextClonePageScaffold`, writer locali, `setItemSync`, `getItemSync` o export PDF locale;
  - `Salva manutenzione`, `Elimina`, `Esporta PDF` e la conferma del modal gomme restano visibili ma bloccano il comportamento in modo esplicito.
- Conseguenza di matrice:
  - `Manutenzioni` esce dal backlog non chiuso del loop;
  - tutti i moduli del tracker corrente risultano `CLOSED`;
  - loop modulo-per-modulo completato; consigliato audit finale globale separato.
