# Change Report - 2026-04-03 22:04

## Obiettivo
Portare il sistema `Scadenze` NEXT da sola lettura a fase operativa madre-like per revisioni / collaudi / pre-collaudi, mantenendo il clone in read-only e correggendo il bug reale di parsing data/delta.

## File Toccati
- `src/next/components/NextScadenzeModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche Applicate
- Esteso `NextScadenzeModal` con superfici operative interne allo stesso contenitore:
  - `Prenotazione collaudo`
  - `Pre-collaudo`
  - `Segna revisione fatta`
  - `Cancella prenotazione`
- Aggiunte sulle righe le CTA madre-like `PRENOTA`, `MODIFICA`, `CANCELLA`, `PRE-COLLAUDO`, `SEGNA REVISIONE FATTA`.
- Il blocco read-only avviene solo al momento di `Salva` / `Cancella`, con messaggio esplicito e senza scritture reali.
- Corretto nel domain D10 il parsing delle date:
  - parsing esplicito `YYYY-MM-DD`
  - parsing esplicito `gg/mm/aa(aa)`
  - fallback generico solo dopo i formati noti
- Il delta giorni e lo stato riga ora trattano correttamente le date future 2026.

## Verifiche
- `node_modules\.bin\eslint.cmd src/next/components/NextScadenzeModal.tsx src/next/domain/nextCentroControlloDomain.ts` -> `OK`
- `npm run build` -> `OK`
- Runtime locale:
  - `/next?scadenze=tutte` -> una revisione futura `07/07/2026` mostra `tra 95 giorni` e stato `REVISIONE`
  - `Prenota` -> blocco read-only finale confermato
  - `Pre-collaudo` -> blocco read-only finale confermato
  - `Segna revisione fatta` -> blocco read-only finale confermato
  - `Cancella` prenotazione -> CTA visibile nelle righe con prenotazione attiva

## Boundary
- Nessuna modifica a route o shell.
- Nessun riuso runtime di `NextCentroControlloPage`.
- Nessun writer business riaperto.
