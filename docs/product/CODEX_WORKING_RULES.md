# CODEX WORKING RULES

Versione: 2026-03-06  
Scopo: regole operative per futuri task Codex su GestioneManutenzione.

## 1) Ruoli fissi del progetto
- **Utente**: logica/business/realta operativa.
- **ChatGPT**: CTO/architetto, struttura e strategia.
- **Codex**: esecuzione operativa (analisi repo, documentazione, patch su whitelist).

Questi ruoli sono **fonte di verita operativa** e non vanno reinterpretati caso per caso.

---

## 2) Regole non negoziabili per Codex
1. Leggere tutto il repository quando serve contesto completo.
2. Modificare solo i file ammessi dal prompt (whitelist).
3. Non inventare: se un fatto non e dimostrabile scrivere `DA VERIFICARE` o `NON DIMOSTRATO`.
4. Non cambiare codice applicativo se il task e documentale.
5. Non introdurre cambi architetturali in conflitto con blueprint ufficiale.

---

## 3) Sequenza standard di lavoro
1. **Classificare richiesta** (UI, logica, refactor, sicurezza, dati, docs-only).
2. **Raccogliere prove** da codice/docs con riferimenti a file/funzione.
3. **Separare fatti da proposte**:
   - Fatti: [CONFERMATO]
   - Ipotesi aperte: [DA VERIFICARE] / [NON DIMOSTRATO]
   - Target: [RACCOMANDAZIONE]
4. **Applicare patch solo dopo allineamento al blueprint**.
5. **Verificare output** (coerenza file whitelist, eventuali test/comandi richiesti).
6. **Chiudere con report breve** (file toccati, punti aperti, commit hash se richiesto).

---

## 4) Classificazione richieste (obbligatoria)

### A) UI / UX
- Obiettivo: sitemap, journeys, inventory, redesign docs.
- Vincolo: non cambiare logica dati senza richiesta esplicita.

### B) Logica business
- Obiettivo: comportamento moduli/flow.
- Vincolo: citare impatto su data contract e flussi cross-modulo.

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
1. `docs/PROJECT_MASTER_BLUEPRINT.md`
2. `docs/architecture/NEXT_APP_ARCHITECTURE.md`
3. `docs/data/DATA_MASTER_MAP.md`
4. `docs/data/DATA_CONTRACT_MASTER.md`
5. `docs/security/SECURITY_AND_PERMISSIONS_BLUEPRINT.md`
6. `docs/architecture/CROSS_CUTTING_CONCERNS.md`
7. `docs/product/PROJECT_DECISIONS_LOG.md`

Se una richiesta rompe coerenza con questi documenti:
- Codex deve segnalarlo esplicitamente prima di patchare.
- Se il cambio e voluto, va prima registrata decisione in `PROJECT_DECISIONS_LOG`.

---

## 6) Regola patch
- Patch codice ampie solo dopo blueprint confermata.
- Prima fase preferita: read-only + documentazione + chiusura `DA VERIFICARE`.
- Evoluzione nuova app: progressiva e in parallelo alla legacy.

---

## 7) Formato risposta Codex (raccomandato)
1. File creati/modificati.
2. Cosa e stato coperto (sezioni/moduli).
3. Punti ancora `DA VERIFICARE` o `NON DIMOSTRATO`.
4. Comandi di verifica eseguiti (se richiesti).
5. Commit hash (se richiesto).

---

## 8) Template prompt minimo (riuso)
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
