# Change Report - 2026-04-02 22:06

## Obiettivo
Chiudere altro delta top-level del procurement convergente su `/next/materiali-da-ordinare`, riallineando tab, sottoviste, riepiloghi, footer e passaggi utente alla madre senza toccare il domain NEXT pulito.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- `NextMaterialiDaOrdinarePage.tsx`
  - tab top-level riallineate a `Ordine materiali`, `Ordini`, `Arrivi`, `Prezzi & Preventivi`, `Listino Prezzi`;
  - badge contatori reali sulle tab e chip live su `Dettaglio ordine`;
  - riepilogo top-level con stato `SOLA LETTURA`, descrizione pratica della vista attiva e contatori coerenti con il dataset procurement;
  - placeholder ricerca e CTA header resi coerenti con la vista corrente;
  - footer `Ordine materiali` esteso anche a `Listino Prezzi`.
- `NextProcurementConvergedSection.tsx`
  - shell top-level documentale piu vicina alla madre `Acquisti`;
  - `Prezzi & Preventivi` reso piu simile al `Registro Preventivi` madre-like;
  - `Listino Prezzi` reso vista top-level esplicita e non solo toggle implicito;
  - riepiloghi, filtri e footer azioni coerenti con il passaggio pratico tra tutte le viste procurement del modulo unico.

## Layer dati preservato
- Non toccati:
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/domain/nextProcurementDomain.ts`
- Confermate come uniche sorgenti dati:
  - `readNextFornitoriSnapshot()`
  - `readNextProcurementSnapshot()`
- Non reintrodotti:
  - letture raw legacy di `@ordini`, `@preventivi`, `@listino_prezzi`
  - `storageSync`
  - `materialImages`
  - mount runtime di `src/pages/*`

## Limiti residui
- `PATCH PARZIALE`: il procurement top-level resta `PARZIALE`, non `CHIUSO`.
- Restano fuori parity totale:
  - writer business reali della madre;
  - caricamento preventivi reale;
  - edit business 1:1 di `Prezzi & Preventivi` e `Listino Prezzi`.

## Verifiche
- `npm run build` -> `OK`
- `npx eslint src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementConvergedSection.tsx` -> `OK`
- `npm run lint` -> `KO` per errori preesistenti diffusi fuori scope in piu moduli legacy/NEXT non toccati dal prompt
