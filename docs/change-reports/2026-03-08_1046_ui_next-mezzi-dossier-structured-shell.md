# CHANGE REPORT - NEXT Mezzi / Dossier structured shell

## Data
- 2026-03-08 10:46

## Tipo task
- UI

## Obiettivo
- costruire la prima area reale della NEXT su `/next/mezzi-dossier`, oltre il placeholder generico, senza toccare legacy, backend o dati reali

## File modificati
- src/App.tsx
- src/next/NextRoleGuard.tsx
- src/next/NextMezziDossierPage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Riassunto modifiche
- introdotta una pagina dedicata `NextMezziDossierPage` per rendere `/next/mezzi-dossier` una vera shell di area e non un placeholder generico
- chiarita in UI la distinzione tra ingresso area mezzi, centralita del Dossier, convergenza dei flussi mezzo-centrici e differenza da Operativita Globale
- mantenuta la separazione dalla legacy con route NEXT dedicate, nessun reader/writer dati e nessuna logica business importata
- aggiornato il tracker di migrazione NEXT e la documentazione di stato/decisioni

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- migliora la leggibilita della struttura target NEXT nell'area Mezzi / Dossier
- prepara un punto di ingresso reale per futuri import read-only del Dossier senza simulare moduli completi

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT shell runtime
- NEXT area Mezzi / Dossier
- documentazione stato progetto

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- flotta / dossier

## Stato migrazione prima
- SHELL CREATA

## Stato migrazione dopo
- IMPORTATO SOLO UI

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- non confondere questa area con una migrazione reale del `DossierMezzo` legacy
- mantenere separata Operativita Globale dai flussi mezzo-centrici quando si importeranno moduli veri
- non introdurre letture o scritture dati prima di una fase read-only esplicita

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
