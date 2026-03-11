# CHANGE REPORT - Hub clone read-only Intelligenza Artificiale

## Data
- 2026-03-11 08:16

## Tipo task
- patch

## Obiettivo
- sostituire nel clone il placeholder concettuale `IA Gestionale` con il vero hub madre `Intelligenza Artificiale`, aprendo solo la route clone-safe del hub e lasciando bloccati i moduli figli non ancora separati da side effect

## File modificati
- `src/App.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextIAGestionalePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- introdotta la route clone attiva `/next/ia` e declassato il vecchio path `/next/ia-gestionale` a solo redirect tecnico
- eliminato `NextIAGestionalePage.tsx` e creato un hub statico `NextIntelligenzaArtificialePage.tsx` che riprende ruolo, titolo e card della madre senza API key, upload o chiamate IA
- riallineati metadata e access config da `ia-gestionale` a `ia`, rimuovendo dal runtime attivo la semantica `Assistente business`
- aggiornato il quick link clone `/ia` del `Centro Controllo` per aprire davvero il nuovo hub clone-safe

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il clone espone ora un hub IA reale coerente con la madre
- i moduli IA figli restano visibili ma bloccati, senza nuove letture raw o writer nella UI clone

## Rischio modifica
- NORMALE

## Moduli impattati
- shell `/next`
- Centro Controllo clone
- hub IA clone

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Governance endpoint IA/PDF multipli

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
- SI

## Rischi / attenzione
- il vecchio path `/next/ia-gestionale` resta solo come redirect tecnico e non va riusato per nuove feature
- restano riferimenti storici a `IA Gestionale` nella documentazione architetturale precedente, fuori dal runtime attivo

## Build/Test eseguiti
- `npm run build` -> OK (resta solo il warning Vite sui chunk grandi)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

