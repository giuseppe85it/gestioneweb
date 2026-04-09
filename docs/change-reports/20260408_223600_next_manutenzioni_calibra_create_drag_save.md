# Change Report - 2026-04-08 22:36

## Obiettivo
- Correggere tre problemi runtime reali di `Manutenzioni` NEXT:
  - `Calibra` non ancora conforme al flusso create/place/drag/save;
  - doppione tra `Ultimo intervento mezzo` e `Ultime manutenzioni mezzo`;
  - rendere coerente la persistenza clone-side del viewer tecnico.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
- documentazione di stato clone/NEXT

## Modifiche applicate
- `NextManutenzioniPage.tsx`
  - La lista `ultimeManutenzioniMezzo` passata al `Dettaglio` viene ora deduplicata rispetto al record gia esposto nel box `Ultimo intervento mezzo`.
- `nextMappaStoricoDomain.ts`
  - Confermato e riusato il dataset clone-side `@mezzi_tecnico_target_overrides`.
  - Persistenza per `categoriaKey + vista + targetId + x + y`.
- `NextMappaStoricoPage.tsx`
  - In `Calibra` l’utente seleziona un target dalla palette.
  - Click sul disegno tecnico: crea/aggiorna una posizione bozza.
  - Drag di un marker gia presente: aggiorna la bozza.
  - Il bottone `Salva` persiste la nuova posizione.
  - Alla riapertura le coordinate vengono rilette e il marker torna nel punto salvato.
- `next-mappa-storico.css`
  - Styling di marker tecnici trascinabili e azioni di calibrazione.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> OK
- `npm run build` -> OK

## Rischi residui
- Gli override tecnici restano confinati al clone e non sono ancora un contratto condiviso lato business.
- La persistenza e per `categoria + vista + target`, quindi mezzi con stessa categoria condividono la calibrazione tecnica della tavola.
