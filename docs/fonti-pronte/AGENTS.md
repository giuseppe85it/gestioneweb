# AGENTS.md - Regole Operative Codex

## 1. Fonte primaria
- `AGENTS.md` e la guida operativa primaria di Codex in questo repository.
- I documenti di progetto restano fonte di verita per stato, dati, sicurezza e decisioni.
- Se `AGENTS.md` e un report si contraddicono, conta il codice reale del repo e poi la documentazione ufficiale di stato, non il report esecutivo.

## 2. Confini non negoziabili
- Madre intoccabile.
- `src/next/*` e l'unico perimetro sicuro di evoluzione applicativa.
- Nessuna scrittura business reale nel clone senza richiesta esplicita e coerente.
- IA interna isolata sotto `/next/ia/interna*`.
- Nessun riuso runtime dei moduli IA legacy nel nuovo sottosistema IA interna.
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Matching, incroci e claim di parity devono essere strutturali e spiegabili.

## 3. Letture obbligatorie prima di agire
- Sempre: `docs/STATO_ATTUALE_PROGETTO.md`.
- Se il task tocca la NEXT: leggere e poi aggiornare `docs/product/STATO_MIGRAZIONE_NEXT.md`.
- Se il task tocca il clone: aggiornare `docs/product/REGISTRO_MODIFICHE_CLONE.md`.
- Se il task riguarda IA interna: leggere e aggiornare `docs/product/CHECKLIST_IA_INTERNA.md`; leggere anche `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md` e `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`.
- Se il task tocca dati o domini: leggere `docs/data/DOMINI_DATI_CANONICI.md`, `docs/data/MAPPA_COMPLETA_DATI.md`, `docs/data/REGOLE_STRUTTURA_DATI.md`.
- Se il task e architetturale, rischioso o tocca sicurezza: applicare `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md` e leggere gli audit rilevanti.

## 4. Regola anti auto-certificazione
- Un report esecutivo non basta per dichiarare chiuso un modulo.
- Change report e continuity report sono tracciabilita, non prova.
- La prova valida e solo una combinazione di fatti verificati nel repo, tra cui:
  - route e file reali verificati;
  - assenza di mount legacy dove il target richiede autonomia NEXT;
  - parity esterna dimostrata;
  - layer NEXT usati davvero;
  - audit separato quando il task e grande, multi-modulo o sensibile.
- Se la prova non c'e, il modulo non e chiuso.

## 5. Separazione execution / audit
- Execution e audit vanno separati quando il rischio e alto o il perimetro e grande.
- L'execution puo patchare; l'audit non deve patchare runtime.
- L'execution non puo auto-promuoversi a verita finale.
- L'audit deve verificare codice, route, mount, parity esterna, layer e blocchi reali.

