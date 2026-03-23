# Titolo intervento
Aggiornamento AGENTS.md con regole operative su modello/agente e livello di ragionamento

## Data
2026-03-23 07:06

## Tipo task
docs

## Obiettivo
Rendere obbligatoria in `AGENTS.md` la dichiarazione iniziale di modello/agente e livello di ragionamento nei prompt futuri per Codex, con criteri sintetici di scelta coerenti col progetto.

## File modificati
- `AGENTS.md`
- `docs/change-reports/2026-03-23_0706_docs_agents-model-reasoning-rules.md`
- `docs/continuity-reports/2026-03-23_0706_continuity_agents-model-reasoning-rules.md`

## Riassunto modifiche
- Inserita in `AGENTS.md` una nuova sezione `Regole operative per i prompt Codex`.
- Reso obbligatorio che ogni prompt futuro dichiari:
  - modello/agente;
  - livello di ragionamento;
  - numerazione del prompt.
- Aggiunte regole pratiche per scegliere tra `GPT-5.4 mini` e `GPT-5.4 standard`.
- Aggiunta classificazione operativa dei livelli `BASSO`, `NORMALE`, `ELEVATO`, `EXTRA ELEVATO`.
- Aggiunta regola anti-spreco per evitare uso eccessivo di modello/livello su task non proporzionati.

## File extra richiesti
Nessuno.

## Impatti attesi
- Prompt futuri piu coerenti e meno ambigui.
- Riduzione di uso improprio di modello e ragionamento.
- Allineamento stabile tra rischio del task e profondita richiesta a Codex.

## Rischi/attenzione
- Nessun impatto runtime.
- Da ricordare che questa regola integra, ma non sostituisce, whitelist, classi di rischio e vincoli gia presenti in `AGENTS.md`.
- Worktree gia sporco per modifiche precedenti non toccate in questo task.

## Build/Test eseguiti
N/A - task solo documentale.

## Commit hash
NON ESEGUITO

## Stato finale
Completato.
