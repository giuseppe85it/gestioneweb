# Change Report - 2026-04-09 13:49:12

## Task
PROMPT 30 - ripristino viste tecniche `Sinistra / Destra` nel `Dettaglio` di `Manutenzioni` NEXT e aggiunta ricerca rapida `targa / autista` nel `Quadro manutenzioni PDF`.

## Perimetro
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- documentazione di stato/contesto clone

## Modifiche runtime
- Il ramo `embedded` di `NextMappaStoricoPage` usa di nuovo `resolveNextManutenzioneTechnicalView(...)` per mostrare la tavola tecnica corretta da `public/gomme/*` in base alla categoria del mezzo.
- Nel dettaglio embedded restano solo le tab `Sinistra` e `Destra`; `Fronte` e `Retro` non compaiono piu nel runtime usato da `Manutenzioni`.
- Il viewer embedded resta pulito:
  - nessun ritorno di `Calibra`
  - nessun marker
  - nessun overlay
  - nessun drag o salvataggio tecnico
- Il `Quadro manutenzioni PDF` espone ora uno `Step 3` con input visibile `Filtra per targa o autista`, che restringe i risultati mostrati nel quadro.

## Modifiche CSS
- La griglia `man2-pdf-steps` supporta ora 3 blocchi visibili senza comprimere il layout.
- Aggiunto styling dedicato all'immagine del viewer embedded per rendere leggibile la tavola tecnica.

## Verifiche
- `npx eslint src/next/NextMappaStoricoPage.tsx src/next/NextManutenzioniPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> OK
- `npm run build` -> OK

## Esito
- Patch runtime completata nel perimetro consentito.
- Nessuna modifica a madre, Euromecc, backend/rules, PDF engine globale o logica `Calibra`.
- Warning residui build: chunk size grande e doppio uso di `jspdf`/`jspdf-autotable`; warning ESLint esterno su `baseline-browser-mapping` datato.
