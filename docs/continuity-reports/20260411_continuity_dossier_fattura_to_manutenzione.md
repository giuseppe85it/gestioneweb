# Continuity Report — Dossier Mezzo: Flusso Fattura → Manutenzione

**Data:** 2026-04-11
**Correlato a:** `docs/change-reports/20260411_dossier_fattura_to_manutenzione.md`

## Stato alla chiusura di questa sessione

### Completato
- Tutti i file runtime modificati e compilano senza errori (`npm run build` → OK)
- `sourceDocumentId` propagato lungo l'intera catena: payload → raw → HistoryItem → ReadOnlyItem → LegacyViewItem → DossierItem
- `NextDossierFatturaToManutenzioneModal.tsx` creato e funzionante strutturalmente
- Deroga `cloneWriteBarrier.ts` aggiunta per il perimetro Dossier
- Documentazione di stato aggiornata (`STATO_MIGRAZIONE_NEXT.md`, `REGISTRO_MODIFICHE_CLONE.md`)

### DA VERIFICARE (prossima sessione)
- Verifica runtime end-to-end: aprire `/next/dossiermezzi/:targa`, cliccare "Crea manutenzione", completare il flusso IA → ReviewUI → Salva, e verificare che la manutenzione appaia in `@manutenzioni` con `sourceDocumentId` corretto
- Verificare che dopo il salvataggio il badge "✓ Manutenzione collegata" sostituisca il bottone
- Verificare comportamento fallback quando `fattura.fileUrl` è null
- Verificare comportamento fallback quando l'IA fallisce (parsing JSON non valido)

## Punti di attenzione per ripresa

### `callPdfAiEnhance` riusata da Euromecc
`NextDossierFatturaToManutenzioneModal.tsx` importa `callPdfAiEnhance` da `NextEuromeccPage.tsx`.
La funzione esiste e funziona già nel contesto Euromecc. Se in futuro viene rimossa o rinominata,
il modal romperà la build.

### `persistLegacyMaterialEffects` e doppio write
`saveNextManutenzioneBusinessRecord` chiama sempre `persistLegacyMaterialEffects` che scrive
`@inventario` e `@materialiconsegnati` anche con lista materiali vuota. La deroga Dossier include
entrambe le chiavi per questo motivo. Se la firma di `persistLegacyMaterialEffects` cambia in futuro,
la deroga potrebbe diventare eccessivamente permissiva.

### `sourceDocumentId` opzionale in `NextManutenzioneReadOnlyItem`
Il campo è stato reso opzionale (`?`) per non rompere `NextManutenzioniPage.tsx` (NON TOCCARE),
che costruisce oggetti inline senza `sourceDocumentId`. Se in futuro si vuole renderlo obbligatorio,
occorre aggiornare anche `NextManutenzioniPage.tsx`.

### Ricarica Dossier dopo salvataggio
`onSaved` in `NextDossierMezzoPage` chiama `readNextDossierMezzoCompositeSnapshot` + `buildNextDossierMezzoLegacyView`
per aggiornare lo stato React. Se la firma di questi reader cambia, il callback smette di ricaricare.

## Perimetro scrittore aperto in questa sessione
- Percorsi: `/next/dossiermezzi/*`, `/next/dossier/*`
- Chiavi storage: `@manutenzioni`, `@inventario`, `@materialiconsegnati`
- Nessun altro perimetro toccato
