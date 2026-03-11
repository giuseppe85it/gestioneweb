# CHANGE REPORT - Apertura clone-safe Area Capo read-only

## Data
- 2026-03-10 22:51

## Tipo task
- patch

## Obiettivo
- Aprire nel clone `/next` la famiglia `Area Capo` con due route dedicate read-only, riusando i layer gia bonificati e bloccando approvazioni e PDF timbrati.

## File modificati
- `src/App.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunte le route `/next/capo/mezzi` e `/next/capo/costi/:targa`.
- Creata la pagina clone `Capo Mezzi` read-only con lista mezzi e accesso al dettaglio manageriale per targa.
- Creata la pagina clone `Capo Costi Mezzo` read-only con KPI, filtri, lista documenti/costi e stato approvazione solo informativo.
- Creato un dominio manageriale dedicato che riusa flotta e costi/documenti gia normalizzati e legge `@preventivi_approvazioni` solo in sola lettura.
- Rese cliccabile dal clone la card `Area Capo` nel `Centro Controllo`.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La famiglia manageriale della madre diventa raggiungibile e navigabile nel clone senza side effect.
- Le letture costi/documenti/flotta restano confinate nei layer read-only del clone.
- Approvazioni, `stamp_pdf` e PDF timbrati restano bloccati in modo esplicito.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT
- Area Capo
- Centro Controllo clone
- Layer documenti/costi

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: Matrice ruoli/permessi definitiva

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- `@preventivi_approvazioni` viene letto anche dal clone, ma resta strettamente read-only.
- `stamp_pdf` e i PDF timbrati non devono essere riattivati in task successivi senza audit dedicato.

## Build/Test eseguiti
- `npm run build` OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
