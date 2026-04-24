# CHANGE REPORT - Consumer NEXT IA preventivi

## 1. Titolo intervento
Implementazione del consumer NEXT per il flusso IA preventivi in `/next/materiali-da-ordinare`

## 2. Data
2026-04-23

## 3. Tipo task
patch

## 4. Obiettivo
Sostituire il placeholder `CARICA PREVENTIVO` nel tab `Prezzi & Preventivi` con un flusso reale NEXT che:
- invoca l'endpoint backend `POST /internal-ai-backend/documents/preventivo-extract`;
- consente review/edit delle righe estratte;
- salva il preventivo reale in `storage/@preventivi`;
- aggiorna il listino reale in `storage/@listino_prezzi`;
- mantiene invariato il flusso manuale già in produzione.

## 5. File modificati
- `src/next/NextPreventivoIaModal.tsx`
- `src/next/nextPreventivoIaClient.ts`
- `src/next/nextPreventivoIaHelpers.ts`
- `src/next/nextPreventivoManualeWriter.ts`
- `src/next/NextProcurementConvergedSection.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `docs/_live/STATO_MIGRAZIONE_NEXT.md`
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## 6. Riassunto modifiche
- Creati `nextPreventivoIaHelpers.ts` e `nextPreventivoIaClient.ts` per isolare:
  - matching fornitore;
  - mapping righe review;
  - row analysis su listino;
  - conversione data `dd/mm/yyyy -> yyyy-mm-dd`;
  - chiamata HTTP tipizzata all'endpoint backend IA.
- Creato `NextPreventivoIaModal.tsx` con:
  - step upload PDF/immagini;
  - estrazione IA con messaggi errore specifici;
  - review editabile con validazione inline;
  - salvataggio tramite `saveAndUpsert(...)` senza upload Storage lato consumer.
- Esteso `nextPreventivoManualeWriter.ts` in modo additivo con supporto opzionale a:
  - `pdfFile/pdfStoragePath/pdfUrl`;
  - `imageStoragePrefix`;
  - `fonteAttualeUsesPreventivoPdf`;
  - valorizzazione reale di `pdfStoragePath/pdfUrl` sul `Preventivo` e nel listino.
- Esteso `cloneWriteBarrier.ts` per `/next/materiali-da-ordinare` con:
  - prefisso Storage `preventivi/ia/`;
  - whitelist fetch runtime dedicata al solo endpoint `http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract`.
- `NextProcurementConvergedSection.tsx` monta ora il pulsante reale `CARICA PREVENTIVO IA` e la nuova modale, lasciando invariato `PREVENTIVO MANUALE`.

## 7. File extra richiesti
Nessuno.

## 8. Impatti attesi
- Il tab `/next/materiali-da-ordinare?tab=preventivi` espone sia il flusso manuale sia il flusso IA.
- Il consumer IA non carica file su Storage prima del save: l'upload resta confinato nel writer.
- Il refresh snapshot continua a usare la callback già esistente del parent, senza introdurre nuovi loader nel dominio.

## 9. Rischi / attenzione
- Il flusso IA introduce nuova complessità solo nel perimetro NEXT Procurement e nel barrier clone-safe; madre e backend chiuso restano invariati.
- Il save IA con immagini eredita dal writer il comportamento di orfani Storage se un upload fallisce a metà dopo aver scritto alcuni file, coerente con la SPEC e con il flusso manuale.
- Lo smoke test browser ha verificato apertura modale IA e non-regressione di apertura del manuale; l'estrazione end-to-end con file reali resta dipendente dalla disponibilità del backend IA e dall'automazione file picker.

## 10. Build / Test eseguiti
- `npx eslint src/next/nextPreventivoIaHelpers.ts src/next/nextPreventivoIaClient.ts src/next/nextPreventivoManualeWriter.ts src/next/NextPreventivoIaModal.tsx src/next/NextProcurementConvergedSection.tsx src/utils/cloneWriteBarrier.ts` -> **OK**
- `npm run build` -> **OK**
- Smoke test browser su `http://127.0.0.1:4174/next/materiali-da-ordinare?tab=preventivi` -> **parziale ma positivo**
  - pulsante `CARICA PREVENTIVO IA` visibile;
  - click apre la modale `Estrazione preventivo con IA`;
  - `PREVENTIVO MANUALE` continua ad aprire il modale esistente;
  - backend locale `4310` raggiungibile con response `400` su body invalido.

## 11. Commit hash
DA VERIFICARE (commit manuale utente)

## 12. Stato finale
FATTO - consumer IA NEXT implementato con build OK e smoke test parziale positivo.
