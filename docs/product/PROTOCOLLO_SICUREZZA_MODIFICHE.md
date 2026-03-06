# PROTOCOLLO SICUREZZA MODIFICHE

## 1. Scopo
Questo protocollo esiste per evitare patch rischiose, regressioni nascoste e incoerenze tra moduli, dati e architettura.
Serve a imporre un flusso prudente: prima analisi impatto, poi decisione, poi patch.

Problemi che evita:
- modifiche locali che rompono flussi condivisi
- aggiornamenti non allineati a mappa dati e punti aperti
- patch applicate senza valutare effetti su legacy/next

Perche build verde non basta:
- una build puo passare anche se restano incoerenze funzionali, dati o di processo
- il progetto ha dati condivisi e punti aperti critici: serve controllo architetturale oltre al controllo tecnico

## 2. Quando si applica
Il protocollo si applica a:
- ogni patch codice
- ogni refactor
- ogni modifica dati/storage/sessioni
- ogni modifica che tocca piu moduli
- ogni modifica che puo influenzare coerenza architetturale, sicurezza, PDF, IA o dati condivisi

## 3. Controlli obbligatori PRIMA della patch
Codex deve verificare sempre:
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/data/MAPPA_COMPLETA_DATI.md`
4. `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
5. `AGENTS.md`
6. eventuali altri documenti rilevanti per il task

Per ogni task, Codex deve riportare in sintesi almeno:
- moduli coinvolti
- dati coinvolti
- file coinvolti
- rischio modifica
- presenza di punti aperti collegati

## 4. Classificazione del rischio
- **BASSO**: typo, import, path, correzioni minori isolate
- **NORMALE**: UI/CSS isolata, senza effetti su logica dati
- **ELEVATO**: logica dati, Firestore, sessioni, `storageSync`, funzioni condivise
- **EXTRA ELEVATO**: refactor architetturale, nuove chiavi dati, migrazioni, flussi condivisi cross-modulo

## 5. Analisi impatto obbligatoria
Prima di patchare, Codex deve esplicitare:
- cosa puo rompersi
- quali moduli sono impattati
- se tocca contratti dati
- se tocca punti ancora da verificare
- se tocca legacy o next
- se tocca codice condiviso

## 6. Obbligo di proposta soluzione
Se il task e rischioso, Codex non deve fermarsi a \"rischio alto\".
Deve sempre fornire:
- spiegazione del rischio
- soluzione consigliata piu sicura
- almeno 1 alternativa (meglio 2 se presenti)
- decisione operativa proposta

Formato atteso:
- **RISCHIO**
- **IMPATTO**
- **SOLUZIONE CONSIGLIATA**
- **ALTERNATIVE**
- **DECISIONE OPERATIVA**

## 7. Regola di blocco patch cieche
Se il rischio e **ELEVATO** o **EXTRA ELEVATO** e manca una base chiara nei documenti:
- Codex non deve applicare la patch alla cieca
- deve fermarsi
- deve spiegare il motivo
- deve proporre la strada piu sicura

Se serve toccare file fuori whitelist:
- dichiarare solo:
  - `SERVE FILE EXTRA: <path>`

## 8. Controlli obbligatori DOPO la patch
Dopo una patch, Codex deve verificare almeno:
- build/test se applicabili
- import rotti / errori TS se applicabili
- coerenza con documentazione
- eventuali effetti su moduli collegati
- necessita di aggiornare `docs/STATO_ATTUALE_PROGETTO.md`
- necessita di aggiornare `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` se il task chiude o apre un punto

## 9. Output minimo obbligatorio in chat
Dopo ogni patch o proposta rischiosa, Codex deve rispondere in modo breve ma strutturato con:
- task svolto
- file toccati
- rischio
- impatto
- eventuali rischi residui
- build/test eseguiti
- commit hash
- eventuali file extra richiesti

## 10. Principio guida
Meglio fermarsi e proporre una strada sicura che applicare una patch incoerente.
Codex deve agire come operaio prudente, non come esecutore cieco.
