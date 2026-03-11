# CHANGE REPORT - Dossier clone -> DettaglioLavoro clone-safe

## Data
- 2026-03-11 13:17

## Tipo task
- patch

## Obiettivo
- Collegare dal Dossier clone il dettaglio lavoro read-only gia esistente, senza toccare il legacy e senza aprire nuovi moduli.

## File modificati
- `src/next/NextDossierMezzoPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Il Dossier clone usa ora il path builder clone-safe per aprire `/next/dettagliolavori/:lavoroId`.
- Il collegamento e stato aggiunto sia nella card `Lavori` sia nei modal `Mostra tutti`.
- Nessun cambio al domain lavori e nessun collegamento al dettaglio legacy.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Chiusura del residuo noto nella navigazione Dossier -> Lavori.
- Nessun impatto sui dati o sulle scritture.

## Rischio modifica
- NORMALE

## Moduli impattati
- Dossier Mezzo clone
- famiglia Lavori clone

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il task non cambia il comportamento del tasto “Torna” nel dettaglio lavoro, che continua a usare il flusso gia esistente.

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
