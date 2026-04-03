# Change Report - 2026-04-03 13:26

## Obiettivo
Chiudere solo il delta visivo reale della tab `Ordine materiali` tra `/acquisti` e `/next/materiali-da-ordinare`, usando il runtime browser del 3 aprile 2026 come fonte di prova e senza toccare dati, writer, route o altre tab.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/next-procurement-route.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- `NextMaterialiDaOrdinarePage.tsx`
  - riallineata la struttura `Ordine materiali` al wrapper madre `om-wrap` / `om-content`;
  - rimosse dal footer le CTA di navigazione extra verso altre tab;
  - mantenuti microcopy madre `AGGIUNGI` e `Mostra dettagli`;
  - sostituite le azioni riga sempre visibili con il menu kebab madre-like sulla colonna `Azioni`;
  - riallineata l'etichetta KPI a `Totale parziale` quando il totale non e completo.
- `next-procurement-route.css`
  - riportata la palette dei pulsanti al tema embedded della madre per il ramo `Ordine materiali`.

## Layer dati preservato
- Non toccati:
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/NextProcurementConvergedSection.tsx`
  - `src/next/domain/nextProcurementDomain.ts`
- Confermate come uniche sorgenti dati:
  - `readNextFornitoriSnapshot()`
  - `readNextProcurementSnapshot()`
- Non reintrodotti:
  - `storageSync`
  - letture raw legacy
  - mount runtime di `src/pages/*`

## Esito
- `PATCH COMPLETATA` sul solo ramo `Ordine materiali`.
- Verifica runtime finale su browser headless locale: shell UI visibile `UGUALE` alla madre nella tab auditata.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextMaterialiDaOrdinarePage.tsx` -> `OK`
- `node_modules\\.bin\\eslint.cmd src/next/next-procurement-route.css` -> file ignorato da ESLint per assenza config CSS
- `npm run build` -> `OK`
- confronto browser locale con screenshot di `/acquisti` e `/next/materiali-da-ordinare` sulla sola tab `Ordine materiali` -> `OK`
