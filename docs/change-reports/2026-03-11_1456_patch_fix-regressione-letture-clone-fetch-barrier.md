# CHANGE REPORT - Fix regressione letture clone dopo fetch barrier

## Data
- 2026-03-11 14:56

## Tipo task
- patch

## Obiettivo
- Ripristinare le letture del clone restringendo la fetch barrier ai soli endpoint mutanti applicativi noti, senza rollback della protezione no-write gia introdotta.

## File modificati
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Rimossa la regola grezza che bloccava nel clone tutte le `fetch` con metodo diverso da `GET/HEAD`.
- Introdotta una regola URL-aware che blocca solo endpoint mutanti applicativi noti del progetto: Cloud Functions/Run IA-PDF censiti e same-origin `/api/*`.
- Lasciati invariati i blocchi no-write gia attivi su `storageSync` in scrittura, helper condivisi e wrapper Firestore/Storage.
- Migliorato il log di `storageSync.getItemSync` per distinguere meglio un errore di lettura da un dataset vuoto.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone torna a leggere i dati reali senza degradare in massa a “nessun dato”.
- Resta attiva una protezione no-write sensata sugli endpoint mutanti applicativi noti.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT / barriera clone
- letture condivise via `storageSync`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- infrastruttura clone

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- La fetch barrier non intercetta piu qualsiasi POST generico: la copertura resta intenzionalmente limitata agli endpoint applicativi noti.
- I writer SDK diretti sparsi nel resto del repo restano materia della Fase 2 globale.

## Build/Test eseguiti
- `npm run build` - OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
