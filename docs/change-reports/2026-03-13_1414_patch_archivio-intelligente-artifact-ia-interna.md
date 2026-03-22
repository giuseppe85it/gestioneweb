# CHANGE REPORT - Archivio intelligente artifact IA interna

## Data
- 2026-03-13 14:14

## Tipo task
- patch

## Obiettivo
- Rendere consultabile e scalabile l'archivio artifact locale del sottosistema IA interno con ricerca, filtri combinabili e riapertura del report corretto.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Esteso il modello artifact locale con metadati utili a ricerca, filtri, famiglie report e riapertura retrocompatibile degli artifact gia presenti.
- Aggiornata la UI `/next/ia/interna/artifacts` con barra di ricerca libera, filtri combinabili, reset filtri, badge piu chiari e ordinamento per aggiornamento piu recente.
- Riapertura artifact riallineata alla preview corretta del modulo IA con ripristino del contesto mezzo/autista/periodo quando disponibile.
- Estesa la memoria locale del modulo con ultima consultazione archivio e ultimi filtri usati.
- Aggiornati checklist IA, stato avanzamento, stato migrazione NEXT e registro modifiche clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Archivio locale IA piu usabile e preparato a future famiglie di report e a una futura persistenza server-side dedicata.
- Nessun impatto sui dataset business, sui flussi legacy o sui moduli fuori da `/next/ia/interna*`.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna NEXT
- archivio artifact locale IA
- tracking/memoria locale IA

## Contratti dati toccati?
- PARZIALE

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
- Le famiglie report sono derivate solo dai dataset gia presenti nei payload e usano fallback `misto` o `non classificato` quando i metadati non bastano.
- La riapertura artifact dipende dalla presenza del payload preview locale; gli artifact tecnici senza preview restano consultabili ma non riaprono un report.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts` - OK
- `npm run build` - OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
