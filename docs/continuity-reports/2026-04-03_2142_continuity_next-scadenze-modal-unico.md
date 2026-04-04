# Continuity Report - 2026-04-03 21:42

## Stato Finale
- Esiste un solo modale globale `Scadenze` nel subtree `/next`.
- Sidebar `Scadenze` e banner alert Home aprono lo stesso modale cambiando solo il query param iniziale:
  - `?scadenze=tutte`
  - `?scadenze=urgenti`
- Il modale resta read-only e usa solo `readNextCentroControlloSnapshot()`.

## Query Param Contract
- `scadenze=tutte` -> elenco completo revisioni ordinato per `giorni` crescente.
- `scadenze=urgenti` -> filtro locale revisioni con `giorni <= 30` e non completate.
- Chiusura modale -> rimozione del query param `scadenze`, con permanenza sulla route corrente.

## File Chiave
- `src/next/components/NextScadenzeModal.tsx`
- `src/next/NextShell.tsx`
- `src/next/nextData.ts`
- `src/next/NextHomePage.tsx`
- `src/next/next-shell.css`

## Vincoli Preservati
- Nessuna route nuova.
- Nessun writer reale su prenotazione collaudo, pre-collaudo o revisione fatta.
- Nessun riuso runtime di `NextCentroControlloPage`.
- Nessun file fuori whitelist toccato.

## Verifiche Eseguite
- `eslint` sui file TS/TSX toccati -> `OK`
- `npm run build` -> `OK`
- Runtime locale con browser headless -> `OK`
