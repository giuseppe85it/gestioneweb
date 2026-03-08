# CHANGE REPORT - Check reale `@rifornimenti.items`

## Data
- 2026-03-08 20:33

## Tipo task
- docs

## Obiettivo
- Verificare se il canonico reale `@rifornimenti.items` espone gia un sottoinsieme leggibile dalla NEXT in read-only minima, senza merge col `tmp`.

## File modificati
- docs/data/CHECK_REALE_RIFORNIMENTI_ITEMS.md
- docs/change-reports/2026-03-08_2033_docs_check-reale-rifornimenti-items.md
- docs/continuity-reports/2026-03-08_2033_continuity_d04-rifornimenti-items-check.md

## Riassunto modifiche
- Creato un check dedicato su come `@rifornimenti.items` viene popolato e letto oggi.
- Classificati i campi rilevanti per affidabilita, parziale affidabilita o non affidabilita.
- Formalizzato che esiste un sottoinsieme minimo importabile, ma non coincide ancora col target completo `D04`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Riduzione dell'ambiguita sul prossimo step `D04` della NEXT.
- Base documentale concreta per un eventuale reader minimale su `@rifornimenti.items`.

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
- La lettura diretta del documento live Firestore e fallita per permessi insufficienti; la prova resta quindi repo-driven.
- Il sottoinsieme approvabile non va confuso col target completo di `D04`.

## Build/Test eseguiti
- Lettura read-only del doc `storage/@rifornimenti` via Firebase client SDK -> KO `Missing or insufficient permissions`
- `rg -n "@rifornimenti|buildDossierItem|mezzoTarga|timestamp|costo|autistaNome|badgeAutista|source|validation" src` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
