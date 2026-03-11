# CONTINUITY REPORT - Fix regressione letture clone fetch barrier

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre su `src/next/*`, con barriera no-write centrale gia attiva.

## Modulo/area su cui si stava lavorando
- Infrastruttura clone
- correzione minima della fetch barrier introdotta con la Fase 1 no-write

## Stato attuale
- La fetch barrier non blocca piu globalmente tutte le `fetch` non `GET/HEAD`.
- Il clone continua a bloccare gli endpoint mutanti applicativi noti e i writer gia coperti da helper/wrapper.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Barriera no-write Fase 1
- Hardening Fase 2 mirato su writer diretti Cisterna
- Correzione minima regressione letture clone lato fetch barrier

## Prossimo step di migrazione
- Verificare a caldo che i moduli clone tornino a leggere correttamente i dataset reali.
- Rinviare eventuale Fase 2 globale ai writer SDK diretti sparsi nel repo.

## Moduli impattati
- `cloneWriteBarrier`
- `storageSync`
- tutte le route `/next/*` che leggono via Firebase/Auth/SDK

## Contratti dati coinvolti
- Nessun contratto dati modificato

## Ultime modifiche eseguite
- Resa URL-aware la fetch barrier clone
- Mantenuti invariati i blocchi no-write su helper condivisi e wrapper Firestore/Storage
- Migliorato il log di errore lettura `storageSync.getItemSync`

## File coinvolti
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`

## Decisioni gia prese
- Non fare rollback dei wrapper Firestore/Storage
- Non toccare la logica dei moduli business
- Limitare la correzione alla fetch barrier e al logging minimo di lettura

## Vincoli da non rompere
- Nessuna scrittura business verso la madre
- Nessun blocco del traffico infrastrutturale necessario a Firebase/Auth/SDK
- Nessun allargamento a refactor o migrazioni di moduli

## Parti da verificare
- Comportamento reale delle letture clone dopo il narrowing della fetch barrier
- Eventuali moduli che continuano a mostrare “nessun dato” per errori lettura propri del dominio

## Rischi aperti
- I writer SDK diretti restano fuori dalla correzione minima e richiederanno una Fase 2 globale
- `storageSync.getItemSync` continua a restituire `null` su errore, anche se ora con log piu leggibile

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Se le letture tornano, congelare questa correzione e riprendere la migrazione moduli
- Se restano buchi, fare audit mirato sul reader o domain specifico che continua a degradare a “nessun dato”

## Cosa NON fare nel prossimo task
- Non fare rollback totale della barriera no-write
- Non allargare subito alla Fase 2 globale senza confermare il ripristino delle letture

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
