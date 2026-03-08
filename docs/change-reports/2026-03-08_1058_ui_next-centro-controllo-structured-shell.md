# CHANGE REPORT - NEXT Centro di Controllo structured shell

## Data
- 2026-03-08 10:58

## Tipo task
- UI

## Obiettivo
- sostituire il placeholder di `/next/centro-controllo` con una prima shell reale della macro-area `Centro di Controllo`, senza dati runtime, senza scritture e senza copiare la home legacy

## File modificati
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Riassunto modifiche
- introdotta una pagina dedicata `NextCentroControlloPage` come prima struttura reale del cockpit NEXT
- chiariti in UI ruolo di cabina di regia, priorita, alert, scadenze, collegamenti verso Dossier e spazio futuro per IA Business v1
- mantenuta la separazione dalla legacy con route NEXT dedicate e nessun collegamento a dati reali
- aggiornati tracker migrazione NEXT, stato progetto e storico decisioni

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- il Centro di Controllo NEXT non e piu un placeholder generico ma una shell operativa coerente con blueprint e wireframe
- la futura migrazione read-only del cockpit ha ora una grammatica visiva e funzionale chiara

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT shell runtime
- macro-area Centro di Controllo
- documentazione stato progetto

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- home / centro di controllo

## Stato migrazione prima
- SHELL CREATA

## Stato migrazione dopo
- IMPORTATO SOLO UI

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- non confondere questa pagina con una migrazione della `Home` legacy o del `CentroControllo` legacy
- non introdurre numeri finti o KPI simulati come se fossero dati reali
- mantenere il ruolo del cockpit come aggregatore e instradatore, non come contenitore di workflow completi

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
