# METODO_AGENTI.md — Manuale operativo dei 4 agenti

## 1. Scopo del file

Questo file e il manuale operativo su **come** usare al meglio i 4 agenti AI del
workflow (Codex, Claude Code, Claude in chat, GPT in chat). E un file di METODO:
reasoning level, struttura dei prompt, scelta dell'agente giusto, pattern di workflow.
E universale e riusabile in progetti futuri.

Lo legge Giuseppe e lo legge ogni agente architetto a inizio chat.
Va aggiornato **quando cambia un metodo**, non quando cambia una decisione di prodotto.

Confine netto con gli altri due file di governo:
- `AGENTS.md` = regole operative runtime degli agenti (cosa possono/non possono fare).
- `docs/DIARIO_DECISIONI.md` = decisioni di prodotto e perimetro, append-only.
- `METODO_AGENTI.md` (questo) = come si lavora con gli agenti.

Questo file **cita** `AGENTS.md` e `DIARIO_DECISIONI.md`, non ne replica i contenuti.

## 2. Mappa degli agenti

| Agente | Cosa fa al meglio | Quando NON usarlo |
|---|---|---|
| **Codex** | Executor: patch chirurgiche, refactor mirati, mega-prompt cascata multi-fase | Audit indipendente, brainstorm architetturale, second opinion |
| **Claude Code** | Audit profondi del repo, plan mode, cross-verify post-Codex, subagents | Patchare runtime quando ha ruolo di audit (vedi `AGENTS.md` sez. 5) |
| **Claude in chat** | Architetto + prompt engineer: design prompt, SPEC, brainstorm | Esecuzione codice diretta, audit repo profondo |
| **GPT in chat** | Architetto + prompt engineer, intercambiabile con Claude in chat | Esecuzione codice diretta, audit repo profondo |

Regola base: **chi esegue non si auto-certifica**. Execution e audit vanno su agenti
diversi quando il rischio e alto o il perimetro e grande (`AGENTS.md` sez. 5).

Codex e Claude Code possono entrambi orchestrare **sub-agent paralleli**: per Codex
vedi 3.9 (multi-agent), per Claude Code vedi 4.3 (`.claude/agents/`).

## 3. Esecutori: Codex

### 3.1 Quando scegliere Codex
- Patch chirurgiche e refactor mirati con perimetro file gia definito.
- Mega-prompt a cascata multi-fase con checkpoint chiari.
- Task dove sai gia *cosa* va fatto e *dove*: serve esecuzione, non esplorazione.
- Se non sai ancora la struttura giusta, prima `/plan` (3.5) o audit con Claude Code.

### 3.2 Reasoning level (regola ufficiale OpenAI)
Il reasoning level va scelto in base alla complessita reale del task, non "per
sicurezza". Extra High su un microfix e spreco; Low su un refactor esteso e fragile.

| Reasoning | Quando | Taglia tipica | Esempio |
|---|---|---|---|
| **Low** | Microfix, task ben circoscritti (≤3 file) | S | typo, import, rename minore |
| **Medium** | Cambi complessi, debugging | M | fix logica UI, bug propagazione campi |
| **High** | Refactor estesi, logica di dominio | M-L | repunt lettori cross-modulo |
| **Extra High** | Mega-prompt cascata, multi-ora, architetturali | L | dismissione Lavori NEXT |

Incrocia questa tabella con la classificazione rischio di `AGENTS.md` sez. 11
(BASSO / NORMALE / ELEVATO / EXTRA ELEVATO): rischio alto e taglia grande tirano
entrambi verso l'alto il reasoning level.

### 3.3 Struttura prompt obbligatoria (i 4 elementi OpenAI)
Ogni prompt operativo per Codex deve contenere, espliciti:
1. **Goal** — cosa cambiare o costruire, in una frase.
2. **Context** — file rilevanti, errori noti, vincoli, fonte di verita.
3. **Constraints** — standard, architettura, convenzioni, divieti del task.
4. **Done when** — criteri verificabili di completamento (build verde, test, output atteso).

Un prompt senza "Done when" verificabile produce auto-certificazione: vietata da
`AGENTS.md` sez. 4.

### 3.4 Sintassi prompt operativi del progetto
Formato standard usato in questo progetto (e da riusare nei prossimi):
- **Delimitatori `~~~` tilde**, mai backtick: i prompt contengono spesso backtick
  interni (path, codice) e i backtick romperebbero il blocco.
- **Header obbligatorio** dentro il blocco: `>>> DA INCOLLARE IN: Codex`.
- **Meta-info FUORI dal blocco tilde**: modello/agente, reasoning level, fonte di verita.
  Codex non deve incollarsele come istruzioni.
