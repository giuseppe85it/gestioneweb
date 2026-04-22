# Continuity Report - 2026-04-21 18:52:49

## Contesto
Task eseguito: estensione additiva di `Manutenzioni` NEXT per salvare `importo` e mostrare nel runtime Dashboard/dettaglio materiali e link alla fattura originale.

## Stato finale verificato
- `nextManutenzioniDomain.ts`
  - salva `importo` nel record business;
  - continua a salvare `sourceDocumentId`;
  - arricchisce in lettura i record con `sourceDocumentFileUrl` e `sourceDocumentCurrency` se il documento `@documenti_mezzi` esiste.
- `NextManutenzioniPage.tsx`
  - la Dashboard `Ultimi interventi` usa titolo piu corto;
  - mostra officina e importo solo quando disponibili;
  - passa al dettaglio embedded i campi opzionali nuovi.
- `NextMappaStoricoPage.tsx`
  - mostra materiali solo se presenti;
  - mostra `Apri fattura` solo se esiste un `fileUrl` reale.

## Build e lint
- `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK`
- `npm run build` -> `OK`

## Dati/contratti da ricordare
- nuovi campi additivi sul record manutenzione runtime:
  - `importo?: number | null`
  - `sourceDocumentFileUrl?: string | null`
  - `sourceDocumentCurrency?: "EUR" | "CHF" | "UNKNOWN" | null`
- i record storici senza questi campi restano validi e non cambiano comportamento.

## Rischi residui
- manca test browser su dataset live con record che espongano davvero i nuovi campi;
- se `sourceDocumentId` punta a un documento senza `fileUrl`, il bottone `Apri fattura` non appare per design.

## Punto di ripartenza
- verificare in browser `/next/manutenzioni`:
  - Dashboard `Ultimi interventi`
  - dettaglio embedded di una manutenzione con materiali
  - presenza del bottone `Apri fattura` per una manutenzione con `sourceDocumentId` collegato a documento archiviato con `fileUrl`.
