# Continuity Report

- Data: 2026-04-03 22:29
- Modulo: shell globale NEXT
- Continuita garantita su:
  - routing ufficiale invariato;
  - nessuna modifica a pagine NEXT o legacy;
  - nessun impatto su domain, writer o storage.

## Stato prima
- `Mezzi aziendali` e `Motrici e trattori` aprivano entrambi `/next/mezzi`.

## Stato dopo
- `Mezzi aziendali` apre `/next/mezzi`.
- `Motrici e trattori` apre `/next/dossiermezzi`.

## Note operative
- Fix limitato al catalogo nav in `src/next/nextData.ts`.
- Nessun file fuori whitelist toccato.
