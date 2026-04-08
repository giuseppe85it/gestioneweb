# Change Report

- Timestamp: `2026-04-08 10:01:31`
- Task: audit differenziale finale `/next/manutenzioni` vs `SPEC_MANUTENZIONI_UI_NEXT.md`

## Diff residui trovati

- Header: testo eyebrow non identico alla spec (`Operativita` invece di `Operatività`).
- Header: la select mezzo era filtrata dalla ricerca invece di restare lista completa dei mezzi aziendali.
- Nuova / Modifica: erano ancora presenti bottoni extra sotto il submit, non previsti dal layout della spec.

## Correzioni applicate

- Allineato il testo `man2-eyebrow` a `Operatività`.
- Riallineata `man2-select-mezzo` alla lista completa `mezzi`.
- Rimossi i bottoni extra residui dal form `Nuova / Modifica`.

## Perimetro rispettato

- `src/next/NextManutenzioniPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`
