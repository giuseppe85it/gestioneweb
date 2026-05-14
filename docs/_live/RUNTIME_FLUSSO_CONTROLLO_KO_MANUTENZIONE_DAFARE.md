# FLUSSO RUNTIME: CONTROLLO KO -> MANUTENZIONE DA FARE

> Documento operativo per gate manuale runtime futuro.
> Generato post-fix PROMPT 28.
> Riferimento: dismissione Lavori NEXT chiusa 2026-05-13.

## SCENARIO

Un autista esegue un controllo mezzo via app e segnala una o piu anomalie (controllo "KO"). L'admin deve trasformarlo in una manutenzione da fare nella NEXT.

## STEP 1 - Autista invia controllo KO

File: `src/autisti/ControlloMezzo.tsx:84`

Collection/storage key Firestore: `@controlli_mezzo_autisti`

Scrittura del controllo: `src/autisti/ControlloMezzo.tsx:98` legge lo storico, `src/autisti/ControlloMezzo.tsx:119` salva con `setItemSync(CONTROLLI_KEY, storico)`.

Campi rilevanti scritti dal form:
- `id`
- `autistaNome`
- `badgeAutista`
- `targaCamion`
- `targaRimorchio`
- `target`
- `check`
- `note`
- `obbligatorio`
- `timestamp`

Un controllo e considerato KO quando almeno una voce di `check` vale `false`.

## STEP 2 - Admin vede il controllo KO

Pagina operativa: `/next/autisti-admin`

File: `src/next/autistiInbox/NextAutistiAdminNative.tsx`

La pagina legge `@controlli_mezzo_autisti` e costruisce la lista controlli. La sezione controlli e selezionabile dal tab `controlli`; le righe KO sono separate in `ESITI KO`.

Pulsante visibile per ogni controllo: `CREA MANUTENZIONE`.

Riferimenti:
- handler controllo: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540`
- chiamata writer: `src/next/autistiInbox/NextAutistiAdminNative.tsx:1549`
- click pulsante: `src/next/autistiInbox/NextAutistiAdminNative.tsx:2663`
- label pulsante: `src/next/autistiInbox/NextAutistiAdminNative.tsx:2665`

Nota: `/next/autisti-inbox` mostra la vista inbox/eventi e il dettaglio evento; la trasformazione amministrativa massiva dei controlli KO vive in `/next/autisti-admin`.

## STEP 3 - Admin clicca "Crea manutenzione"

Pulsante: `src/next/autistiInbox/NextAutistiAdminNative.tsx:2663`

Handler chiamato: `createManutenzioneDaFareAdminFromControllo(record)` in `src/next/autistiInbox/NextAutistiAdminNative.tsx:1540`.

Il handler:
- blocca il doppio collegamento se `linkedLavoroId` o `linkedLavoroIds` sono gia presenti;
- chiede conferma con `window.confirm`;
- chiama `createManutenzioneDaFareFromControllo(record)`;
- rilegge `@controlli_mezzo_autisti`;
- propone l'apertura del dettaglio manutenzione in `/next/manutenzioni?recordId=...&targa=...`.

## STEP 4 - Writer scrive @manutenzioni

Writer: `createManutenzioneDaFareFromControllo` in `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:307`.

Record scritto in `@manutenzioni`:
- `id`: generato dal writer, non `from-controllo-*`;
- `stato`: `"daFare"`;
- `tipo`: `"mezzo"`;
- `origineTipo`: `"controllo"`;
- `origineRefId`: id del controllo originale;
- `origineRefKey`: `"@controlli_mezzo_autisti"`;
- `urgenza`: `"alta"` se ci sono piu KO o se `obbligatorio === true`, altrimenti `"media"`;
- `segnalatoDa`: autista/badge del controllo;
- `targa`: derivata da `target`, `targaCamion`, `targaMotrice`, `targaRimorchio`;
- `descrizione`: `Controllo KO: ...` con elenco dei check falliti.

Riferimenti:
- key origine controlli: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:13`
- origine key da tipo controllo: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:90`
- export writer controllo: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:307`
- origineRefKey controllo: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:361`
- patch source controllo: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:370`

