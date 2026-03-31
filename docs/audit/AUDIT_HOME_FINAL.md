# AUDIT HOME FINAL

## FILE LETTI
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/AUDIT_HOME_POST_EXECUTION.md`
- `docs/audit/BACKLOG_HOME_EXECUTION.md`
- `docs/change-reports/2026-03-30_1958_home-next-readonly-parity.md`
- `docs/continuity-reports/2026-03-30_1958_continuity_home-next-readonly-parity.md`
- `docs/change-reports/2026-03-30_2036_home-fix-suggestioni-autista.md`
- `docs/continuity-reports/2026-03-30_2036_continuity_home-fix-suggestioni-autista.md`
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/nextDateFormat.ts`
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/components/AutistiEventoModal.tsx`

## VERDETTO INIZIALE
- `APERTO`
- Motivo iniziale documentato prima di questo audit finale:
  - audit post execution ancora negativo per il gap sulle suggestioni autista;
  - report 2036 che dichiarano gap risolto ma senza audit finale separato.

## VERIFICA SU CODICE REALE
- FATTO VERIFICATO:
  - la route ufficiale `/next` monta `src/next/NextHomePage.tsx`, che a sua volta monta `src/next/NextCentroControlloPage.tsx`;
  - in `src/App.tsx` non ci sono mount finali di `NextMotherPage`, `src/pages/Home.tsx` o `src/pages/CentroControllo.tsx` sulla route `/next`.
- FATTO VERIFICATO:
  - `src/next/NextCentroControlloPage.tsx` costruisce ora le suggestioni autista solo da `sessioni` e `mezzi`;
  - il contributo `autistiSnapshot.assignments` non e piu nel path runtime della `Home`.
- FATTO VERIFICATO:
  - `src/next/domain/nextCentroControlloDomain.ts` legge i dataset reali `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`;
  - la lettura passa da `readNextUnifiedStorageDocument()` e usa i `rawDocument` reali, non overlay locali della `Home`.
- FATTO VERIFICATO:
  - quicklinks e reminder del modal dati mancanti restano in `localStorage`, ma con le stesse chiavi della madre (`gm_quicklinks_favs_v1`, `gm_dossier_missing_alert_v1`);
  - questo non e un overlay clone-only della `Home`.
- FATTO VERIFICATO:
  - le scritture business che la madre esegue davvero su `@mezzi_aziendali`, `@storico_eventi_operativi` e `@alerts_state` non vengono replicate nel clone;
  - il clone blocca in modo esplicito salvataggi revisione, prenotazione collaudo, pre-collaudo, luogo rimorchio, cancellazione prenotazione e azioni alert.

## GAP REALI RESIDUI
- `NextHomeAutistiEventoModal.tsx` non replica la superficie madre del modal eventi in modo 1:1:
  - la madre mostra CTA vere `CREA LAVORO` e `IMPORTA IN DOSSIER`;
  - la NEXT sostituisce queste CTA con testo read-only o con il solo bottone `APRI DETTAGLIO CLONE`.
- `NextCentroControlloPage.tsx` non replica i testi visibili dei tre modali data della madre:
  - placeholder NEXT: `gg mm aaaa`;
  - placeholder madre: `gg mm aaaa oppure YYYY-MM-DD`;
  - stesso delta sui messaggi di validazione data.
- Questi sono gap reali e visibili della UI pratica; quindi la parity esterna della `Home` non e piena.

## GAP RISOLTI DAVVERO
- route `/next` senza runtime finale madre;
- rimozione del vecchio gap sulle suggestioni autista;
- rimozione degli overlay clone-only locali della `Home` su alert, mezzi ed eventi;
- rimozione del pannello extra non madre `D03 autisti`;
- lettura dei dataset reali della madre tramite layer NEXT D10;
- blocco scritture totale, esplicito e coerente col contratto read-only.

## COME LEGGE I DATI REALI
- Madre:
  - `src/pages/Home.tsx` legge direttamente con `getItemSync()` i dataset `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@alerts_state`.
- NEXT:
  - `src/next/domain/nextCentroControlloDomain.ts` legge gli stessi dataset tramite `readNextUnifiedStorageDocument()`;
  - `src/next/domain/nextUnifiedReadRegistryDomain.ts` apre i documenti reali e passa il `rawDocument` al builder D10;
  - `src/next/NextCentroControlloPage.tsx` consuma solo lo snapshot D10.
- Nota audit:
  - `src/next/domain/nextAutistiDomain.ts` contiene ancora overlay locali e fallback legacy opzionali, ma non e nel runtime ufficiale della route `/next`.

## COME SONO BLOCCATE LE SCRITTURE
- In `src/next/NextCentroControlloPage.tsx`:
  - `handlePrenotazioneSave()` blocca la registrazione prenotazione collaudo;
  - `handlePreCollaudoSave()` blocca la programmazione pre-collaudo;
  - `handleRevisioneSave()` blocca la chiusura revisione;
  - `saveRimorchioEdit()` blocca l'aggiornamento luogo rimorchio;
  - `handleAlertAction()` blocca ack e snooze degli alert.
- In `src/next/components/NextHomeAutistiEventoModal.tsx`:
  - `CREA LAVORO` non e operativa;
  - `IMPORTAZIONE IN DOSSIER` non e operativa;
  - PDF, foto e apertura dettaglio clone restano leggibili.

## COME VERIFICARE
1. Aprire `/next` e confermare che la route usa la pagina NEXT e non la madre.
2. Nel campo ricerca autista, verificare che le suggestioni derivino da `sessioni` e `mezzi`.
3. Aprire un evento autista di tipo `segnalazione` o `controllo`:
   - nella madre si vedono CTA `CREA LAVORO`;
   - nella NEXT si vede testo read-only oppure `APRI DETTAGLIO CLONE`.
4. Aprire i modali `Prenotazione collaudo`, `Programmazione Pre-collaudo`, `Segna revisione fatta`:
   - confrontare placeholder e messaggi data tra madre e NEXT;
   - in NEXT il salvataggio deve essere bloccato con alert read-only.
5. Verificare che quicklinks e reminder dati mancanti usino le stesse chiavi locali della madre.

## STATO FINALE DEL MODULO
- `APERTO`

## MOTIVAZIONE FINALE IN MASSIMO 6 RIGHE
- La `Home` NEXT non monta piu la madre, legge gli stessi dataset reali e non usa piu overlay clone-only locali.
- Le suggestioni autista sono ora allineate alla madre.
- Il blocco scritture e totale, esplicito e coerente col contratto read-only.
- Restano pero differenze visibili reali nei modali della `Home`:
- il modal eventi non replica 1:1 le CTA madre e i modali data non replicano placeholder e validazione visibile.
- Per questo il modulo resta `APERTO`, non `DA VERIFICARE`.
