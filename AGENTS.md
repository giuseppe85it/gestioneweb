# AGENTS.md - Guida Operativa Permanente Codex (GestioneManutenzione)

## Regola iniziale
- **MODE = OPERAIO** e il default per i task operativi su questo repository.
- Se il prompt specifica un altro mode, seguire il prompt.

## Regola di ingresso obbligatoria
- Prima di qualsiasi task nuovo, leggere sempre `docs/STATO_ATTUALE_PROGETTO.md`.
- Se il task cambia in modo importante lo stato del progetto (decisioni, priorita, punti aperti, fase), suggerire aggiornamento di `docs/STATO_ATTUALE_PROGETTO.md`.
- Se il task tocca la NEXT (shell, pagine, moduli, importazioni, stato read-only/scrittura), leggere e aggiornare `docs/product/STATO_MIGRAZIONE_NEXT.md`.

## Regola dominio-centrica per la NEXT (obbligatoria)
- Prima di importare, ricostruire o migrare qualsiasi modulo nella NEXT, verificare sempre il dominio corrispondente in `docs/data/DOMINI_DATI_CANONICI.md`.
- Se il dominio non e mappato, e incoerente, e segnato `SENSIBILE`, `DA VERIFICARE` o `BLOCCANTE PER IMPORTAZIONE`, fermarsi e dichiararlo esplicitamente prima di patchare o importare.
- Non importare nella NEXT strutture dati legacy incoerenti senza normalizzazione documentata.
- Distinguere sempre:
  - dominio logico
  - dataset fisico
  - writer/reader legacy
  - target NEXT
- `docs/data/MAPPA_COMPLETA_DATI.md` e `docs/data/REGOLE_STRUTTURA_DATI.md` vanno usati dopo il controllo dominio-centrico, non al suo posto.

## Regola layer di normalizzazione NEXT (obbligatoria)
- Se un flusso del gestionale madre funziona gia in produzione e non va rotto, la prima scelta NON deve essere modificare il runtime legacy.
- La prima scelta deve essere verificare se la NEXT puo leggere i dati reali del madre tramite un reader/layer di normalizzazione dedicato e separato.
- Il layer NEXT deve distinguere sempre:
  - sorgente legacy reale
  - regole di normalizzazione
  - modello pulito interno NEXT
  - UI/Dossier/IA che leggono solo il modello pulito
- Un dominio con dati legacy sporchi NON va bloccato automaticamente se esiste una normalizzazione NEXT possibile, controllata e documentabile senza toccare il madre.
- Se Codex propone una modifica al runtime legacy invece del layer NEXT, deve motivare in modo esplicito perche la normalizzazione NEXT non basta.
- La parita utile col madre va ottenuta nella NEXT tramite mapping e normalizzazione controllata, non copiando fallback, merge euristici o shape sporche dentro UI e Dossier NEXT.

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
8. Ogni task che tocca la NEXT deve aggiornare `docs/product/STATO_MIGRAZIONE_NEXT.md`; se il modulo/area cambia stato, Codex deve registrarlo.
9. Se un task NEXT non aggiorna `docs/product/STATO_MIGRAZIONE_NEXT.md`, Codex deve spiegare esplicitamente perche.

## Documenti da leggere prima di toccare codice
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/data/DOMINI_DATI_CANONICI.md`
4. `docs/product/STORICO_DECISIONI_PROGETTO.md`
5. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
6. `docs/data/MAPPA_COMPLETA_DATI.md`
7. `docs/data/REGOLE_STRUTTURA_DATI.md`
8. `docs/security/SICUREZZA_E_PERMESSI.md`
9. `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
10. altri documenti rilevanti in `docs/` in base al task
11. `docs/product/STATO_MIGRAZIONE_NEXT.md` quando il task tocca la nuova app NEXT

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
- domini dati canonici
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
- Nei task NEXT, change report e continuity report non sostituiscono il registro permanente `docs/product/STATO_MIGRAZIONE_NEXT.md`.

## Formato risposta atteso in chat
- sintesi breve
- file toccati
- rischio + impatto sintetico
- eventuali rischi residui
- eventuale hash commit
- nessun dump completo di codice/file

