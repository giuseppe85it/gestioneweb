# CHANGE REPORT - Audit e decisione strutturale perimetro procurement report mezzo IA interno

## Data
- 2026-03-13 19:48

## Tipo task
- patch

## Obiettivo
- Auditare il perimetro reale `procurement / preventivi / approvazioni` rispetto al report mezzo IA interno e fissare una decisione strutturale chiara, senza promuovere match deboli a collegamenti certi.

## File modificati
- src/next/domain/nextDocumentiCostiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_1948_patch_audit-procurement-perimetro-report-mezzo-ia.md
- docs/continuity-reports/2026-03-13_1948_continuity_procurement-perimetro-report-mezzo-ia.md

## Riassunto modifiche
- Aggiunto un supporto read-only nel dominio documenti-costi per leggere separatamente `storage/@preventivi` e `storage/@preventivi_approvazioni` e misurare il livello reale di collegamento col mezzo.
- Esteso il composito dossier con il nuovo stato `procurementPerimeter`, poi usato dal report IA per mostrare decisione di perimetro, conteggi reali e limiti strutturali.
- Reso esplicito che il procurement non entra oggi nel blocco economico diretto del report mezzo: i documenti/costi diretti restano separati, lo snapshot analitico resta separato e le approvazioni compaiono solo come overlay read-only.
- Corretta anche la valorizzazione del composito dossier, che dopo l'aggiunta del nuovo campo non compilava piu in TypeScript.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il report mezzo IA interno non da piu l'impressione che il workflow procurement sia coperto in modo completo o certo.
- Il clone continua a leggere dati reali in sola lettura, con maggiore trasparenza su cio che e diretto, cio che e snapshot e cio che resta fuori perimetro.
- Le future decisioni su procurement potranno partire da un audit strutturale gia tracciato, senza scorciatoie lato UI.

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
- `storage/@preventivi` contiene oggi 7 record ma nessuno espone una targa diretta del mezzo.
- `storage/@preventivi_approvazioni` puo avere collegamento forte alla targa, ma sui dati correnti annota un documento diretto in `@documenti_mezzi` e non prova copertura procurement nativa del mezzo.
- Il procurement puo entrare nel report solo come supporto parziale separato se emergera in futuro un match forte mezzo-centrico; oggi la decisione corretta resta `fuori_perimetro`.

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