- **Italiano sempre**, in tutto il prompt.
- **Perimetro file in whitelist esplicita**: blocchi `CREA` / `MODIFICA` / `NON TOCCARE`.
- **Divieti espliciti del task** + eventuali comandi iniziali obbligatori.
- **Output strutturato finale** richiesto: `PASS/FAIL` + file toccati + checkpoint/rischi.
- **Numerazione progressiva**: ogni prompt operativo del progetto e numerato (PROMPT 9,
  PROMPT 10, ...). La numerazione e continua attraverso le sessioni e identifica
  univocamente il prompt nei report e nei diari. Riprendere dal numero piu alto in
  `DIARIO_DECISIONI.md` o `REGISTRO_MODIFICHE_CLONE.md`.

Il formato minimo dei task (`Obiettivo` / `Perimetro` / `Output richiesto`) e gia in
`AGENTS.md` sez. 13: qui lo si arricchisce, non lo si sostituisce.

### 3.5 /plan mode di Codex
Quando il task e ambiguo, multi-file, o non sai bene quale sia la struttura giusta:
non scrivere subito un mega-prompt. Usa `/plan` di Codex.
- Codex propone un piano, tu lo approvi, poi esegue.
- Risparmia un round di audit-first manuale: Codex vede il codice mentre pianifica.
- Da preferire ogni volta che staresti per "indovinare" il perimetro.

### 3.6 /goal per task multi-ora
Per task lunghi (multi-ora, multi-fase) Codex puo lavorare in autonomia verso una
**stopping condition verificabile** con `/goal`.
- Funziona solo se la condizione di stop e oggettiva (build verde, N file processati,
  test passano).
- Esempio dal progetto: PROMPT 23 (chiusura a fasi "Z" della dismissione Lavori) era
  un candidato tipico: piu fasi in cascata con checkpoint hard.

### 3.7 AGENTS.md vs prompt: cosa va dove
- In **`AGENTS.md`**: decisioni durature, divieti perenni, formato dei task, confini
  non negoziabili. Si scrivono una volta.
- Nel **prompt**: eccezioni specifiche del task, perimetro stretto, checkpoint di quel
  lavoro.
- Errore tipico: ricopiare i divieti permanenti in ogni prompt. E spreco di token e
  rende il prompt illeggibile. Il prompt **rimanda** ad `AGENTS.md`, non lo duplica.