## 6. Regola meccanica di chiusura modulo
- Un modulo clone/NEXT e `CHIUSO` solo se tutte le condizioni seguenti sono vere:
  1. la route ufficiale NEXT non monta `NextMotherPage` come runtime finale;
  2. non monta `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale quando il target e autonomia NEXT;
  3. la UI esterna e equivalente alla madre;
  4. i flussi principali sono equivalenti;
  5. i modali principali sono equivalenti;
  6. i report o PDF principali sono equivalenti, se fanno parte del modulo;
  7. sotto usa layer NEXT puliti o chiaramente ripuliti.
- Se una voce critica e `NO`, il modulo non e chiuso.
- Stati ammessi: `CHIUSO`, `APERTO`, `PARZIALE`, `DA VERIFICARE`.

## 7. Regola backlog persistente
- Nei task grandi, backlog o multi-modulo, usare e aggiornare un file backlog persistente nel repo.
- Se il prompt indica gia un backlog file, usare quello.
- Se il prompt non lo indica, usare un file sotto `docs/audit/` con nome esplicito `BACKLOG`.
- Il backlog deve contenere solo:
  - moduli target;
  - stato iniziale;
  - stato finale;
  - blocchi reali;
  - path precisi.

## 8. Divieto di linguaggio plausibile
- Vietato usare formule vuote o auto-promozionali come:
  - `quasi chiuso`
  - `molto avanti`
  - `parity piu stretta`
  - `sostanzialmente chiuso`
  - `fortemente migliorato`
  - `non necessario` usato come scorciatoia
  - `non dimostrato` usato come formula vuota
- Se non e chiuso, va dichiarato aperto.
- Se e solo in parte verificato, va dichiarato `PARZIALE` o `DA VERIFICARE`.

## 9. Regola sui blocchi reali
- Se il task non e chiudibile nel perimetro consentito, fermarsi subito.
- Risposta minima obbligatoria:
  - `SERVE FILE EXTRA: <path>`
- Aggiungere al massimo una riga con motivo tecnico preciso e dimostrabile se il prompt lo consente.
- Non aggirare il blocco con patch laterali.

## 10. Protocollo operativo
- `MODE = OPERAIO` e il default.
- Ogni prompt operativo deve dichiarare numero, agente/modello e livello di ragionamento.
- Prima di patchare: classificare richiesta, perimetro e rischio.
- Modificare solo i file ammessi dal prompt.
- Se il task e documentale, non toccare codice runtime.
- Se il task modifica file del repo, change report e continuity report sono obbligatori.
- Eseguire build o lint solo se il task tocca runtime, logica, contratti o se il prompt lo richiede.
- Se un fatto non e dimostrabile, scrivere `DA VERIFICARE`.

## 11. Rischio e sicurezza
- `BASSO`: typo, import, rename minori, micro-fix.
- `NORMALE`: UI/CSS, composizione, documentazione non critica.
- `ELEVATO`: logica dominio, dati, flussi cross-modulo, IA interna, shared boundary.
- `EXTRA ELEVATO`: architettura, Firebase/Storage, contratti cross-modulo, migrazioni, boundary read-only.
- Con rischio `ELEVATO` o `EXTRA ELEVATO` non si patcha alla cieca: prima analisi impatto, poi patch.

## 12. Divieti permanenti
- Vietato inventare regole, flussi o strutture dati non dimostrate dal repo.
- Vietato chiudere un modulo solo perche il report esecutivo lo dichiara.
- Vietato fare search-and-replace massivi o modifiche globali distruttive.
- Vietato introdurre cambi non richiesti in routing, contratti dati, IA, PDF o sicurezza.

## 13. Formato minimo dei task
- `Obiettivo`
- `Perimetro` o `Whitelist`
- `Output richiesto`

## 14. Chiusura in chat
- Sintesi secca.
- File toccati.
- Rischio e impatto.
- Rischi residui.
- Change report e continuity report creati.
- Commit hash solo se esiste.
## 15. Aggiornamento CONTEXT_CLAUDE.md
- `CONTEXT_CLAUDE.md` nella root è il file di contesto sintetico 
  per l'AI assistant esterno (Claude).
- Dopo ogni patch che modifica uno o più dei seguenti elementi, 
  aggiornare `CONTEXT_CLAUDE.md`:
  - stato di un modulo (APERTO -> PARZIALE -> CHIUSO)
  - nuove route aggiunte o rimosse
  - nuove convenzioni o chiavi Firestore
  - cambi architetturali rilevanti
  - nuovi task completati o aperti
- L'aggiornamento deve essere sintetico e verificato — 
  non copiare log, solo stato attuale.
- Il file non deve superare 400 righe totali.
- Se l'aggiornamento richiederebbe più di 400 righe, 
  sintetizzare eliminando storia superata.

## 16. Cartella `docs/fonti-pronte/`
- `docs/fonti-pronte/` e la raccolta stabile delle fonti piu usate per riaprire il progetto in una nuova chat.
- Deve contenere copie aggiornate dei documenti chiave: stato progetto, stato NEXT, registro clone, contesto Claude, regole operative, sicurezza, procedura madre->clone e i report/audit piu utili del momento.
- Quando un task aggiorna uno dei file sorgente chiave gia specchiati in `docs/fonti-pronte/`, nello stesso task va aggiornata anche la copia corrispondente dentro `docs/fonti-pronte/`.
- Se cambia l'elenco delle fonti pronte, va aggiornato anche `docs/fonti-pronte/00_INDICE_FONTI_PRONTE.md`.
- Una patch documentale che tocca un file sorgente chiave ma lascia stale la sua copia in `docs/fonti-pronte/` non e completa.
