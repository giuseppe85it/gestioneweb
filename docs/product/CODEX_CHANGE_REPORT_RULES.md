# CODEX CHANGE REPORT RULES

Versione: 2026-03-06  
Scopo: definire regole uniche per i mini report post-task.

## 1) Quando creare il change report
Creare un report quando il task produce almeno una modifica su file di repository:
- task documentale (`docs/*`)
- patch codice
- fix, refactor mirato, hardening sicurezza, aggiornamento dati/contratti

Se il task e solo analisi in chat senza file modificati, report `DA VERIFICARE` in base al prompt.

## 2) Dove salvarlo
- Cartella: `docs/change-reports/`
- Template base: `docs/change-reports/_TEMPLATE_CHANGE_REPORT.md`

## 3) Convenzione nome file
Formato obbligatorio:
- `YYYY-MM-DD_HHMM_<tipo>_<slug>.md`

Regole:
- `YYYY-MM-DD` = data locale task
- `HHMM` = ora locale 24h
- `<tipo>` = `docs` | `patch` | `fix` | `refactor` | `sicurezza` | `ui` | `dati`
- `<slug>` = descrizione breve in kebab-case

Esempio:
- `2026-03-06_1915_docs_master-blueprint-update.md`

## 4) Cosa deve contenere
Usare sempre le sezioni del template:
1. Titolo intervento
2. Data
3. Tipo task
4. Obiettivo
5. File modificati
6. Riassunto modifiche
7. File extra richiesti
8. Impatti attesi
9. Rischi/attenzione
10. Build/Test eseguiti
11. Commit hash
12. Stato finale

## 5) Cosa NON deve contenere
- codice completo
- diff completo
- log lunghi non filtrati
- dati sensibili o credenziali
- testo ridondante non utile alla continuita

## 6) Differenza tra task documentale e task con patch codice
- **Task documentale**:
  - focus su documenti creati/aggiornati
  - rischio prevalente: coerenza architetturale/documentale
  - test tecnici spesso `NON ESEGUITO` o `N/A`
- **Task con patch codice**:
  - focus su impatto funzionale e regressioni
  - includere build/test/lint (se eseguiti)
  - indicare aree dati/sicurezza toccate

## 7) Fonti da usare per compilare il report
1. prompt/task ricevuto
2. file toccati reali (`git status`, `git diff --name-only`)
3. esiti build/test/lint (se richiesti/eseguiti)
4. commit finale (hash e messaggio)
5. eventuali vincoli blueprint rilevanti

## 8) Regola di qualita minima
- Linguaggio semplice e sintetico.
- Ogni affermazione deve essere verificabile nel task svolto.
- Se un dato non e disponibile: scrivere `DA VERIFICARE` o `NON TROVATO`.
