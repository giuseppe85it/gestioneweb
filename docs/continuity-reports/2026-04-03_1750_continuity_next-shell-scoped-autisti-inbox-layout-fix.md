# Continuity Report - 2026-04-03 1750

## Contesto
Task limitato alla shell globale NEXT per correggere il layout full-bleed residuo di `/next/autisti-inbox` e confermare che `/next/autisti-admin` resti corretta.

## Stato iniziale verificato
- `/next/autisti-inbox` usava ancora `.autisti-inbox-wrap` con breakout desktop legacy dentro la shell;
- misure runtime prima del fix:
  - `frameRight = 328`
  - `.autisti-inbox-wrap left = 184`
  - `.autisti-inbox-wrap width = 1392`
- `/next/autisti-admin` era gia corretta grazie all'override scoped esistente su `.autisti-admin-page`.

## Stato finale
- `next-shell.css` contiene ora override scoped per:
  - `.next-shell .autisti-home`
  - `.next-shell .autisti-inbox-wrap`
  - `.next-shell .autisti-layout`
- `/next/autisti-inbox` rientra nel box della shell:
  - `.autisti-inbox-wrap left = 346`
  - `.autisti-inbox-wrap width = 1068`
  - `max-width = 100%`
  - `margin-left = 0`
- `/next/autisti-admin` resta corretta senza nuovi interventi su file legacy.

## Verifiche finali
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next/autisti-inbox`
  - `/next/autisti-admin`
  - `/next/materiali-da-ordinare`
- esito:
  - nessun overlap sidebar/contenuto sui due path autisti
  - nessuna regressione rilevata sul path procurement verificato

## Perimetro preservato
- nessuna modifica a `src/autistiInbox/*`, `src/autisti/*`, `src/pages/*`
- nessuna modifica a `src/next/NextShell.tsx`, `src/App.tsx`, route, domain, dati o writer
- fix confinato a `src/next/next-shell.css` e tracciabilita documentale

## Prossimo passo naturale
Audit visivo separato della shell globale su tutte le route autisti/inbox secondarie se si vuole confermare che non esistano altri wrapper legacy full-bleed oltre la home inbox.
