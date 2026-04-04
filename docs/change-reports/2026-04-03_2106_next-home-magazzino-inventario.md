# Change Report - 2026-04-03 2106 - next-home-magazzino-inventario

## Perimetro
- `src/next/NextHomePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Obiettivo
- Riallineare il widget `Magazzino` della Home NEXT alla sola semantica `Inventario`, eliminando i placeholder misti con procurement.

## Modifiche applicate
- importato `readNextInventarioSnapshot()` nella Home NEXT;
- esteso il caricamento iniziale della Home con la snapshot inventario read-only;
- sostituito il blocco placeholder `Magazzino` con righe reali basate su:
  - `descrizione`
  - `quantita`
  - `unita`
  - `fornitore`
  - `stockStatus`
- riallineata la CTA del widget a `Vai -> /next/inventario`.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextHomePage.tsx` -> `OK`
- `npm run build` -> `OK`
- runtime locale:
  - `/next` -> widget `Magazzino` con righe reali inventario, CTA `/next/inventario`, nessun placeholder procurement;
  - `/next/inventario` -> `OK`;
  - `/next/materiali-da-ordinare` -> `OK`.

## Note
- nessuna modifica a domain, shell, route, file madre o procurement;
- `next-home.css` non e stato toccato per questa patch.
