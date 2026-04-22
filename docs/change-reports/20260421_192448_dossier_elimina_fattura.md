# Change Report - Dossier elimina fattura

## Data
- 2026-04-21

## Obiettivo
- Aggiungere nel Dossier Mezzo il bottone `Elimina` sulle righe fattura per rimuovere il documento da `@documenti_mezzi`, con conferma utente e senza toccare la manutenzione collegata.

## File runtime toccati
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/utils/cloneWriteBarrier.ts`

## Modifiche applicate
- `nextDocumentiCostiDomain.ts`
  - aggiunta in fondo la funzione `deleteNextDocumentoMezzo(documentoId)` che elimina un documento dalla collection Firestore `@documenti_mezzi` passando dal wrapper clone-safe `firestoreWriteOps`.
- `NextDossierMezzoPage.tsx`
  - aggiunti stato locale e modal di conferma per l'eliminazione di una fattura;
  - la riga fattura mantiene `Anteprima PDF` e aggiunge il bottone `Elimina` con lo stesso pattern visivo del bottone preventivi;
  - al click verifica se `legacy.manutenzioni` contiene `sourceDocumentId === item.id`;
  - mostra uno dei due messaggi:
    - `Eliminare questa fattura?`
    - `Questa fattura ha una manutenzione collegata. Eliminando la fattura la manutenzione rimarra. Confermi l'eliminazione?`
  - alla conferma elimina solo la fattura, poi ricarica `readNextDossierMezzoCompositeSnapshot(targa)` senza reload pagina.
- `cloneWriteBarrier.ts`
  - aggiunto supporto al kind `firestore.deleteDoc`;
  - aggiunta deroga solo per il contesto Dossier e solo per path Firestore sotto `@documenti_mezzi/`;
  - mantenute intatte le deroghe Firestore esistenti per Archivista.

## Verifiche eseguite
- `npx eslint src/next/NextDossierMezzoPage.tsx src/next/domain/nextDocumentiCostiDomain.ts src/utils/cloneWriteBarrier.ts` -> `OK`
- `npm run build` -> `OK`

## Limiti residui
- Runtime browser su fatture live non verificato in questa sessione.
- Il flusso elimina solo il documento; la manutenzione collegata resta invariata per contratto.
