# CHANGE REPORT - NEXT Operativita Globale structured shell

## Data
- 2026-03-08 11:11

## Tipo task
- UI

## Obiettivo
- sostituire il placeholder di `/next/operativita-globale` con una shell reale della macro-area `Operativita Globale`, senza dati runtime, senza scritture e senza copiare i moduli legacy

## File modificati
- src/App.tsx
- src/next/NextOperativitaGlobalePage.tsx
- src/next/next-shell.css
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Riassunto modifiche
- introdotta una pagina dedicata `NextOperativitaGlobalePage` come prima struttura reale della macro-area globale NEXT
- chiariti in UI i domini globali non mezzo-centrici, il confine con il Dossier e il ruolo futuro dell'IA sui flussi globali
- mantenuta la separazione dalla legacy con route NEXT dedicate e nessun collegamento a dati reali
- aggiornati tracker migrazione NEXT, stato progetto e storico decisioni

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- `Operativita Globale` non e piu un placeholder generico ma una shell workflow globale coerente con blueprint e wireframe
- la futura migrazione read-only di `Acquisti & Magazzino` e dei domini condivisi ha ora una grammatica visiva chiara

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT shell runtime
- macro-area Operativita Globale
- documentazione stato progetto

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- operativita

## Stato migrazione prima
- SHELL CREATA

## Stato migrazione dopo
- IMPORTATO SOLO UI

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- non confondere questa pagina con una migrazione di `Acquisti`, `Inventario` o `MaterialiDaOrdinare`
- non trasformare la macro-area in un miscuglio di moduli globali senza confine chiaro con il Dossier
- non introdurre IA come superficie primaria qui prima delle superfici ufficiali v1

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
