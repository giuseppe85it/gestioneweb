# CHANGE REPORT - Parita UI clone su shell, quick link e metadata

## Data
- 2026-03-11 21:50

## Tipo task
- ui

## Obiettivo
- Riallineare la navigazione del clone alla copertura runtime reale, mantenendo il perimetro `/next` e senza riaprire scritture o moduli non pronti.

## File modificati
- `src/next/NextShell.tsx`
- `src/next/next-shell.css`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- La topbar clone legge ora `NEXT_NAV_ITEMS` e mostra i moduli gia attivi invece di restare limitata a tre soli ingressi.
- Il Centro Controllo riallinea i quick link verso il perimetro `/next` quando la controparte clone esiste gia, inclusi `Autisti Inbox`, `App Autisti` e `Libretti Export`.
- `nextData` e stato aggiornato per censire meglio `Autisti Inbox`, `Autisti Admin` e lo stato reale di `Cisterna`, oltre a correggere descrizioni ormai superate.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Migliore discoverability dei moduli clone gia attivi.
- Minore rischio di uscita accidentale verso route legacy quando esiste gia una route `/next`.
- Nessun impatto su contratti dati o barriere no-write.

## Rischio modifica
- NORMALE

## Moduli impattati
- Shell NEXT
- Centro di Controllo clone
- Metadata route clone

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Standard UI canonico cross-modulo per NEXT

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- shell globale

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- `Autisti Admin` resta reader-first e continua a non leggere ancora i record `@next_clone_autisti:*`.
- Alcuni moduli profondi restano volutamente bloccati o non esposti 1:1 perche non ancora clone-safe.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO
