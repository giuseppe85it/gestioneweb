# Change Report - 2026-04-09 13:02:52

## Task
PROMPT 28 - rimozione completa `Calibra` dal `Dettaglio` di `Manutenzioni` NEXT.

## Perimetro
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/next-mappa-storico.css`
- documentazione di stato/contesto clone

## Modifiche runtime
- Rimosso dal ramo `embedded` di `NextMappaStoricoPage` tutto il flusso `Calibra`.
- Eliminati bottone `Calibra`, modalita calibra, palette forme/target, pulsante `Salva`, marker tecnici, drag e reposition.
- Sostituito il viewer embedded con una vista statica pulita:
  - tab `Fronte / Sinistra / Destra / Retro`
  - foto/placeholder della vista attiva
  - box `Manutenzione selezionata` con data, tipo, assi, km e descrizione
- Aggiornata la copy del form in `NextManutenzioniPage` per riflettere il nuovo dettaglio.

## Cleanup domain
- Rimossi da `nextMappaStoricoDomain.ts`:
  - key clone-side `@mezzi_tecnico_target_overrides`
  - tipi override tecnici
  - reader/writer degli override

## Verifiche
- `npx eslint src/next/NextMappaStoricoPage.tsx src/next/NextManutenzioniPage.tsx src/next/domain/nextMappaStoricoDomain.ts` -> OK
- `npm run build` -> OK

## Esito
- Patch completata nel perimetro consentito.
- Nessuna modifica a madre, Euromecc, PDF, backend/rules o domain gomme/manutenzioni fuori whitelist.
