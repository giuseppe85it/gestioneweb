# Continuity Report - Archivista Manutenzione multipagina + step 2 manutenzione

**Data:** 2026-04-21  
**Correlato a:** `docs/change-reports/20260421_182147_archivista_manutenzione_multipagina.md`

## Stato alla chiusura di questa sessione

### Completato
- La route backend `documents.manutenzione-analyze` accetta ora `pages[]` opzionale senza modificare le altre route documentali.
- Il path binario OpenAI della review manutenzione supporta ora piu pagine nello stesso documento logico.
- `ArchivistaManutenzioneBridge.tsx` gestisce input multi-file, preview multipla e archiviazione dell'originale logico come PDF unico in caso di pagine multiple.
- Dopo l'archiviazione e disponibile uno step 2 opzionale per creare una manutenzione reale.
- Il form step 2 usa il writer canonico `saveNextManutenzioneBusinessRecord()` e collega il record al documento tramite `sourceDocumentId`.
- `cloneWriteBarrier.ts` consente da `/next/ia/archivista` solo le chiavi necessarie al writer manutenzioni (`@manutenzioni`, `@inventario`, `@materialiconsegnati`) oltre alle eccezioni Archivista gia esistenti.
- Documentazione sorgente e mirror `docs/fonti-pronte/*` aggiornati.

### DA VERIFICARE
- Test browser con documento manutenzione reale a 2+ pagine su `/next/ia/archivista`.
- Verifica che il PDF combinato archiviato sia leggibile e completo.
- Verifica end-to-end del secondo step:
  - `Conferma e archivia`
  - apertura form step 2
  - `Salva manutenzione`
  - presenza del record in `/next/manutenzioni`
- Verifica che il payload `importo` passato dal bridge non richieda estensioni ulteriori del dominio in una sessione successiva.

## Punti di attenzione per ripresa

### Multi-file misto PDF + immagini
Il bridge combina piu file in un PDF locale solo al momento dell'archivio. Il backend usa invece `pages[]` per l'analisi. Serve una verifica runtime su casi reali misti `PDF + immagine` per confermare la robustezza del flusso.

### `importo` nel writer canonico manutenzioni
Il bridge costruisce e inoltra anche `importo` nel payload della manutenzione per allinearsi al task, ma il dominio `nextManutenzioniDomain.ts` non e stato modificato in questa sessione. Se in futuro l'importo dovra diventare persistente nel record `@manutenzioni`, servira una patch dedicata sul dominio.

### Scoped allowance
Il salvataggio manutenzione da Archivista usa sia la whitelist pathname `/next/ia/archivista` sia `runWithCloneWriteScopedAllowance("internal_ai_magazzino_inline_magazzino", ...)`. La scoped allowance non va riusata fuori da questo perimetro senza audit esplicito.

## Perimetro scrivente aperto in questa sessione

- Pathname: `/next/ia/archivista`
- Chiavi storageSync:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
  - `@mezzi_aziendali` gia presente
- Firestore/Storage Archivista preesistenti: invariati
