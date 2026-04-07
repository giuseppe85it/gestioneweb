# Change Report - 2026-04-07 13:13

## Task
Riallineamento solo UI/layout della vista interna `Mappa storico` del modulo `/next/manutenzioni`.

## Perimetro
- solo `src/next/NextManutenzioniPage.tsx`
- solo `src/next/NextMappaStoricoPage.tsx`
- solo `src/next/next-mappa-storico.css`
- aggiornamento tracker/documentazione clone

## Cosa e stato fatto
- compattato l'header del modulo quando la vista attiva e `Mappa storico`, lasciando tabs e selettore mezzo presenti ma secondari;
- ricostruita `NextMappaStoricoPage.tsx` come shell tecnica:
  - header specialistico superiore;
  - griglia principale a due colonne reali;
  - colonna sinistra focalizzata su scheda mezzo, viste e foto/placeholder dominante;
  - colonna destra focalizzata su ricerca, filtri, dettaglio zona e storico cronologico;
- riscritto `next-mappa-storico.css` con resa piu tecnica, piu scura e piu compatta, mantenendo solo classi `.ms-*`;
- corretto il layout host del modulo per fare occupare alla vista mappa tutta la larghezza disponibile ed eliminare la falsa colonna vuota.

## Cosa NON e stato toccato
- nessuna modifica a domain business;
- nessuna modifica a writer, shape dati o route;
- nessuna modifica a `cloneWriteBarrier.ts`;
- nessuna modifica a logica hotspot, ricerca, filtri, upload/storage o PDF;
- nessuna modifica alla madre legacy.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
- `npm run build` -> `OK`
- verifica runtime reale su `http://127.0.0.1:4173/next/manutenzioni`:
  - click `Mappa storico`
  - screenshot locale della vista
  - verifica DOM/layout:
    - shell `Mappa storico` full-width
    - griglia ~60/40 (`698px / 448px`)
    - superficie foto/placeholder dominante (`664px`)
    - nessun paragrafo descrittivo legacy residuo nel pannello zona

## Esito
- UI/layout riallineati al mockup in modo piu specialistico.
- Modulo `Manutenzioni` resta `PARZIALE`: il task era solo visuale.
