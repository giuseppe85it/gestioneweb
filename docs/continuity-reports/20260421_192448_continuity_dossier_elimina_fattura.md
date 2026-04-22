# Continuity Report - Dossier elimina fattura

## Perimetro confermato
- Nessuna modifica alla madre legacy.
- Nessuna modifica a `src/next/domain/nextDossierMezzoDomain.ts`.
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`.
- Nessuna modifica a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`.
- Nessuna modifica a `firestore.rules`, `storage.rules`, `pdfEngine.ts`.

## Continuita funzionale
- Il bottone `Elimina` dei preventivi resta invariato e continua a mostrare il messaggio `Clone read-only`.
- La sezione `Fatture` continua a mostrare le stesse righe e `Anteprima PDF`.
- La manutenzione collegata non viene mai eliminata da questo flusso.
- La delete e limitata a `@documenti_mezzi`.

## Continuita sicurezza / barrier
- Nessuna nuova write exception fuori dal contesto Dossier.
- Nessuna nuova apertura su collection diverse da `@documenti_mezzi`.
- Le deroghe Archivista (`firestore.addDoc`, `firestore.setDoc`, `storageSync.setItemSync`) restano invariate.

## Stato onesto
- Patch runtime applicata e compilante.
- Verifica browser live del caso semplice e del caso con manutenzione collegata: `DA VERIFICARE`.
