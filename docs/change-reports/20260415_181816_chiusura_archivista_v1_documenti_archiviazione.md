# Change Report - 2026-04-15 18:18:16

## Titolo
Chiusura Archivista V1 lato documenti / archiviazione

## Obiettivo
Chiudere il perimetro documentale di `Archivista` attivando tutte e sole le quattro famiglie V1, aggiungendo review coerente, controllo duplicati, conferma esplicita utente e archiviazione finale reale senza introdurre azioni business post-archivio.

## Perimetro
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/utils/cloneWriteBarrier.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-document-extraction.js`
- documentazione obbligatoria di stato

## Modifiche runtime/backend
- attivate in `Archivista` tutte e sole le famiglie V1:
  - `Fattura / DDT + Magazzino`
  - `Fattura / DDT + Manutenzione`
  - `Documento mezzo`
  - `Preventivo + Magazzino`
- mantenuto il ramo `Magazzino` esistente, aggiungendo solo chiusura documentale:
  - review completa
  - controllo duplicati
  - conferma esplicita utente
  - archiviazione finale
- mantenuto il ramo `Manutenzione` OpenAI-only, aggiungendo:
  - controllo duplicati
  - archiviazione finale in `@documenti_mezzi`
  - nessuna creazione manutenzione
  - nessun uso di `@costiMezzo`
- aggiunti i bridge:
  - `ArchivistaDocumentoMezzoBridge.tsx`
  - `ArchivistaPreventivoMagazzinoBridge.tsx`
- aggiunto `ArchivistaArchiveClient.ts` come helper locale per:
  - upload originali
  - salvataggio record archivio
  - ricerca duplicati
  - update mezzo confermato
- aggiunti endpoint backend OpenAI dedicati:
  - `POST /internal-ai-backend/documents/documento-mezzo-analyze`
  - `POST /internal-ai-backend/documents/preventivo-magazzino-analyze`
- esteso il motore documentale OpenAI con i profili:
  - `documento_mezzo`
  - `preventivo_magazzino`
- aperta la barrier solo per:
  - upload originali Archivista V1
  - `@documenti_magazzino`
  - `@documenti_mezzi`
  - `storage/@preventivi`
  - update confermato di `@mezzi_aziendali`

## Regola duplicati applicata
- campi forti usati: famiglia, contesto, fornitore, numero documento, data, totale, targa dove rilevante
- se il match e forte, l'utente deve scegliere tra:
  - `Stesso documento`
  - `Versione migliore`
  - `Documento diverso`
- comportamento:
  - `Stesso documento`: nessun nuovo record
  - `Documento diverso`: nuovo record
  - `Versione migliore`: nuovo record non distruttivo con collegamento prudente al precedente

## Target archivio chiusi
- `Fattura / DDT + Magazzino` -> `@documenti_magazzino`
- `Fattura / DDT + Manutenzione` -> `@documenti_mezzi`
- `Documento mezzo` -> `@documenti_mezzi` + collegamento mezzo
- `Preventivo + Magazzino` -> `storage/@preventivi`

## Vincoli rispettati
- nessuna modifica madre
- nessun refactor largo
- nessun rifacimento Magazzino
- nessun writer business post-archivio
- nessuna apertura su `@costiMezzo`
- nessuna apertura su `@manutenzioni`
- nessun aggiornamento listino
- nessun workflow post-archivio

## Verifiche
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts src/utils/cloneWriteBarrier.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-document-extraction.js` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> file ignorato dalla config ESLint
- `npm run build` -> `OK`

## Rischio
`ELEVATO` per impatto su IA interna, archiviazione documentale, barrier e scritture confermate lato clone.

## File extra letti per shape reali
- `src/firebase.ts`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/utils/storageSync.ts`
