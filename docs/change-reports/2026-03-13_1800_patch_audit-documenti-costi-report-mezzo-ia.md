# CHANGE REPORT - Audit e rafforzamento strutturale blocco documenti-costi report mezzo IA interno

## Data
- 2026-03-13 18:00

## Tipo task
- patch

## Obiettivo
- Auditare e rendere piu trasparente il blocco `DOCUMENTI / COSTI / PERIMETRO ECONOMICO` del report mezzo IA interno, mantenendo il perimetro clone-safe `read-only` e senza mescolare documenti diretti, snapshot analitici e workflow procurement.

## File modificati
- src/next/domain/nextDocumentiCostiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_1800_patch_audit-documenti-costi-report-mezzo-ia.md
- docs/continuity-reports/2026-03-13_1800_continuity_documenti-costi-report-mezzo-ia.md

## Riassunto modifiche
- Rafforzato il dominio documenti-costi del clone per dichiarare meglio il proprio perimetro: documenti/costi diretti si, snapshot analitico separato, procurement e approvazioni fuori layer mezzo-centrico.
- Resa esplicita nel report IA interno la separazione tra documenti/costi diretti, snapshot `@analisi_economica_mezzi` e workflow `@preventivi` / `@preventivi_approvazioni`.
- Aggiunta trasparenza sul filtro periodo dei documenti/costi diretti, senza usare lo `updatedAt` dello snapshot analitico come data evento del costo.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il report mezzo IA interno riduce il rischio di falsa completezza economica.
- Il clone continua a leggere i dati reali senza riaprire scritture o side effect.
- Il perimetro economico resta dichiarato come parziale quando procurement o approvazioni non entrano nel blocco base del report.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- sottosistema IA interno
- dossier mezzo clone
- dominio documenti/costi clone

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: Contratto finale allegati preventivi

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
- `@costiMezzo` e vuoto nei dati correnti, quindi il blocco economico diretto oggi dipende dai soli `@documenti_mezzi`.
- `@documenti_magazzino` resta una fonte parziale senza targa diretta e non va promossa a documento economico certo del mezzo.
- `@preventivi` e `@preventivi_approvazioni` restano volutamente fuori dal blocco base del report mezzo.

## Build/Test eseguiti
- `npx eslint src/next/domain/nextDocumentiCostiDomain.ts src/next/domain/nextDossierMezzoDomain.ts src/next/internal-ai/internalAiVehicleReportFacade.ts` -> OK
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
