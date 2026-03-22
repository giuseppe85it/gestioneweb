# CHANGE REPORT - Audit e rafforzamento blocco gomme report mezzo IA interno

## Data
- 2026-03-13 16:12

## Tipo task
- audit + fix mirato

## Obiettivo
- Verificare le fonti gomme reali gia presenti nel repo e rafforzare il blocco `Gomme` del `report targa` IA interno senza introdurre collegamenti inventati o scritture business.

## File modificati
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- Audit del reader gomme clone-safe e delle fonti extra gia verificabili nel repo:
  - `@manutenzioni`;
  - `@cambi_gomme_autisti_tmp`;
  - `@gomme_eventi`.
- Il layer `nextManutenzioniGommeDomain` converge ora anche gli eventi gomme extra-manutenzione in sola lettura.
- Regola di matching mezzo applicata nel layer:
  - `targetTarga` o `targa` = match forte;
  - `targaCamion`, `targaRimorchio` e `contesto.*` = solo match plausibile quando manca una targa diretta.
- Aggiunta deduplica prudente contro le manutenzioni gia importate, solo con coincidenza reale di:
  - giorno;
  - targa;
  - asse;
  - marca;
  - km.
- Il `report mezzo` IA rende ora piu trasparente il blocco gomme mostrando:
  - eventi da manutenzioni;
  - eventi da dataset gomme dedicati;
  - match forti;
  - match plausibili.
- Aggiornata la descrizione del reader gomme nel composito dossier mezzo e la tracciabilita documentale del clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Meno perdita di eventi gomme reali nel `report targa`.
- Maggiore trasparenza sulla qualita del collegamento mezzo-evento gomme.
- Nessun impatto su writer, backend IA, madre o dataset business.

## Rischio modifica
- ELEVATO

## Moduli impattati
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`

## Contratti dati toccati?
- SI
- solo in lettura, sul contratto clone-safe del blocco gomme

## Punto aperto collegato?
- SI
- copertura gomme del report mezzo IA interno

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- `/next/ia/interna*`
- layer clone-safe gomme del Dossier Mezzo

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- I match solo contestuali restano volutamente plausibili e non diventano conferme forti del mezzo.
- Alcuni eventi senza targa diretta o senza contesto coerente possono restare fuori dal report.
- La deduplica con le manutenzioni e prudente: se i campi chiave non coincidono davvero il clone preferisce non fondere i record.

## Build/Test eseguiti
- `npx eslint src/next/domain/nextManutenzioniGommeDomain.ts src/next/domain/nextDossierMezzoDomain.ts src/next/internal-ai/internalAiVehicleReportFacade.ts` - OK
- `npx tsc --noEmit` - OK
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
