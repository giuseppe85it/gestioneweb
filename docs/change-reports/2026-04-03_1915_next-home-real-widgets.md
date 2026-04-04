# Change Report - 2026-04-03 1915

## Titolo
Home NEXT collega tre widget reali con read model NEXT gia esistenti

## Obiettivo
Sostituire nella Home NEXT solo i widget `Motrici e trattori`, `Rimorchi` e `Lavori aperti` con dati reali NEXT, lasciando invariato `Magazzino` e senza toccare stat card, banner, IA, route, shell o domain.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche applicate
- `Motrici e trattori` usa `readNextCentroControlloSnapshot().motriciTrattoriDaMostrare` e rende fino a 3 righe reali con:
  - `targa`
  - `luogo`
  - `statusLabel`
- `Rimorchi` usa `readNextCentroControlloSnapshot().rimorchiDaMostrare` e rende fino a 3 righe reali con:
  - `targa`
  - `luogo`
  - `statusLabel`
- `Lavori aperti` usa `readNextLavoriInAttesaSnapshot()` e rende fino a 3 righe reali ricavate dai gruppi con:
  - `descrizione`
  - `mezzoTarga` / `targa`
  - `urgenza`
- la CTA `Tutti ->` del widget lavori punta ora a `/next/lavori-in-attesa`;
- `Magazzino` resta invariato come placeholder;
- `next-home.css` aggiunge solo lo stile minimale per uno stato vuoto sobrio dei widget.

## Verifica
- `node_modules\.bin\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- risultati su `/next`:
  - `Motrici e trattori` -> dati reali da `motriciTrattoriDaMostrare`, CTA `/next/mezzi`
  - `Rimorchi` -> dati reali da `rimorchiDaMostrare`, CTA disabilitata
  - `Lavori aperti` -> dati reali, CTA `/next/lavori-in-attesa`
  - `Magazzino` -> placeholder invariato
  - stat card, banner alert e modal IA ancora funzionanti

## Limiti
- `Magazzino` resta placeholder per semantica mista inventario/procurement;
- nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route o file madre;
- il task resta confinato alla Home read-only.
