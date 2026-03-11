# CHANGE REPORT - Migrazione Cisterna IA clone

## Data
- 2026-03-11 13:44

## Tipo task
- patch

## Obiettivo
- Portare `Cisterna IA` nel clone su route reale `/next/cisterna/ia`, mantenendo il flusso della madre il piu possibile fedele ma gestendo in modo stabile il blocco no-write.

## File modificati
- `src/App.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunta la route clone `/next/cisterna/ia` con wrapper `NextCisternaIAPage`.
- Collegata la base `/next/cisterna` alla nuova route clone-safe.
- Adattata la pagina `CisternaCaravateIA` per riconoscere il runtime clone, usare i percorsi di ritorno clone-safe e mostrare messaggi utente chiari quando la barriera blocca upload, analisi o salvataggio.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `Cisterna IA` diventa raggiungibile nel clone senza riattivare writer verso la madre.
- Il clone mostra il flusso reale dove possibile, ma i passaggi mutanti si fermano in modo gestito.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Cisterna
- barriera no-write clone

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: governance endpoint IA/PDF e policy Firestore/Storage in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- Cisterna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- `Schede Test` resta fuori.
- Nel clone `Cisterna IA` non completa upload, analisi o salvataggio: il modulo resta navigabile ma non operativo verso la madre.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
