# CONTINUITY REPORT - Hardening barriera no-write Cisterna

## Contesto generale
- Il clone resta nella fase di migrazione fedele `read-only` della madre.
- Dopo la Fase 1 centrale, il focus corrente era chiudere il gap minimo che impediva di migrare in futuro i writer Cisterna nel clone.

## Modulo/area su cui si stava lavorando
- barriera no-write del clone
- Fase 2 mirata ai writer diretti di `Cisterna IA` e `Schede Test`

## Stato attuale
- Esistono ora wrapper riusabili per i principali mutator Firestore/Storage.
- `Cisterna IA` e `Cisterna Schede Test` non usano piu direttamente i writer scoperti principali (`addDoc`, `updateDoc`, `uploadBytes`).
- La migrazione dei due moduli nel clone non e ancora stata fatta in questo task.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- niente nuove route o UI
- solo hardening tecnico della barriera no-write

## Prossimo step di migrazione
- valutare la migrazione clone di `Cisterna IA`, che ora ha una base tecnica piu sicura
- mantenere separato `Cisterna Schede Test`, che richiede ancora piu lavoro dedicato

## Moduli impattati
- sistema clone
- writer Cisterna

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- creato `src/utils/firestoreWriteOps.ts`
- creato `src/utils/storageWriteOps.ts`
- cablati i wrapper nei due moduli Cisterna writer

## File coinvolti
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Nessun monkey patch sugli internals Firebase.
- Nessun refactor globale del repo in questa fase.
- Hardening limitato ai call site writer che bloccavano la migrazione Cisterna.

## Vincoli da non rompere
- Nessuna regressione fuori dal clone.
- Nessuna scrittura verso la madre dal runtime `/next`.
- Nessuna migrazione dei moduli Cisterna nello stesso task di hardening.

## Parti da verificare
- writer Firebase/Storage diretti ancora sparsi in altri moduli
- task dedicato per portare `Cisterna IA` nel clone

## Rischi aperti
- `Cisterna Schede Test` resta fortemente accoppiato a edit mode, upload e logiche operative.
- Il resto del repo contiene ancora mutator diretti non coperti da questa Fase 2 mirata.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- mini-progetto dedicato per migrare `Cisterna IA` nel clone usando la barriera ora rafforzata

## Cosa NON fare nel prossimo task
- Non allargare subito il task a `Schede Test` e ad altri writer del repo nello stesso pacchetto.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
