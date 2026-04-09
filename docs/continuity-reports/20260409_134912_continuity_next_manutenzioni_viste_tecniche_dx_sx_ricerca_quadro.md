# Continuity Report - 2026-04-09 13:49:12

## Stato iniziale
- Dopo la rimozione di `Calibra`, il ramo embedded del `Dettaglio` di `/next/manutenzioni` non mostrava piu la tavola tecnica da `public/gomme/*`.
- Il runtime del dettaglio esponeva ancora le tab `Fronte / Sinistra / Destra / Retro`.
- Nel `Quadro manutenzioni PDF` mancava un filtro rapido e visibile per `targa` e `autista`.

## Stato finale
- Il ramo embedded del `Dettaglio` usa di nuovo il mapping tecnico gia esistente per mostrare la tavola del mezzo da `public/gomme/*`.
- Nel dettaglio embedded restano solo `Sinistra` e `Destra`.
- Il viewer embedded resta puramente visivo e non reintroduce `Calibra`.
- Il quadro PDF ha ora una ricerca rapida visibile per `targa / autista`.

## File di continuita
- `src/next/NextMappaStoricoPage.tsx`: viewer embedded riallineato alla tavola tecnica e tab ridotte a `Sinistra / Destra`.
- `src/next/NextManutenzioniPage.tsx`: filtro rapido dedicato nel quadro PDF e copy del form aggiornata.
- `src/next/next-mappa-storico.css`: layout step quadro adattato e immagine viewer trattata.

## Verifiche eseguite
- ESLint mirato: OK
- Build root: OK

## Rischi residui
- Il ramo standalone di `NextMappaStoricoPage` conserva la propria logica hotspot/foto e non e stato rifatto.
- Il modulo `Manutenzioni` resta `PARZIALE` e richiede ancora audit separato prima di ogni promozione di stato.
- Restano warning build preesistenti su chunk size e doppio uso di `jspdf`/`jspdf-autotable`.
