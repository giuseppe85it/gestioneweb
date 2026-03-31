# AUDIT FINALE GLOBALE NEXT POST LOOP

- Timestamp audit: `2026-03-31 15:28 Europe/Rome`
- Modalita: audit puro, avversariale e separato
- Scope: verifica finale del perimetro NEXT dopo il loop modulo-per-modulo
- Verdetto finale: `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Fonti lette
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- tutti i backlog e audit loop dei moduli chiusi dal tracker, da `Home` a `Manutenzioni`

## Tracker letto e stato iniziale
- File letto: `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- Stato iniziale rilevato nel file:
  - ultimo aggiornamento `2026-03-31 15:10 Europe/Rome`
  - tutti i moduli del tracker risultano `CLOSED`
  - nota finale del tracker: `loop modulo-per-modulo completato; consigliato audit finale globale separato`

## Verifica globale su codice reale
- `src/App.tsx` monta route ufficiali NEXT per tutti i moduli del tracker.
- I file madre non risultano toccati nel worktree:
  - `git status --short -- src/pages src/autisti src/autistiInbox` -> vuoto
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> vuoto
- I layer NEXT read-only usati dai moduli principali risultano presenti e, nei moduli campionati piu sensibili, le route ufficiali leggono davvero dati reali senza scritture business attive.
- Il controllo avversariale ha pero trovato un blocco grave che smentisce la chiusura del tracker:
  - il gruppo `Autisti` e marcato `CLOSED`, ma il flusso ufficiale NEXT continua a uscire verso route madre `/autisti/*`.

## Evidenza grave confermata

### Modulo `Autisti`
- Route ufficiali NEXT montate in `src/App.tsx`:
  - `/next/autisti`
  - `/next/autisti/login`
  - `/next/autisti/home`
  - `/next/autisti/setup-mezzo`
  - `/next/autisti/cambio-mezzo`
  - `/next/autisti/controllo`
  - `/next/autisti/rifornimento`
  - `/next/autisti/richiesta-attrezzature`
  - `/next/autisti/segnalazioni`
- Wrapper NEXT effettivamente montati:
  - `src/next/NextAutistiLoginPage.tsx`
  - `src/next/NextAutistiSetupMezzoPage.tsx`
  - `src/next/NextAutistiHomePage.tsx`
- Runtime reali letti:
  - `src/next/autisti/NextLoginAutistaNative.tsx`
  - `src/next/autisti/NextSetupMezzoNative.tsx`
  - `src/next/autisti/NextHomeAutistaNative.tsx`
- Contraddizione dimostrata nel codice:
  - `NextLoginAutistaNative.tsx` naviga a `"/autisti"` e `"/autisti/setup-mezzo"`
  - `NextSetupMezzoNative.tsx` naviga a `"/autisti"`
  - `NextHomeAutistaNative.tsx` naviga a `"/autisti/login"`, `"/autisti/setup-mezzo"`, `"/autisti/rifornimento"`, `"/autisti/segnalazioni"`, `"/autisti/richiesta-attrezzature"` e `"/autisti/cambio-mezzo"`
- Conseguenza:
  - il runtime ufficiale `/next/autisti/*` non resta confinato al perimetro NEXT;
  - il flusso reale scarica ancora sulla madre;
  - la condizione meccanica di chiusura modulo in `AGENTS.md` non e soddisfatta.

## Rischi incrociati aggiuntivi osservati
- `src/next/NextLegacyStorageBoundary.tsx` continua a costruire override legacy-shaped usando reader con overlay di default e `readNextAutistiLegacyStorageOverrides()`.
- Questo non basta da solo a riaprire altri moduli, ma conferma che il boundary autisti resta delicato e non giustifica auto-certificazioni del tracker.

## Moduli che il tracker dichiara `CLOSED` ma che non risultano chiusi davvero
- `Autisti`
  - motivo: il flusso ufficiale NEXT continua a navigare verso route madre `/autisti/*`, quindi il runtime finale non resta autonomo NEXT.

## Madre toccata o no
- Madre non toccata.
- Nessuna modifica locale rilevata in `src/pages/**`, `src/autisti/**`, `src/autistiInbox/**`.

## Verdetto finale
- `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Motivazione finale
- Il tracker tutto `CLOSED` non regge al controllo sul codice reale.
- Il modulo `Autisti` risulta chiuso nel tracker ma non e chiuso davvero.
- Le route ufficiali `/next/autisti/*` montano wrapper NEXT, ma il flusso reale continua a navigare verso `/autisti/*`.
- Questo basta da solo a invalidare il verdetto globale.
- La madre risulta intoccata, quindi il problema non e una regressione della madre ma una falsa chiusura della NEXT.
- Prima di qualsiasi promozione della NEXT serve riaprire `Autisti`, correggere il flusso ufficiale e rieseguire un audit finale separato.
