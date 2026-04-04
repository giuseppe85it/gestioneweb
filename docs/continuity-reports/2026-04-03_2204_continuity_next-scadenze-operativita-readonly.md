# Continuity Report - 2026-04-03 22:04

## Stato Finale
- `Scadenze` resta un solo modale globale nel subtree `/next`.
- Il sistema ora copre sia la vista elenco sia la fase operativa madre-like read-only.
- La conferma finale di ogni operazione resta bloccata e non produce scritture reali.

## Flussi Disponibili
- `PRENOTA` / `MODIFICA` / `CANCELLA` prenotazione collaudo
- `PRE-COLLAUDO` / `MODIFICA`
- `SEGNA REVISIONE FATTA`

## Garanzie Preserve
- Nessuna route nuova.
- Nessun `setItemSync`.
- Nessun update su `@mezzi_aziendali`.
- Nessuna modifica a `NextShell.tsx`, `nextData.ts`, `NextHomePage.tsx` o `NextCentroControlloPage.tsx`.

## Fix Data
- Il parsing date del domain D10 non affida piu i formati ambigui italiani a `Date.parse()` prima della normalizzazione esplicita.
- Stringhe `gg/mm/26` vengono trattate come anno 2026.
- I delta giorni e gli stati riga risultano coerenti su date future.

## Verifiche Eseguite
- `eslint` sui file TS/TSX toccati -> `OK`
- `npm run build` -> `OK`
- Runtime locale con browser headless -> `OK`
