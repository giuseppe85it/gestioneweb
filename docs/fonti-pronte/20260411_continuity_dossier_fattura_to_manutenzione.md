# Continuity Report — Dossier Mezzo: Flusso Fattura → Manutenzione

**Data:** 2026-04-11

## Completato

- Tutti i file runtime compilano (`npm run build` → OK)
- `sourceDocumentId` propagato lungo l'intera catena
- `NextDossierFatturaToManutenzioneModal.tsx` creato
- Deroga `cloneWriteBarrier.ts` per percorsi Dossier
- Documentazione aggiornata e mirrored

## DA VERIFICARE

- Verifica runtime end-to-end su dati live
- Comportamento fallback quando `fattura.fileUrl` è null
- Comportamento fallback quando l'IA fallisce

## Punti di attenzione

- `callPdfAiEnhance` importata da `NextEuromeccPage`: se rimossa rompe il modal
- `persistLegacyMaterialEffects` scrive sempre `@inventario` e `@materialiconsegnati` → incluse nella deroga
- `sourceDocumentId` opzionale in `NextManutenzioneReadOnlyItem` per compatibilità con `NextManutenzioniPage.tsx`
