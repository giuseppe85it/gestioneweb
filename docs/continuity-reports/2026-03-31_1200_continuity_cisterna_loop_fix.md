# Continuity Report - 2026-03-31 12:00 - Cisterna loop fix

## Stato di partenza

- Tracker fermo su `Cisterna` come primo modulo non `CLOSED`
- Gap reali aperti:
  - scaffold clone-specifico
  - writer locale sul cambio EUR->CHF
  - export PDF locale
  - overlay clone-only nel reader ufficiale
  - superficie archivio/report/targhe non ancora madre-like piena

## Stato di arrivo

- `Cisterna` chiuso nel loop con audit `PASS`
- Route ufficiale NEXT autonoma e madre-like su `/next/cisterna`
- Reader ufficiale ripulito da documenti, schede e parametri clone-only nel percorso usato dalla route
- Nessun save/export/edit/confirm clone-only attivo nel runtime ufficiale

## File chiave da ricordare

- `src/next/NextCisternaPage.tsx`
- `src/next/domain/nextCisternaDomain.ts`
- `docs/audit/TRACKER_NEXT_CLONE_LOOP.md`
- `docs/audit/AUDIT_cisterna_LOOP.md`

## Verifiche gia eseguite

- `eslint` sui file runtime/domain del modulo: `OK`
- `npm run build`: `OK`

## Prossimo passo consigliato

Ripartire dal primo modulo non `CLOSED` del tracker:

- `Cisterna IA`

## Limiti residui da non perdere

- La chiusura vale solo per il modulo `Cisterna`; `Cisterna IA` e `Cisterna Schede Test` restano fuori da questo run.
- La NEXT complessiva non e pronta a sostituire la madre.
- Restano warning build preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.
