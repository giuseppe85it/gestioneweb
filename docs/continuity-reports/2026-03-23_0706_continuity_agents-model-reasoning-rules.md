# Contesto operativo da riportare in nuova chat

## Stato sintetico
- `AGENTS.md` ora rende obbligatorio che ogni prompt futuro per Codex dichiari:
  - modello/agente;
  - livello di ragionamento;
  - numerazione del prompt.
- Le regole introdotte distinguono in modo operativo tra:
  - `GPT-5.4 mini` per task piccoli e basso rischio;
  - `GPT-5.4 standard` per logica, architettura, IA, dati, multi-file e task a rischio medio/alto.
- I livelli di ragionamento sono ora esplicitati con criteri pratici:
  - `BASSO`
  - `NORMALE`
  - `ELEVATO`
  - `EXTRA ELEVATO`

## Vincoli da non rompere
- Nessuna modifica alla madre.
- Nessuna scrittura business.
- Nessun segreto lato client.
- Tutti i testi visibili in UI devono restare in italiano.
- Restano obbligatori whitelist, change report e continuity report quando si modifica il repository.

## Impatto operativo
- I prompt futuri devono partire con intestazione chiara su modello e ragionamento.
- Le richieste su Firebase, Storage, IA interna profonda, boundary read-only e multi-agent devono usare `GPT-5.4 standard | EXTRA ELEVATO`.
- I micro-fix grafici e i task piccoli possono usare `GPT-5.4 mini`, evitando sprechi.

## File rilevanti
- `AGENTS.md`
- `docs/change-reports/2026-03-23_0706_docs_agents-model-reasoning-rules.md`

## Punti aperti
- Nessun punto aperto tecnico.
- La regola va solo applicata con costanza nei prompt futuri.

## Stato handover
Pronto per nuova chat.
