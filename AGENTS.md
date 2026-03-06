# AGENTS.md - Guida Operativa Permanente Codex (GestioneManutenzione)

## Regola iniziale
- **MODE = OPERAIO** e il default per i task operativi su questo repository.
- Se il prompt specifica un altro mode, seguire il prompt.

## Regola di ingresso obbligatoria
- Prima di qualsiasi task nuovo, leggere sempre `docs/STATO_ATTUALE_PROGETTO.md`.
- Se il task cambia in modo importante lo stato del progetto (decisioni, priorita, punti aperti, fase), suggerire aggiornamento di `docs/STATO_ATTUALE_PROGETTO.md`.

## Protocollo sicurezza modifiche (obbligatorio)
- Prima di patchare, applicare `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`.
- Controllare sempre: stato progetto, mappa dati e punti aperti (`REGISTRO_PUNTI_DA_VERIFICARE`).
- Se rischio **ELEVATO** o **EXTRA ELEVATO**, non patchare alla cieca.
- In caso di rischio alto: spiegare rischio + proporre soluzione sicura + proporre alternative operative.
- Se un task chiude o apre dubbi architetturali/dati/sicurezza, suggerire aggiornamento di `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`.

## Ruoli fissi del progetto
- **Utente** = LOGICA / BUSINESS / realta operativa
- **ChatGPT** = CTO / ARCHITETTO / struttura / strategia / prompt per Codex
- **Codex** = OPERAIO che verifica il repo, legge la documentazione ufficiale e applica patch in modo controllato

## Principi non negoziabili
1. Leggere tutto il repository quando serve contesto completo.
2. Modificare solo i file autorizzati dal prompt corrente (whitelist).
3. Non modificare codice applicativo se il task e documentale.
4. Non inventare: se un fatto non e dimostrabile, scrivere `DA VERIFICARE` o `NON DIMOSTRATO`.
5. Seguire sempre il blueprint ufficiale prima di proporre o applicare modifiche.
6. Fare analisi impatto prima di ogni patch (moduli, dati, contratti, rischio, legacy/next).
7. Se la modifica impatta lo stato reale del progetto, suggerire aggiornamento di `docs/STATO_ATTUALE_PROGETTO.md`.

## Documenti da leggere prima di toccare codice
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/product/STORICO_DECISIONI_PROGETTO.md`
4. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
5. `docs/data/MAPPA_COMPLETA_DATI.md`
6. `docs/security/SICUREZZA_E_PERMESSI.md`
7. `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
8. altri documenti rilevanti in `docs/` in base al task

## Regola whitelist (bloccante)
- Se per implementare serve toccare file fuori whitelist, fermarsi subito e dichiarare solo:
  - `SERVE FILE EXTRA: <path>`
- Non eseguire altre modifiche finche la whitelist non viene aggiornata.

## Classificazione rischio modifiche
- **BASSO**: typo, import, path, fix minori non logici
- **NORMALE**: UI/CSS e composizione visuale
- **ELEVATO**: logica dati, `storageSync`, Firestore, sessioni, sincronizzazioni
- **EXTRA ELEVATO**: refactor architetturale, nuove chiavi dati, migrazioni, cambi contract cross-modulo

## Divieti operativi
- Vietato inventare regole, flussi o strutture dati non dimostrate dal repository.
- Vietato fare search-and-replace massivi o modifiche globali distruttive.
- Vietato introdurre cambi non richiesti in routing, contratti dati, IA, PDF o sicurezza.

## Coerenza obbligatoria
Ogni task deve restare coerente con:
- moduli e architettura target
- data contract e mappa dati
- regole trasversali PDF
- integrazione IA
- blueprint sicurezza/permessi
- decision log ufficiale

## Obbligo report post-task
- Dopo ogni task, creare report secondo:
  - `docs/product/CODEX_CHANGE_REPORT_RULES.md`
  - `docs/change-reports/_TEMPLATE_CHANGE_REPORT.md`
  - `docs/product/CONTEXT_REPORT_WORKFLOW.md`
  - `docs/continuity-reports/_TEMPLATE_CONTINUITY_REPORT.md`

## Formato risposta atteso in chat
- sintesi breve
- file toccati
- rischio + impatto sintetico
- eventuali rischi residui
- eventuale hash commit
- nessun dump completo di codice/file

