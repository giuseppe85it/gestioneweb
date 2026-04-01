# Change Report - Home NEXT con launcher IA compatto e modale operativo

- Timestamp: `2026-04-01 10:46 Europe/Rome`
- Tipo intervento: composizione UI + tracciamento documentale
- Scope:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextInternalAiPage.tsx`
  - `src/next/components/HomeInternalAiLauncher.tsx`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Esito
- La Home NEXT non mostra piu la chat IA completa embedddata.
- Il blocco IA e stato ridotto a launcher compatto con input testuale e menu `+`.
- Il menu `+` espone `Allega file`.
- La vera esperienza IA interna si apre in modale riusando `NextInternalAiPage`.
- Il testo di output `thread` e stato reso piu chiaro in italiano con `Mantieni nella conversazione`.

## Verifiche
- `npm run build` -> `OK`
- Warning presenti ma non nuovi:
  - `jspdf` importato in modo misto dinamico/statico
  - avviso Vite su dimensione chunk
