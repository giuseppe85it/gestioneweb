# REGOLE LAVORO CODEX

Versione: 2026-03-06  
Scopo: regole operative per futuri task Codex su GestioneManutenzione.

## 1) Ruoli fissi del progetto
- **Utente**: logica/business/realta operativa.
- **ChatGPT**: CTO/architetto, struttura e strategia.
- **Codex**: esecuzione operativa (analisi repo, documentazione, patch su whitelist).

Questi ruoli sono **fonte di verita operativa** e non vanno reinterpretati caso per caso.

---

## 2) Regole non negoziabili per Codex
1. Ogni nuovo prompt/patch/task deve partire leggendo `docs/STATO_ATTUALE_PROGETTO.md`.
2. Leggere tutto il repository quando serve contesto completo.
3. Modificare solo i file ammessi dal prompt (whitelist).
4. Non inventare: se un fatto non e dimostrabile scrivere `DA VERIFICARE` o `NON DIMOSTRATO`.
5. Non cambiare codice applicativo se il task e documentale.
6. Non introdurre cambi architetturali in conflitto con blueprint ufficiale.
7. Prima di ogni patch applicare `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`.
8. Se rischio ELEVATO/EXTRA ELEVATO: niente patch cieche; obbligo di analisi impatto + proposta soluzione + alternative.

---

## 3) Sequenza standard di lavoro
1. **Classificare richiesta** (UI, logica, refactor, sicurezza, dati, docs-only).
2. **Raccogliere prove** da codice/docs con riferimenti a file/funzione.
3. **Separare fatti da proposte**:
   - Fatti: [CONFERMATO]
   - Ipotesi aperte: [DA VERIFICARE] / [NON DIMOSTRATO]
   - Target: [RACCOMANDAZIONE]
4. **Analisi impatto obbligatoria prima della patch**:
   - cosa puo rompersi
   - moduli impattati
   - contratti dati toccati o no
   - legacy o next
   - punti aperti collegati
5. **Applicare patch solo dopo allineamento al blueprint**.
6. **Verificare output** (coerenza file whitelist, eventuali test/comandi richiesti).
7. **Chiudere con report breve** (file toccati, punti aperti, commit hash se richiesto).

---

## 4) Classificazione richieste (obbligatoria)

### A) UI / UX
- Obiettivo: sitemap, journeys, inventory, redesign docs.
- Vincolo: non cambiare logica dati senza richiesta esplicita.

### B) Logica business
- Obiettivo: comportamento moduli/flow.
- Vincolo: citare impatto su data contract e flussi cross-modulo, distinguendo legacy vs next.

### C) Refactor tecnico
- Obiettivo: migliorare struttura codice.
- Vincolo: no refactor globale non richiesto, no rename massivi.

### D) Sicurezza / permessi
- Obiettivo: hardening authz/authn/audit.
- Vincolo: distinguere sempre stato attuale vs target raccomandato.

### E) Dati / contratti
- Obiettivo: chiavi/collection/schema/relazioni.
- Vincolo: ogni modifica deve essere compatibile con migrazione e legacy.

### F) Docs-only
- Obiettivo: consolidare fonte di verita nel repository.
- Vincolo: nessuna modifica `src/` o logica runtime.

---

## 5) Allineamento al blueprint ufficiale

Documenti baseline da rispettare:
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
4. `docs/data/MAPPA_COMPLETA_DATI.md`
5. `docs/data/REGOLE_STRUTTURA_DATI.md`
6. `docs/security/SICUREZZA_E_PERMESSI.md`
7. `docs/architecture/FUNZIONI_TRASVERSALI.md`
8. `docs/product/STORICO_DECISIONI_PROGETTO.md`

Se una richiesta rompe coerenza con questi documenti:
- Codex deve segnalarlo esplicitamente prima di patchare.
- Se il cambio e voluto, va prima registrata decisione in `STORICO_DECISIONI_PROGETTO`.

---

## 6) Protocollo sicurezza modifiche (obbligatorio)
- Nei task rischiosi Codex deve rispondere con formato:
  - `RISCHIO`
  - `IMPATTO`
  - `SOLUZIONE CONSIGLIATA`
  - `ALTERNATIVE`
  - `DECISIONE OPERATIVA`
- Se manca base chiara nei documenti e rischio alto, Codex si ferma e non patcha alla cieca.
- Se serve toccare file fuori whitelist: `SERVE FILE EXTRA: <path>`.

---

## 7) Regola patch
- Patch codice ampie solo dopo blueprint confermata.
- Prima fase preferita: read-only + documentazione + chiusura `DA VERIFICARE`.
- Evoluzione nuova app: progressiva e in parallelo alla legacy.
- Se la patch cambia stato reale/progressione progetto: suggerire aggiornamento `docs/STATO_ATTUALE_PROGETTO.md`.
- Se la patch apre o chiude un dubbio: suggerire aggiornamento `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`.

---

## 8) Formato risposta Codex (raccomandato)
1. File creati/modificati.
2. Cosa e stato coperto (sezioni/moduli).
3. Rischio e impatto.
4. Punti ancora `DA VERIFICARE` o `NON DIMOSTRATO`.
5. Comandi di verifica eseguiti (se richiesti).
6. Commit hash (se richiesto).

---

## 9) Template prompt minimo (riuso)
```
MODE = OPERAIO

OBIETTIVO
<chiaro e misurabile>

VINCOLI
- Non modificare src/ (salvo whitelist esplicita)
- Non inventare: usare DA VERIFICARE/NON DIMOSTRATO

WHITELIST
- <file1>
- <file2>

OUTPUT RICHIESTI
- <deliverable 1>
- <deliverable 2>

PASSI FINALI
- git status
- commit "<messaggio>"

RISPOSTA ATTESA IN CHAT (BREVE)
- <elenco richiesto>
```

