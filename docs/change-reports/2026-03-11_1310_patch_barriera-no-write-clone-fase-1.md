# CHANGE REPORT - Fase 1 barriera centrale no-write clone

## Data
- 2026-03-11 13:10

## Tipo task
- patch

## Obiettivo
- Installare una prima barriera runtime centrale che blocchi nel clone `/next` una parte grossa e concreta delle scritture e dei side effect mutanti, senza ancora rifattorizzare tutti i writer diretti sparsi nel repo.

## File modificati
- `src/main.tsx`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`
- `src/utils/materialImages.ts`
- `src/utils/aiCore.ts`
- `src/cisterna/iaClient.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Creata la utility `cloneWriteBarrier` con riconoscimento runtime clone da pathname `/next`, errore standard `CloneWriteBlockedError` e fetch barrier idempotente.
- Installata la barriera prima del render React in `main.tsx`.
- Bloccati nel clone `storageSync.setItemSync/removeItemSync`, upload/delete materiali, callable `aiCore` e helper HTTP Cisterna.
- Adottata una fetch barrier conservativa che nel clone blocca tutte le `fetch` con metodo diverso da `GET/HEAD`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Rafforzamento tecnico del blocco scritture clone oltre ai soli guard-rail UI.
- Nessun impatto sul runtime madre fuori dal subtree `/next`.

## Rischio modifica
- ELEVATO

## Moduli impattati
- sistema clone `/next`
- helper dati condivisi
- IA / PDF / Cisterna

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: policy Firestore/Storage e governance endpoint IA/PDF ancora da verificare in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- I mutator Firebase/Storage importati direttamente nelle pagine restano fuori dalla Fase 1 e richiedono hardening dedicato.
- La fetch barrier blocca in modo conservativo tutti i metodi diversi da `GET/HEAD` nel clone, quindi future chiamate computazionali POST andranno eventualmente allowlistate in Fase 2.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
