# Change Report - 2026-04-03 1815

## Titolo
Home NEXT collega banner alert reale e launcher IA interna

## Obiettivo
Sostituire nella nuova Home NEXT solo i due placeholder di testata con elementi reali gia esistenti del layer NEXT, senza toccare stat card, widget, route, shell o domain.

## File toccati
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche applicate
- il banner alert della Home legge `readNextCentroControlloSnapshot()` e sintetizza 1-2 segnali prioritari da:
  - `revisioniScadute`
  - `revisioniInScadenza`
  - `conflittiSessione`
  - `segnalazioniNuove`
  - `controlliKo`
- se non emergono segnali prioritari, il banner mostra lo stato neutro `Tutto ok: nessun alert prioritario`;
- il pannello `IA interna` non usa piu il mock chat hardcoded e monta `HomeInternalAiLauncher`;
- il launcher apre il modal reale di `NextInternalAiPage` con la variante `home-modal`;
- gli stili `next-home.css` sono stati ridotti al minimo necessario per il nuovo banner e per l'integrazione del launcher reale.

## Verifica
- `node_modules\.bin\eslint.cmd src/next/NextHomePage.tsx` -> OK
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- risultati:
  - `/next` mostra banner reale `7 revisioni scadute · 2 revisioni in scadenza`
  - il placeholder chat `Ciao, sono operativa...` non e piu presente
  - il bottone `Apri IA` apre il dialog reale `IA interna`
  - nessuna regressione rilevata sui due path shell di controllo

## Limiti
- stat card e widget della Home restano placeholder;
- nessuna modifica a `src/next/domain/*`, `NextShell.tsx`, route o file madre;
- task confinato a lettura dati e integrazione UI read-only della Home.