## STEP 5 - Backlink scritto sul controllo origine

Record aggiornato: `@controlli_mezzo_autisti/{idControllo}`

Campo scritto:
- `linkedLavoroId = idManutenzione` se il controllo genera una sola manutenzione;
- `linkedLavoroIds = [idManutenzione1, ...]` se il controllo genera piu manutenzioni.

Riferimenti:
- `patchControllo`: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:153`
- `linkedLavoroIds`: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:167`
- `linkedLavoroId`: `src/next/writers/nextManutenzioneDaFareCreateWriter.ts:170`

Nota J.7: il nome campo resta `linkedLavoroId` / `linkedLavoroIds`, ma dopo la dismissione il valore punta a una manutenzione `@manutenzioni`.

## STEP 6 - Giuseppe vede la nuova manutenzione daFare

- `/next`: card `Manutenzioni da fare`, letta da `readNextManutenzioniDaFareSnapshot()` in `src/next/NextHomePage.tsx:17` e renderizzata come card a `src/next/NextHomePage.tsx:639`.
- `/next/manutenzioni`: tab `Da fare`, definito in `src/next/NextManutenzioniPage.tsx:3613` e renderizzato da `src/next/NextManutenzioniPage.tsx:2415`.
- `/next/centro-controllo`: KPI `Manutenzioni urgenti`, `src/next/components/NextCentroControlloSinottica.tsx:1527`.
- `/next/dossier-mezzo/<targa>`: sezione `Da fare`, `src/next/NextDossierMezzoPage.tsx:552`.

## STEP 7 - Apertura record con tracciabilita origine

Da Home, Manutenzioni o Dossier, il record apre:

`/next/manutenzioni?recordId=<idManutenzione>&targa=<targa>`

Nel tab Dettaglio, se sono presenti `origineRefKey` e `origineRefId`, viene mostrato il pannello `Origine manutenzione` con pulsante `Vedi controllo`.

Riferimenti:
- label `Vedi controllo`: `src/next/NextManutenzioniPage.tsx:3482`
- pannello origine: `src/next/NextManutenzioniPage.tsx:3488`
- modale origine read-only: `src/next/NextManutenzioniPage.tsx:3517`

## CHECKLIST GATE MANUALE QUANDO AVRAI IL PRIMO CONTROLLO KO

- [ ] Vai a `/next/autisti-admin`.
- [ ] Apri il tab `Controlli`.
- [ ] Trova il controllo nella colonna `ESITI KO`.
- [ ] Clicca `CREA MANUTENZIONE`.
- [ ] Conferma il dialog.
- [ ] Verifica feedback: alert di creazione oppure proposta di apertura dettaglio.
- [ ] Vai a `/next`: card `Manutenzioni da fare` aggiornata.
- [ ] Vai a `/next/manutenzioni` tab `Da fare`: nuova riga visibile.
- [ ] Clicca la riga: si apre il dettaglio con `recordId`.
- [ ] Clicca `Vedi controllo`: modale read-only con dati del controllo originale.
- [ ] Verifica in Firebase Console: `@manutenzioni` contiene record nuovo con `stato="daFare"` e `origineTipo="controllo"`.
- [ ] Verifica in Firebase Console: `@controlli_mezzo_autisti` record originale contiene `linkedLavoroId` o `linkedLavoroIds`.

## NOTE

- Il flusso da segnalazione funziona in modo analogo, usando `createManutenzioneDaFareFromSegnalazione` e `@segnalazioni_autisti_tmp`.
- Se al click `CREA MANUTENZIONE` il pulsante e ancora disabilitato o appare un messaggio `Clone read-only`, il flusso non sta usando il writer NEXT corretto.
- Il flusso `/next/autisti-inbox` per dettaglio evento usa la modale NEXT sanificata post-PROMPT 28 per creare manutenzioni da evento senza passare dalla modale madre.
