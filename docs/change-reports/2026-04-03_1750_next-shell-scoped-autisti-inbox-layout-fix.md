# Change Report - 2026-04-03 1750

## Titolo
Fix CSS scoped shell NEXT per `autisti-inbox` e conferma `autisti-admin`

## Obiettivo
Correggere il root layout di `/next/autisti-inbox` dentro la shell globale NEXT, mantenendo corretta `/next/autisti-admin`, senza toccare CSS legacy o altri file runtime.

## File toccati
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Causa reale verificata
- Nel contesto shell, `.autisti-inbox-wrap` manteneva ancora il breakout desktop legacy:
  - `width: min(1500px, calc(100vw - 48px))`
  - `margin-left: calc(50% - 50vw + 24px)`
  - `margin-right: calc(50% - 50vw + 24px)`
- In runtime questo produceva:
  - `.autisti-inbox-wrap` larga `1392px`
  - `left = 184`
  - contenuto shell a partire da `left = 328`

## Modifiche applicate
- aggiunti override scoped su:
  - `.next-shell .autisti-home`
  - `.next-shell .autisti-inbox-wrap`
  - `.next-shell .autisti-layout`
- proprietà forzate dove serviva:
  - `width: 100% !important`
  - `max-width: 100% !important`
  - `min-width: 0 !important`
  - `margin-left: 0 !important`
  - `margin-right: 0 !important`
  - `left: auto !important`
  - `right: auto !important`
  - `transform: none !important`
  - `box-sizing: border-box !important`

## Verifica
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next/autisti-inbox`
  - `/next/autisti-admin`
  - `/next/materiali-da-ordinare`
- risultati:
  - `/next/autisti-inbox` -> `.autisti-inbox-wrap` a `1068px`, `left = 346`, nessun overlap con la sidebar
  - `/next/autisti-admin` -> `.autisti-admin-page` resta a `left = 328`, nessun overlap
  - `/next/materiali-da-ordinare` -> nessuna regressione shell/layout rilevata

## Limiti
- patch stretta e solo CSS scoped nella shell NEXT;
- nessuna modifica a file legacy, route, dati o componenti runtime fuori whitelist.
