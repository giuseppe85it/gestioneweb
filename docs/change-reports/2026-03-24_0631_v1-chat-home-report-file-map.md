# CHANGE REPORT - V1 chat IA Home / report targa / file map

## Data
- 2026-03-24 06:31

## Tipo task
- UI / orchestrazione

## Obiettivo
- Rendere affidabile e chiara la chat IA interna per tre use case V1:
  - analisi Home;
  - report targa/mezzo;
  - mappa file da toccare.

## File modificati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Gli intenti locali della chat sono stati stretti sui prompt `Home` e `file da toccare`, con fallback piu utile e verificato.
- Il `report targa` resta esplicitamente sul percorso mezzo-centrico NEXT read-only gia esistente.
- Il selettore output non manda piu richieste come `quale file devo toccare` verso una proposta di integrazione.
- La resa nel thread e piu leggibile: suggerimenti stretti, testo spezzato in blocchi, label d'uso e chip sobri di contesto.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La V1 della chat e piu chiara e centrata sul valore prodotto reale.
- Le richieste `analizza la home` e `quali file devo toccare` diventano piu utili anche in fallback locale.
- Nessuna nuova superficie business o infrastrutturale viene aperta.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Le risposte repo/UI restano migliori quando la memoria osservata lato backend e aggiornata.
- Il task non amplia capability, backend o bridge live: restringe solo la V1 gia esistente.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
