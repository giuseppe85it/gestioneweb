# CHANGE REPORT - Audit tecnico D04 rifornimenti per futura lettura NEXT read-only

## Data
- 2026-03-08 20:19

## Tipo task
- docs

## Obiettivo
- Fotografare il flusso reale dei rifornimenti e capire se esiste oggi un sottoinsieme dati leggibile dalla NEXT senza usare tolleranze legacy.

## File modificati
- docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md
- docs/change-reports/2026-03-08_2019_docs_audit-rifornimenti-next-readonly.md
- docs/continuity-reports/2026-03-08_2019_continuity_d04-rifornimenti-audit.md

## Riassunto modifiche
- Creato un audit dedicato al dominio `D04 Rifornimenti e consumi`.
- Documentato il flusso reale `app autisti/admin -> tmp -> proiezione dossier -> letture legacy`.
- Formalizzato che oggi non esiste ancora un sottoinsieme importabile per la NEXT senza fallback, merge o shape legacy.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Maggiore chiarezza architetturale sul dominio `D04`.
- Base decisionale per evitare import sporchi dei rifornimenti nella NEXT.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Documentazione dati
- Decisione futura Dossier Mezzo NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- DA VERIFICARE

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- DA VERIFICARE

## Stato migrazione dopo
- DA VERIFICARE

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il gestionale madre continua a funzionare grazie a tolleranze legacy che la NEXT non deve replicare.
- Il dataset business `@rifornimenti` non garantisce ancora da solo il contratto target documentato.

## Build/Test eseguiti
- `rg -n "buildDossierItem|@rifornimenti|@rifornimenti_autisti_tmp|value.items|timestamp|importo|costo|mezzoTarga|targaCamion" src/autisti/Rifornimento.tsx src/autistiInbox/AutistiAdmin.tsx src/pages/DossierMezzo.tsx src/pages/RifornimentiEconomiaSection.tsx src/utils/storageSync.ts src/utils/homeEvents.ts` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
