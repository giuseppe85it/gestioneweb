# CHANGE REPORT - Fix matching rifornimenti report autista IA interna

## Data
- 2026-03-13 14:35

## Tipo task
- fix

## Obiettivo
- Correggere il collegamento read-only tra autista e rifornimenti nel report autista IA interno, evitando omissioni strutturali dei rifornimenti recenti.

## File modificati
- `src/next/internal-ai/internalAiDriverReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Verificata la causa nel facade: i rifornimenti venivano letti solo per i mezzi associati in anagrafica D01.
- Esteso il perimetro di lettura anche ai mezzi osservati per lo stesso autista in sessioni, alert e focus del layer D10.
- Mantenuto invariato il matching read-only sui record D04, basato su `badgeAutista` e fallback su `autistaNome` normalizzato.
- Aggiornate note e tracciabilita documentale del clone per il debug fix.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il report autista read-only recupera piu facilmente rifornimenti recenti gia leggibili nel clone.
- Nessun impatto sugli altri report, sui dataset business o sui flussi legacy.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna NEXT
- report autista read-only

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
- Il matching rifornimenti resta dipendente dalla qualita dei campi `badgeAutista` e `autistaNome` nel layer D04.
- Il fix amplia il set di mezzi interrogati ma non inventa nuovi legami forti oltre quelli gia leggibili nei layer D01/D10/D04.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiDriverReportFacade.ts` - OK
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
