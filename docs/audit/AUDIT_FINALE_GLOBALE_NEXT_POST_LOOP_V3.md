# AUDIT FINALE GLOBALE NEXT POST LOOP V3

- Data audit: `2026-03-31 17:54 Europe/Rome`
- Tipo audit: `globale`, `avversariale`, `separato`, `solo codice reale`
- Ambito: perimetro target NEXT dopo i fix finali `Autisti`, `Autisti Inbox / Admin` e `Dossier Mezzo`
- Verdetto ufficiale attuale:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Fonti lette
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP.md`
- `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V2.md`
- `docs/audit/BACKLOG_autisti-inbox-admin.md`
- `docs/audit/AUDIT_autisti-inbox-admin_LOOP.md`
- tutti i `docs/audit/BACKLOG_*.md` e `docs/audit/AUDIT_*_LOOP.md` dei moduli oggi marcati `CLOSED`

## Stato iniziale del tracker
- File letto: `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- Ultimo aggiornamento rilevato: `2026-03-31 17:38 Europe/Rome`
- Stato iniziale dichiarato: tutti i moduli del tracker `CLOSED`

## Verifica globale su codice reale
- `src/App.tsx` monta effettivamente route NEXT ufficiali per il perimetro auditato.
- Il blocco storico `Autisti` risulta corretto: il runtime ufficiale non scarica piu su `/autisti/*`.
- Il blocco storico `Autisti Inbox / Admin` risulta corretto: i wrapper ufficiali non montano piu `NextLegacyStorageBoundary` e il boundary non reintroduce piu override `autisti` sulle route inbox/admin.
- Il blocco storico `Dossier Mezzo` risulta corretto: il composite ufficiale legge ora i movimenti materiali con `includeCloneOverlays: false`.
- La madre risulta intoccata nel worktree corrente:
  - `git status --short -- src/pages src/autisti src/autistiInbox` => vuoto
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox` => vuoto

## Blocco grave trovato nel codice reale
- Area coinvolta: route ufficiale NEXT `Gestione Operativa`
- Route ufficiale coinvolta:
  - `/next/gestione-operativa`
- Runtime finale verificato:
  - `src/next/NextGestioneOperativaPage.tsx`
  - `src/next/useNextOperativitaSnapshot.ts`
  - `src/next/domain/nextOperativitaGlobaleDomain.ts`
  - `src/next/domain/nextInventarioDomain.ts`
  - `src/next/domain/nextMaterialiMovimentiDomain.ts`
  - `src/next/domain/nextProcurementDomain.ts`

### Evidenza tecnica
- `src/App.tsx` monta davvero `/next/gestione-operativa` su `NextGestioneOperativaPage`.
- `src/next/NextGestioneOperativaPage.tsx` legge lo snapshot ufficiale tramite `useNextOperativitaSnapshot()`.
- `src/next/useNextOperativitaSnapshot.ts` chiama `readNextOperativitaGlobaleSnapshot()`.
- `src/next/domain/nextOperativitaGlobaleDomain.ts` chiama ancora senza opzioni:
  - `readNextInventarioSnapshot()`
  - `readNextMaterialiMovimentiSnapshot()`
  - `readNextProcurementSnapshot()`
- I domain condivisi usano ancora default permissivi:
  - `src/next/domain/nextInventarioDomain.ts` => `includeCloneOverlays ?? true`
  - `src/next/domain/nextMaterialiMovimentiDomain.ts` => `includeCloneOverlays ?? true`
  - `src/next/domain/nextProcurementDomain.ts` => `includeCloneOverlays ?? true`
- `src/next/domain/nextMaterialiMovimentiDomain.ts` fonde esplicitamente `rawItems` con `cloneRecords` e `deletedIds` quando il chiamante non spegne gli overlay.
- Il risultato non resta interno:
  - `src/next/NextGestioneOperativaPage.tsx` rende davvero badge e preview ufficiali con `snapshot.inventario` e `snapshot.materialiMovimenti`, quindi la route pubblica puo mostrare dati clone-local.

### Impatto sul verdetto
- Anche con tracker tutto `CLOSED`, il codice reale mostra ancora un percorso ufficiale NEXT che puo integrare overlay clone-only nei dati visibili.
- Questo basta a far fallire il criterio globale:
  - non e dimostrata l'assenza di overlay locali su tutta la superficie ufficiale NEXT;
  - quindi la NEXT non e ancora promuovibile a clone lavorabile in autonomia.

## Moduli dichiarati `CLOSED` dal tracker ma non chiusi davvero
- Nessuno dei moduli del tracker oggi verificati riapre un falso `CLOSED` dopo i fix finali.
- Resta pero un blocco grave extra-tracker su una route ufficiale NEXT: `Gestione Operativa`.

## Madre toccata o no
- `NO`

## Verdetto finale
- `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Motivazione finale secca
- I fix finali di `Autisti`, `Autisti Inbox / Admin` e `Dossier Mezzo` reggono nel codice reale.
- Il tracker tutto `CLOSED` non basta comunque a promuovere la NEXT.
- La route ufficiale `/next/gestione-operativa` usa ancora snapshot condivisi con default overlay permissivi.
- Quegli overlay possono entrare in badge e preview visibili del runtime ufficiale.
- Quindi l'assenza di dati clone-only sull'intero perimetro ufficiale NEXT non e ancora dimostrata.
- Basta questo singolo blocco grave per mantenere il verdetto globale a `NO`.