### 3.8 Backup e sicurezza
Codex **non ha checkpoint nativi** come Claude Code (4.5). Prima di un task di taglia L:
- Backup obbligatorio in `C:\tmp\<nome_task>_<timestamp>\`.
- Un backup ben fatto si riusa per piu prompt della stessa saga: nella dismissione
  Lavori NEXT il backup `C:\tmp\dismissione_lavori_final_20260513_111149` e stato
  riusato per tutta la coda di prompt finali.
- Se il task lo fa Claude Code, il backup manuale non serve: ci sono i checkpoint (4.5).

### 3.9 Multi-agent di Codex

Codex puo eseguire workflow multi-agent: un **main agent** orchestra, dei **sub-agent**
lavorano in parallelo su sotto-task e ritornano riassunti al main invece di tutto
l'output grezzo.

#### Perche serve
Anche con context window grandi, un main agent inondato di log esplorativi, output di
test, stack trace degrada nel tempo (context pollution / context rot, vedi
https://research.trychroma.com/context-rot). I sub-agent isolano questo rumore: il main
resta lucido su requisiti, decisioni e output finale.

#### Quando usarlo
- Task di lettura/esplorazione su piu superfici in parallelo (audit di mappatura,
  discovery quantitativa, riepiloghi su collection diverse).
- Task dove il volume di output grezzo intermedio rischia di saturare il main thread.

#### Quando NON usarlo
- Patch vere e proprie (modifica file): OpenAI raccomanda di evitare workflow di
  scrittura parallela. Sub-agent che editano lo stesso codice generano conflitti.
- Task piccoli e mono-superficie: l'overhead non vale la pena.

#### Modelli e reasoning per sub-agent
- `gpt-5.3-codex-spark`: piu veloce, leggero. Per esplorazione, scan in lettura,
  riassunti rapidi.
- `gpt-5.3-codex`: piu robusto. Per sub-agent che propongono o applicano edit (raro nel
  nostro workflow).
- Reasoning `medium` come default; `high` solo se il sub-agent deve tracciare logica
  complessa o casi limite.

#### Esempi candidati dal nostro storico
- PROMPT 22 (mappatura 35 file residui in 6 categorie): un sub-agent per categoria.
- PROMPT 34 fase F1 (audit interno mappa file:riga): un sub-agent per superficie
  (Manutenzioni / Centro Controllo / Dossier / Chat IA).
- PROMPT 33 (discovery doppioni gomme): un sub-agent legge `@manutenzioni`, uno
  `@gomme_eventi`, il main fa il match.

#### Comando
`/agent` in CLI per ispezionare e switchare fra agent thread. Riferimento ufficiale:
https://developers.openai.com/codex/concepts/multi-agents e
https://developers.openai.com/codex/multi-agent.

## 4. Esecutori: Claude Code

### 4.1 Quando scegliere Claude Code
- Audit profondi del repo: legge molti file in serie e tiene il filo.
- Cross-verify indipendente dopo una patch di Codex (separazione execution/audit).
- Plan mode quando serve esplorare il codice prima di proporre.
- Quando vuoi subagent specializzati con tool e modello dedicati.

### 4.2 Plan mode nativo (`/plan` o Esc+Tab)
Pre-step da usare per ogni task non banale.
- Claude Code legge il codice, fa domande, propone un piano, tu approvi, poi esegue.
- Differenza con l'audit-first manuale: piu veloce, perche vede il codice direttamente
  invece di lavorare su un audit gia scritto.
- In plan mode Claude Code non modifica nulla finche non approvi.

### 4.3 `.claude/agents/` — subagents specializzati
File `.md` con frontmatter YAML (`name`, `description`, `tools`, `model`,
`permissionMode`). Un subagent ha contesto, tool e modello propri: il main context
resta pulito.
Candidati utili per questo progetto:
- `audit-flusso-cross-collection` — audit che attraversano piu collection Firestore.
- `cross-verify-execution` — il verificatore indipendente post-Codex.
- `codex-prompt-writer` — genera prompt operativi nel formato di 3.4.

### 4.4 `.claude/commands/` — slash commands riusabili
Workflow ripetuti, pacchettizzati come `/nome-comando`.
Candidati per questo progetto: `/handoff` (passaggio contesto a chat nuova),
`/dismetti-modulo` (pattern dismissione), `/cross-verifica` (lancio cross-audit).

### 4.5 Checkpoints nativi
Ogni azione di Claude Code e un checkpoint automatico.
- `/rewind` o Esc+Esc per tornare indietro.
- Sostituisce il backup manuale `C:\tmp\` (3.8) **per i task fatti da Claude Code**.
  Per i task fatti da Codex il backup manuale resta obbligatorio.

### 4.6 /compact vs /clear
- `/compact` — comprime la cronologia mantenendo i punti chiave. Da usare **dentro**
  uno stesso task lungo, quando il contesto si appesantisce.
- `/clear` — reset totale. Da usare **fra task indipendenti**, per non trascinare
  contesto inutile.

### 4.7 Permission mode
- `bypassPermissions` — per repo trusted; e la configurazione attuale di Giuseppe.
- `plan` / `acceptEdits` / `default` — per casi specifici dove serve piu controllo
  sulle singole azioni.

## 5. Architetti in chat: Claude e GPT

### 5.1 Funzione condivisa
- Brainstorm architetturale.
- Design dei prompt operativi per Codex / Claude Code.
- Validazione delle SPEC prima della consegna a un executor.
- Second opinion su decisioni grandi.

### 5.2 Interscambiabilita
Claude in chat e GPT in chat sono **intercambiabili** come architetti.
- Puoi costruire un prompt con uno e validarlo con l'altro.
- Se i due sono in disaccordo, decide il project owner (Giuseppe).

### 5.3 Dual-architect (doppio parere)
Usare i due architetti in parallelo quando:
- Decisione architetturale grande (es. macchina di chiusura ciclo eventi).
- SPEC importante prima della consegna a Codex.
- Cross-audit di un mega-prompt prima che parta.

### 5.4 Quando NON usarli
- Esecuzione codice diretta → Codex o Claude Code.
- Microfix che possono andare diretti a Codex.
- Audit del repo profondo → Claude Code.

### 5.5 Come passare contesto a un architetto in chat
- Caricare i file di project knowledge: `AGENTS.md`, `DIARIO_DECISIONI.md`,
  `METODO_AGENTI.md`, `CLAUDE_CHAT_BEHAVIOR.md`.
- Consegnare un pacchetto self-contained: problema + dati rilevanti + decisioni gia prese.
- Mai assumere che l'architetto ricordi le conversazioni precedenti: la memoria fra
  chat e parziale.

### 5.5.1 Pattern di apertura nuova chat architetto
Il primo messaggio in chat orienta enormemente: project knowledge da solo non basta.
Pattern consigliato:
"Ciao. Riparto dal lavoro su <task>. Stato attuale: <2 righe>. File chiave caricati:
<lista>. Ultime decisioni: <3-5 bullet da DIARIO_DECISIONI>. Prossimo passo:
<obiettivo>. Riprendi da qui."
Esempio reale: README del package handoff 2026-05-04.

### 5.6 Segnali che la chat e satura → apri chat nuova
- Errori di path/file ripetuti.
- Dimenticanze evidenti ("non ti ricordi che...").
- Risposte verbose e ripetitive.
Soluzione: chat nuova. Il project knowledge fa il lavoro di ricostruzione del contesto.

## 6. Workflow combinati tipici

Pattern emersi dalla storia reale del progetto (PROMPT 9-34).

### 6.1 Audit-first → SPEC → Patch → Cross-verify
1. Claude Code fa l'audit (read-only).
2. Un architetto (Claude o GPT) scrive la SPEC.
3. Codex patcha seguendo la SPEC.
4. Claude Code fa il cross-verify indipendente.
Esempio storico: dismissione Lavori NEXT — audit user-journey → `SPEC_DISMISSIONE` →
PROMPT 9-25 → cross-audit Claude Code (vedi `docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md`).

### 6.2 Mega-prompt cascata
Codex esegue piu fasi con checkpoint hard. **Primo fail = STOP totale**, niente
proseguimento alla cieca.
Esempio: PROMPT 23 (chiusura a fasi "Z" della dismissione) — STOP a Z3 su path
`operazioniAgent` errato, rilancio mirato in PROMPT 24, nuovo STOP a Z5 su 3 errori
build, fix in PROMPT 25. La cascata regge perche ogni STOP e reale e verificabile.

### 6.3 Dual-audit per CHIUSO 100%
Un modulo si dichiara `CHIUSO` solo a **dual-OK**: auto-report di Codex **e** cross-audit
indipendente di Claude Code, entrambi verdi. Vale la regola anti auto-certificazione di
`AGENTS.md` sez. 4 e la regola meccanica di chiusura di `AGENTS.md` sez. 6.
Esempio: modulo Anagrafiche NEXT chiuso al 100% il 2026-04-24 con doppio audit
Codex + Claude Code concorde su tutti i 10 punti della checklist.

### 6.4 Discovery quantitativa prima di SPEC
Quando i numeri reali contano (es. quanti doppioni storici esistono), prima di scrivere
la SPEC si fa una discovery: script read-only → report numerico → SPEC informata.
Esempio: `docs/_live/DISCOVERY_DOPPIONI_GOMME_2026-05-14.md` — 75 record `@manutenzioni`,
2 daFare gomme, 1 match in finestra 0-30gg, 1 orfano. La SPEC successiva nasce sui
numeri reali, non su stime.

## 7. Errori da non ripetere

- Reasoning Extra High su un microfix → spreco. Usa la tabella 3.2.
- Mega-prompt monolitici per task di taglia S → fragili. Spezzali o usali per task L.
- Divieti permanenti ricopiati in ogni prompt → vanno in `AGENTS.md`, non nel prompt.
- Path assunti senza verifica → sempre `ls`/`view` prima. E la regola "Esplorazione
  prima di asserzione" (Zero-Invenzioni) di `AGENTS.md`.
- Backup dimenticati → backup obbligatorio (Codex) o checkpoint nativo (Claude Code).
- Chat satura ignorata → apri chat nuova ai primi segnali (5.6).
- Saltare l'audit interno prima di un mega-prompt → rilanci ciechi. La catena di STOP
  PROMPT 19-24 della dismissione e nata anche da whitelist non verificate prima.
- Mischiare execution e audit nello stesso agente → separarli (`AGENTS.md` sez. 5).

## 8. Riferimenti incrociati

File di governo del progetto:
- `AGENTS.md` — regole operative runtime degli agenti. Lettura obbligatoria per
  Codex e Claude Code prima di agire.
- `docs/DIARIO_DECISIONI.md` — decisioni di prodotto e perimetro, append-only.
- `CLAUDE_CHAT_BEHAVIOR.md` — come deve comportarsi Claude in chat su questo progetto.

Fonti ufficiali (best practices confermate):
- Codex best practices — https://developers.openai.com/codex/learn/best-practices
- Codex prompting — https://developers.openai.com/codex/prompting
- Long-horizon tasks con Codex — https://developers.openai.com/blog/run-long-horizon-tasks-with-codex
- Codex multi-agent — https://developers.openai.com/codex/concepts/multi-agents
- Codex multi-agent setup — https://developers.openai.com/codex/multi-agent
- Context rot research (Chroma) — https://research.trychroma.com/context-rot
- Claude Code best practices — https://code.claude.com/docs/en/best-practices
- Scrivere un buon CLAUDE.md — https://www.humanlayer.dev/blog/writing-a-good-claude-md
