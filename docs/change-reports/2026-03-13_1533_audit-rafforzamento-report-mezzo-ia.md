# CHANGE REPORT - Audit e rafforzamento report mezzo IA interno

## Data
- 2026-03-13 15:33

## Tipo task
- audit + fix minimo

## Obiettivo
- Verificare in modo strutturale il `report targa` read-only del sottosistema IA interno, individuare i punti deboli reali sui blocchi mezzo e correggere solo bug piccoli e sicuri emersi dall'audit.

## File modificati
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Eseguita mappatura tecnica dei blocchi letti dal report mezzo:
  - lavori;
  - manutenzioni / gomme;
  - rifornimenti;
  - materiali / movimenti;
  - documenti / costi;
  - analisi economica salvata.
- Confermati come punti solidi:
  - uso del composito `readNextDossierMezzoCompositeSnapshot`;
  - filtro periodo sui blocchi con data affidabile;
  - merge prudente D04 nel layer rifornimenti;
  - dedup documenti/costi gia confinato nel layer dedicato.
- Individuati come punti deboli aperti:
  - gomme ancora limitate a `@manutenzioni`;
  - materiali ancora parziali per via dei match legacy su `destinatario`;
  - documenti/costi ancora senza `@preventivi` e `@preventivi_approvazioni`.
- Fix runtime minimo applicato:
  - la preview mezzo considera ora anche movimenti materiali e analisi economica salvata come copertura reale;
  - la sezione `Documenti, costi e analisi` non viene piu presentata come vuota quando esiste una analisi economica legacy salvata anche con zero documenti/costi nel periodo.
- Aggiornate checklist IA, stato avanzamento IA, stato migrazione NEXT e registro modifiche clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Preview mezzo piu trasparente e meno pessimista nei casi in cui la copertura reale arriva da materiali o analisi economica salvata.
- Sezione documentale/economica piu corretta quando il periodo esclude i documenti ma il clone ha comunque una analisi economica legacy disponibile.
- Nessun allargamento del perimetro dati o delle sorgenti lette.

## Rischio modifica
- ELEVATO

## Moduli impattati
- sottosistema IA interna NEXT
- report mezzo / targa read-only

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI
- audit strutturale report mezzo su copertura gomme, materiali e documenti/costi

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- `/next/ia/interna*`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il fix non amplia i layer dati: gli eventi gomme fuori `@manutenzioni` restano un follow-up separato.
- Il blocco materiali continua a essere correttamente parziale e fuori filtro periodo.
- Il blocco documenti/costi resta coerente con il perimetro clone-safe attuale, che non apre `@preventivi` o approvazioni procurement.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiVehicleReportFacade.ts` - OK
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
