# Continuity Report - 2026-03-31 11:16 - IA Documenti loop fix

## Stato di partenza

- Tracker fermo su `IA Documenti`
- Gap reali aperti:
  - scaffold clone-specifico
  - archivio misto con overlay clone-only
  - save/import locali nel clone
  - parity esterna non ancora madre-like

## Stato di arrivo

- `IA Documenti` chiuso nel loop con audit `PASS`
- Route ufficiale NEXT autonoma e madre-like su `/next/ia/documenti`
- Reader dedicato per l'archivio reale dei documenti introdotto in `src/next/domain/nextDocumentiCostiDomain.ts`
- Nessun upload/save/import/update clone-only attivo nel runtime ufficiale

## File chiave da ricordare

- `src/next/NextIADocumentiPage.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/AUDIT_ia-documenti_LOOP.md`

## Verifiche gia eseguite

- `eslint` sui file runtime/domain del modulo: `OK`
- `npm run build`: `OK`

## Prossimo passo consigliato

Ripartire dal primo modulo non `CLOSED` del tracker:

- `IA Copertura Libretti`

## Limiti residui da non perdere

- La selezione del file resta solo locale come affordance UI, senza upload o salvataggi.
- La NEXT complessiva non e pronta a sostituire la madre.
- Restano warning build preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.
