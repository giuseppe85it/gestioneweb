# Change Report — Dossier Mezzo: Flusso Fattura → Manutenzione

**Data:** 2026-04-11
**Tipo:** patch — nuova capability write

## Riepilogo

Implementazione completa del flusso "Fattura → Manutenzione" nel Dossier Mezzo NEXT.
Ogni riga fattura espone un bottone "Crea manutenzione" → modal con parsing IA del PDF →
ReviewUI con campi editabili → salvataggio manutenzione reale con `sourceDocumentId`.
Dopo il salvataggio: badge "✓ Manutenzione collegata" (anti-duplicazione).

## File toccati

- `src/next/domain/nextManutenzioniDomain.ts` — `sourceDocumentId` a 4 punti
- `src/next/domain/nextManutenzioniGommeDomain.ts` — `sourceDocumentId?` nei tipi view
- `src/next/domain/nextDossierMezzoDomain.ts` — nuova `hasLinkedManutenzione`
- `src/next/NextEuromeccPage.tsx` — `callPdfAiEnhance` resa `export`
- `src/next/NextDossierFatturaToManutenzioneModal.tsx` — nuovo file
- `src/next/NextDossierMezzoPage.tsx` — bottone/badge + mount modal
- `src/utils/cloneWriteBarrier.ts` — deroga Dossier

## Stato

- `npm run build` → OK
- Verifica runtime su dati live: DA VERIFICARE
