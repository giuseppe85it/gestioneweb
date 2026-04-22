# Change Report - 2026-04-21 18:52:49

## Titolo
Manutenzioni NEXT - importo additivo, riga Dashboard arricchita, dettaglio materiali e link fattura

## Obiettivo
- salvare `importo` in `@manutenzioni` in modo additivo e opzionale;
- mostrare nella Dashboard `Ultimi interventi` un riassunto piu corto con officina e importo quando presenti;
- mostrare nel dettaglio embedded la lista materiali/ricambi e un link alla fattura originale solo quando il documento collegato espone un `fileUrl` reale.

## File toccati
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `CONTEXT_CLAUDE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Modifiche reali
1. Domain manutenzioni
- aggiunto `importo?: number | null` al payload business e al record legacy persistito;
- `sanitizeBusinessRecord()` salva `importo` come numero o `null`;
- il reader legacy arricchisce opzionalmente ogni record con:
  - `sourceDocumentFileUrl?: string | null`
  - `sourceDocumentCurrency?: "EUR" | "CHF" | "UNKNOWN" | null`
  derivandoli da `sourceDocumentId` contro `@documenti_mezzi`.

2. Dashboard manutenzioni
- la riga `Ultimi interventi` usa ora `buildDescrizioneSnippet(item.descrizione, 40)`;
- la meta riga mostra in sequenza solo i campi disponibili:
  - data
  - misura (`KM` / `ORE`)
  - fornitore
  - importo formattato con valuta documento se nota
  - sottotipo/fallback legacy

3. Dettaglio embedded
- `NextMappaStoricoPage` riceve dal parent anche:
  - `materiali`
  - `importo`
  - `fornitore`
  - `sourceDocumentId`
  - `sourceDocumentFileUrl`
- se i materiali esistono, appare la sezione `Materiali / ricambi`;
- se il documento sorgente ha un `fileUrl` reale, appare il bottone `Apri fattura`.

## Impatto
- additivo e opzionale;
- nessuna regressione attesa sui record esistenti senza `importo`, `materiali` o `sourceDocumentId`;
- nessun writer nuovo;
- nessuna modifica a barrier, routing, madre legacy o altri moduli.

## Verifiche eseguite
- `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> `OK` con warning noto `baseline-browser-mapping`
- `npm run build` -> `OK`

## Limiti noti
- la verifica browser del caso reale con manutenzioni che abbiano davvero `importo`, `materiali` e `sourceDocumentId` resta `DA VERIFICARE`.
