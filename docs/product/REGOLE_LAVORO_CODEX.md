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
2. Se il task tocca la NEXT, leggere anche `docs/product/STATO_MIGRAZIONE_NEXT.md`.
3. Prima di importare, ricostruire o migrare un modulo nella NEXT, verificare il dominio corrispondente in `docs/data/DOMINI_DATI_CANONICI.md`.
4. Se il dominio non e mappato, e incoerente o ha stato `SENSIBILE`, `DA VERIFICARE` o `BLOCCANTE PER IMPORTAZIONE`, fermarsi e dichiararlo prima di patchare.
5. Distinguere sempre dominio logico, dataset fisico, writer/reader legacy e target NEXT.
6. Se un flusso del gestionale madre funziona gia in produzione e non va rotto, la prima scelta NON deve essere modificare il runtime legacy ma verificare un layer di normalizzazione dedicato nella NEXT.
7. La NEXT deve leggere i dati reali del madre, normalizzarli in un modello pulito interno e far leggere solo quel modello a UI, Dossier e IA.
8. Un dominio con sorgenti legacy sporche non va bloccato automaticamente se esiste una normalizzazione NEXT possibile, controllata e documentata senza toccare il madre.
9. Se si propone una modifica al runtime legacy, bisogna motivare chiaramente perche il layer di normalizzazione NEXT non basta.
10. Leggere tutto il repository quando serve contesto completo.
11. Modificare solo i file ammessi dal prompt (whitelist).
12. Non inventare: se un fatto non e dimostrabile scrivere `DA VERIFICARE` o `NON DIMOSTRATO`.
13. Non cambiare codice applicativo se il task e documentale.
14. Non introdurre cambi architetturali in conflitto con blueprint ufficiale.
15. Prima di ogni patch applicare `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`.
16. Se rischio ELEVATO/EXTRA ELEVATO: niente patch cieche; obbligo di analisi impatto + proposta soluzione + alternative.
17. Ogni task che tocca la NEXT deve aggiornare `docs/product/STATO_MIGRAZIONE_NEXT.md`; se non viene aggiornato, il motivo va dichiarato esplicitamente.

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
7. **Se il task tocca la NEXT, aggiornare `docs/product/STATO_MIGRAZIONE_NEXT.md`** prima della chiusura del task.
8. **Chiudere con report breve** (file toccati, punti aperti, commit hash se richiesto).

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
3. `docs/data/DOMINI_DATI_CANONICI.md`
4. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
5. `docs/data/MAPPA_COMPLETA_DATI.md`
6. `docs/data/REGOLE_STRUTTURA_DATI.md`
7. `docs/security/SICUREZZA_E_PERMESSI.md`
8. `docs/architecture/FUNZIONI_TRASVERSALI.md`
9. `docs/product/STORICO_DECISIONI_PROGETTO.md`

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
- Se la patch o il task modifica lo stato di una area NEXT (shell, UI, read-only, scrittura, legacy temporaneo), aggiornare subito `docs/product/STATO_MIGRAZIONE_NEXT.md`.

---

## 8) Distinzione obbligatoria tra stato progetto, tracker NEXT e report task
- `docs/STATO_ATTUALE_PROGETTO.md`: quadro generale del progetto, fase corrente, priorita e rischi trasversali.
- `docs/product/STATO_MIGRAZIONE_NEXT.md`: registro permanente dell'avanzamento della nuova app NEXT per area/modulo.
- `docs/change-reports/_TEMPLATE_CHANGE_REPORT.md`: traccia del singolo task svolto.
- `docs/continuity-reports/_TEMPLATE_CONTINUITY_REPORT.md`: passaggio di contesto tra sessioni o task successivi.

Questi documenti non sono intercambiabili:
- aggiornare solo il change report non basta a tenere allineato lo stato della NEXT;
- aggiornare solo `STATO_ATTUALE_PROGETTO` non basta a sapere quali moduli NEXT sono shell, read-only o scriventi;
- il tracker NEXT deve restare il riferimento operativo per la migrazione.

---

## 9) Formato risposta Codex (raccomandato)
1. File creati/modificati.
2. Cosa e stato coperto (sezioni/moduli).
3. Rischio e impatto.
4. Punti ancora `DA VERIFICARE` o `NON DIMOSTRATO`.
5. Comandi di verifica eseguiti (se richiesti).
6. Commit hash (se richiesto).

---

## 10) Template prompt minimo (riuso)
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

