# CHANGE REPORT - IA interna report targa in anteprima

## Data
- 2026-03-12 22:08

## Tipo task
- patch

## Obiettivo
- Attivare il primo use case reale ma sicuro del sottosistema IA interno: cercare una targa, leggere dati in sola lettura dai layer NEXT e costruire una anteprima report nel clone.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

## Riassunto modifiche
- Creato un facade IA interno per report targa che riusa solo il composito Dossier NEXT e i suoi reader gia normalizzati.
- Estesa la UI `/next/ia/interna` con ricerca targa, anteprima report, fonti lette, dati mancanti ed evidenze.
- Esteso il repository locale simulato per salvare la preview solo come sessione/richiesta/bozza interna.
- Tradotti in italiano i testi visibili del subtree IA interno.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il clone IA interno ha ora un primo use case utile e verificabile senza toccare i flussi business correnti.
- Nessuna scrittura business e nessun backend IA reale vengono introdotti.

## Rischio modifica
- NORMALE

## Moduli impattati
- IA interna clone
- Reader NEXT dossier mezzo

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: policy Firestore/Storage effettive e ownership backend IA dedicato restano da verificare

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
- Il report resta una anteprima e non una verita applicativa: le sezioni dipendono dai layer NEXT gia disponibili e dai loro limiti espliciti.
- Le bozze restano solo in memoria locale del sottosistema IA e si azzerano al refresh completo dell'app.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiTracking.ts` -> OK
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
