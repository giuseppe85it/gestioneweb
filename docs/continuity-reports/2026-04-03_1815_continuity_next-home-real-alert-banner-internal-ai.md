# Continuity Report - 2026-04-03 1815

## Contesto
Task limitato alla nuova Home NEXT per rimuovere solo i placeholder del banner alert e del pannello IA interna, mantenendo invariati stat card, widget, shell globale, route e domain.

## Stato iniziale verificato
- `src/next/NextHomePage.tsx` mostrava un banner statico hardcoded;
- il pannello `IA interna` era una chat mock locale senza collegamento alla UI reale;
- il launcher reale `HomeInternalAiLauncher` e il read model `readNextCentroControlloSnapshot()` esistevano gia nel repo ma non erano usati dalla Home.

## Stato finale
- la Home legge ora lo snapshot reale del centro controllo e compone un banner sintetico con segnali prioritari;
- il pannello `IA interna` usa il launcher reale e apre `NextInternalAiPage` in modal;
- stat card e widget restano intenzionalmente invariati e ancora placeholder.

## Verifiche finali
- `node_modules\.bin\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- esito:
  - su `/next` il banner e reale e il launcher apre il dialog `IA interna`
  - su `/next/autisti-inbox` e `/next/materiali-da-ordinare` non risultano regressioni shell visibili

## Perimetro preservato
- nessuna modifica a `src/next/domain/*`, `src/next/NextShell.tsx`, `src/App.tsx` o route file
- nessuna modifica a file madre o a moduli `src/autisti/*` / `src/autistiInbox/*`
- nessuna scrittura business, nessun `storageSync`, nessuna modifica a writer o PDF engine

## Prossimo passo naturale
Prompt dedicato al collegamento dati reali delle stat card e dei widget della Home NEXT, lasciando invariato il layer shell e mantenendo separato il perimetro IA gia agganciato.
