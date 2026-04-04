# Continuity Report - 2026-04-03 1844

## Contesto
Task limitato alla nuova Home NEXT per collegare solo tre stat card con metriche reali gia disponibili nei read model NEXT, senza toccare widget, banner, IA, shell, route o domain.

## Stato iniziale verificato
- `NextHomePage.tsx` mostrava quattro stat card placeholder;
- `banner alert` e `pannello IA interna` erano gia stati collegati nel prompt precedente;
- i read model necessari per tre card erano gia disponibili nel repo:
  - `readNextLavoriInAttesaSnapshot()`
  - `readNextProcurementSnapshot()`
  - `readNextCentroControlloSnapshot()`

## Stato finale
- `Lavori aperti`, `Ordini in attesa` e `Segnalazioni` leggono ora dati reali NEXT;
- `Mezzi attivi` resta placeholder invariato, come richiesto;
- nessuna regressione rilevata su banner alert, launcher IA o shell globale.

## Verifiche finali
- `node_modules\.bin\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- esito:
  - su `/next` le tre card richieste mostrano dati reali;
  - `Mezzi attivi` resta `12 / su 15 totali`;
  - banner alert e modal IA continuano a funzionare;
  - nessuna regressione visibile sui due path shell di controllo.

## Perimetro preservato
- nessuna modifica a `src/next/domain/*`, `src/next/NextShell.tsx`, `src/next/next-home.css`, `src/App.tsx` o route file
- nessuna modifica a file madre o moduli `src/autisti/*` / `src/autistiInbox/*`
- nessuna scrittura business, nessun `storageSync`, nessun writer o PDF engine toccato

## Prossimo passo naturale
Prompt dedicato ai widget Home read-only, lasciando fuori la card `Mezzi attivi` finche non esiste una metrica canonica verificata.
