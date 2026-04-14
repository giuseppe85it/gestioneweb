# CHANGE REPORT - 2026-04-13 15:19:04

## Task
PROMPT 44A - UI `Documenti e costi` per `/next/ia/documenti`

## Esito
- Stato: `PATCH PARZIALE`
- Rischio: `NORMALE`

## Obiettivo eseguito
- sostituito il layout di `src/next/NextIADocumentiPage.tsx` con una vista per fornitore aderente alla spec `docs/product/SPEC_DOCUMENTI_COSTI_UI.md`
- mantenuta intatta la lettura read-only esistente tramite `readNextIADocumentiArchiveSnapshot()`
- aggiunte in coda a `src/next/internal-ai/internal-ai.css` le classi `.doc-costi-*`

## File toccati
- `src/next/NextIADocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Dati reali usati
- reader: `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`
- shape confermata `NextIADocumentiArchiveItem`:
  - `id`
  - `sourceKey`
  - `sourceDocId`
  - `tipoDocumento`
  - `categoriaArchivio`
  - `targa`
  - `dataDocumento`
  - `sortTimestamp`
  - `totaleDocumento`
  - `fornitore`
  - `fileUrl`
  - `valuta`
  - `currency`
  - `testo`
  - `imponibile`
  - `ivaImporto`
  - `importoPagamento`
  - `numeroDocumento`
  - `daVerificare`

## Cosa e stato cambiato
- header con numero documenti, numero fornitori e totale generale
- filtri UI: `Tutti`, `Fatture`, `DDT`, `Preventivi`, `Da verificare`
- ricerca locale su `fornitore`, `targa`, `totaleDocumento`
- raggruppamento per fornitore con sezioni collassabili e totale per fornitore
- tabella righe con click sulla riga -> modale dettaglio
- azioni riga:
  - `PDF` apre nuova tab
  - `Riapri review` mantiene la navigazione esistente
  - `Chiedi alla IA` naviga a `/next/ia/interna` con `initialPrompt`
- modale con soli campi intestazione reali e `Da verificare` solo locale

## Motivo del parziale
- `NextIADocumentiArchiveItem` non espone `voci`, quindi il modale non puo mostrare le righe documento senza toccare il domain read-only
- la UI mantiene `Riapri review` per non introdurre regressione sul file precedente, quindi la superficie finale non coincide al 100% con la spec grafica minima

## Verifiche eseguite
- `npx eslint src/next/NextIADocumentiPage.tsx` -> `OK`
- `npm run build` -> `OK`
- browser reale su `http://127.0.0.1:4174/next/ia/documenti`:
  - sezioni fornitore collassabili
  - filtro `Preventivi` funzionante
  - ricerca `TI324623` funzionante
  - click riga apre modale
  - click `PDF` apre nuova tab Storage senza aprire il modale
  - click `Chiedi alla IA` porta a `/next/ia/interna` con prompt precaricato

## Note
- nessuna modifica a `src/next/domain/nextDocumentiCostiDomain.ts`
- nessuna modifica a writer Firestore/Storage, backend o barrier
- errori console osservati nel browser: backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`, preesistenti
