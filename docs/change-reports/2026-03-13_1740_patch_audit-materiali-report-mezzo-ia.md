# CHANGE REPORT - Audit e rafforzamento strutturale blocco materiali report mezzo IA interno

## Data
- 2026-03-13 17:40

## Tipo task
- patch

## Obiettivo
- Auditare e rendere piu trasparente il blocco `MATERIALI / MOVIMENTI` del report mezzo IA interno, mantenendo il perimetro clone-safe `read-only` e senza introdurre matching non dimostrati.

## File modificati
- src/next/domain/nextMaterialiMovimentiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_1740_patch_audit-materiali-report-mezzo-ia.md
- docs/continuity-reports/2026-03-13_1740_continuity_materiali-report-mezzo-ia.md

## Riassunto modifiche
- Rafforzato il dominio materiali del clone per distinguere match mezzo/materiale `forti` e `plausibili`, lasciando fuori i collegamenti non dimostrabili o conflittuali.
- Resa esplicita nel report IA interno la copertura reale del blocco materiali e lo stato del filtro periodo (`affidabile`, `parziale`, `non dimostrabile`).
- Aggiornati i documenti di stato del sottosistema IA e del clone con l'esito dell'audit sui dataset reali correnti e con i limiti ancora aperti sui costi materiali.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il report mezzo IA interno riduce il rischio di presentare come certi collegamenti materiali solo plausibili.
- Il clone continua a leggere i dati reali senza riaprire scritture o side effect.
- La copertura materiali resta trasparente anche quando il supporto costi e solo descrittivo.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- sottosistema IA interno
- dossier mezzo clone
- dominio materiali/movimenti clone

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: Coerenza flusso inventario / materiali

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il percorso legacy `destinatario.refId = id mezzo` resta solo plausibile perche non confermato dai record materiali correnti letti in audit.
- Il supporto costi materiali da `@documenti_magazzino` resta descrittivo e non transazionale.

## Build/Test eseguiti
- `npx eslint src/next/domain/nextMaterialiMovimentiDomain.ts src/next/domain/nextDossierMezzoDomain.ts src/next/internal-ai/internalAiVehicleReportFacade.ts` -> OK
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
