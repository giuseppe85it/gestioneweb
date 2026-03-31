# Change Report - Loop `Dossier Lista` (`2026-03-31 08:00`)

## Obiettivo
Chiudere il modulo `Dossier Lista` della NEXT sulla route `/next/dossiermezzi` come clone fedele read-only della madre.

## File letti
- `src/App.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextStructuralPaths.ts`
- `src/pages/DossierLista.tsx`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/BACKLOG_dossier-lista.md`
- `docs/audit/AUDIT_dossier-lista_LOOP.md`

## Patch applicate
- `NextDossierListaPage` dichiara in modo esplicito la lettura D01 senza patch locali: `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`.
- Il click sulle card mezzo usa ora il percorso NEXT madre-like `/next/dossiermezzi/:targa`, mantenendo il flusso lista -> dettaglio coerente con la madre.
- Nessuna scrittura, nessun overlay locale e nessun runtime legacy sono stati introdotti nel modulo.

## Verifiche eseguite
- `npx eslint src/next/NextDossierListaPage.tsx` -> OK

## Esito operativo
- Il modulo `Dossier Lista` passa da `NOT_STARTED` a `CLOSED` nel tracker.
- L'audit separato del modulo risulta `PASS`.
- Il prossimo modulo non `CLOSED` del loop diventa `Dossier Mezzo`.
