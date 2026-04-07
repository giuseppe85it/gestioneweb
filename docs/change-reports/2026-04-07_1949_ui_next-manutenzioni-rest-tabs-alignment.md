# Change Report - 2026-04-07 19:49

## Task
Riallineamento solo UI/layout dei tab `Dashboard`, `Storico`, `Nuova / Modifica` e `Quadro manutenzioni PDF` del modulo `/next/manutenzioni`.

## Perimetro
- solo `src/next/NextManutenzioniPage.tsx`
- solo `src/next/next-mappa-storico.css`
- aggiornamento tracker/documentazione clone

## Cosa e stato fatto
- `NextManutenzioniPage.tsx` usa ora una shell tecnica comune ai tab non-mappa:
  - `Dashboard tecnico manutenzioni` con KPI mezzo/compressore, blocchi area e azioni rapide;
  - `Storico manutenzioni` con card cronologiche premium e badge visivi (`Mezzo`, `Compressore`, `Tagliando`, `Derivato`);
  - `Nuova / Modifica` con gerarchia piu leggibile fra campi base, tagliando, materiali, descrizione e blocco visuale 4 foto;
  - nuovo tab interno `Quadro manutenzioni PDF` con doppio filtro `Soggetto` / `Periodo`, lista risultati impaginata e cronologia completa sotto.
- Nel modulo compare ora una `Ricerca mezzo rapida` con preview reale di:
  - targa
  - marca/modello
  - autista solito
- `next-mappa-storico.css` ospita anche il pacchetto `.mx-*` per la shell premium dei tab non-mappa, senza toccare il design system globale.

## Cosa NON e stato toccato
- nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`
- nessuna modifica a `src/next/domain/nextMappaStoricoDomain.ts`
- nessuna modifica a `src/utils/cloneWriteBarrier.ts`
- nessuna modifica a writer business, upload/storage logic, route, PDF engine o madre legacy

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx` -> `OK`
- `npm run build` -> `OK`
- verifica runtime reale su `http://127.0.0.1:4173/next/manutenzioni`:
  - `Dashboard` visibile con `5` KPI, `4` blocchi area e timeline tecnica;
  - `Ricerca mezzo rapida` con query `TI1` -> `4` risultati, primo risultato `TI178456 ... Autista solito: ORLANDO BUTTI`;
  - `Storico` con card cronologiche e badge visivi;
  - `Nuova / Modifica` con blocco `Tagliando completo`, materiali e `8` card foto complessive tra main + sidebar;
  - `Quadro manutenzioni PDF` con `Step 1`, `Step 2`, `14` card risultati e cronologia completa dopo filtro `Tutto`.

## Esito
- I tab non-mappa sono ora coerenti con la grammatica premium/tecnica della `Mappa storico`.
- Il modulo `Manutenzioni` resta `PARZIALE`: il task e solo UI e non cambia il perimetro business.
