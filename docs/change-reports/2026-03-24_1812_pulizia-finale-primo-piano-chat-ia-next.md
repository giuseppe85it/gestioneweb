# CHANGE REPORT - Pulizia finale primo piano chat IA NEXT

## Data
- 2026-03-24 18:12

## Tipo task
- UI

## Obiettivo
- Ridurre `/next/ia/interna` alla forma minima utile nel primo piano: solo chat/composer al centro e report a destra, senza welcome o riassunti automatici.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Rimossa l'inizializzazione automatica del messaggio di benvenuto della chat.
- Il centro mostra solo conversazione reale oppure un placeholder minimo all'apertura.
- Lo stato lookup targa viene mostrato solo quando serve davvero, riducendo il rumore iniziale.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Apertura molto piu pulita della console IA.
- Nessun impatto su motore unificato, reader, backend o blocco scritture.

## Rischio modifica
- NORMALE

## Moduli impattati
- `NextInternalAiPage`
- stile locale `internal-ai.css`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

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
- Il task non elimina i blocchi secondari dal file, ma li lascia fuori dal primo piano.
- La conversazione resta volutamente solo di sessione corrente; nessuno storico viene ripristinato all'apertura.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
