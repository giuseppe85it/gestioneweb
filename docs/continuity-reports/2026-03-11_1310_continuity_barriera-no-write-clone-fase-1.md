# CONTINUITY REPORT - Barriera no-write clone

## Contesto generale
- Il progetto continua nella fase di clone fedele `read-only` della madre.
- Il focus corrente non e aprire nuovi moduli business, ma rafforzare il blocco tecnico delle scritture per accelerare le importazioni successive.

## Modulo/area su cui si stava lavorando
- barriera centrale no-write del clone
- Fase 1 limitata a helper/runtime condivisi e fetch mutanti

## Stato attuale
- Esiste ora una utility centrale che riconosce il runtime `/next` e blocca i tentativi di write nei punti condivisi gia verificati.
- Il clone continua a navigare con i reader gia aperti; il blocco completo dei mutator SDK diretti non e ancora stato fatto.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- barriera fetch runtime nel bootstrap
- guardie condivise su `storageSync`, `materialImages`, `aiCore`, `cisterna/iaClient`

## Prossimo step di migrazione
- Fase 2: introdurre wrapper sottili per mutator Firestore/Storage e sostituire gli import diretti nei file writer ancora sparsi.

## Moduli impattati
- sistema clone `/next`
- helper dati condivisi
- IA / PDF / Cisterna

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- creata `src/utils/cloneWriteBarrier.ts`
- installata la fetch barrier in `src/main.tsx`
- protetti helper condivisi che scrivono o chiamano runtime mutanti

## File coinvolti
- `src/main.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`
- `src/utils/materialImages.ts`
- `src/utils/aiCore.ts`
- `src/cisterna/iaClient.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Il clone viene riconosciuto a runtime dal pathname `/next`, non da flag ambiente dedicati.
- In Fase 1 la fetch barrier nel clone blocca in modo conservativo tutti i metodi diversi da `GET/HEAD`.
- I mutator Firebase/Storage diretti restano esplicitamente rinviati a Fase 2.

## Vincoli da non rompere
- Nessuna scrittura o side effect verso la madre dal clone.
- Nessun hack sugli internals del Firebase SDK.
- Nessuna regressione sui reader clone-safe gia aperti.

## Parti da verificare
- copertura residua dei writer Firestore/Storage diretti fuori helper condivisi
- eventuale allowlist futura per POST computazionali non mutanti nel clone

## Rischi aperti
- La barriera Fase 1 non blocca ancora i mutator SDK importati direttamente nelle pagine.
- Policy Firestore/Storage e governance endpoint IA/PDF restano punti aperti di progetto.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Task dedicato di Fase 2 per introdurre wrapper `firestoreWriteOps` e `storageWriteOps` e cablare i file writer ancora sparsi.

## Cosa NON fare nel prossimo task
- Non aprire nuovi moduli clone contando sulla sola Fase 1 come copertura totale di tutte le scritture.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
