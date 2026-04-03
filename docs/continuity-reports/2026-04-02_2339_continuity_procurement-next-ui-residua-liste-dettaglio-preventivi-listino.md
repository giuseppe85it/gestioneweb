# Continuity Report - 2026-04-02 23:39

## Stato iniziale
- La shell top-level di `Acquisti` era gia stata portata nel clone NEXT.
- Restavano pero quattro delta UI residui e visibili:
  - menu azioni secondarie mancanti su `Ordini` / `Arrivi`;
  - resa finale del `Dettaglio ordine` ancora diversa dalla madre su header e tabella;
  - `Prezzi & Preventivi` ancora non ricostruito come `Registro Preventivi`;
  - `Listino Prezzi` ancora non ricostruito con la tabella e le azioni esterne della madre.

## Stato finale
- `Ordini` / `Arrivi` espongono ora `Apri` + `AZIONI` e usano lo stato visivo madre per tab.
- `Dettaglio ordine` ha testata e riepilogo esterno piu fedeli a `Acquisti`, senza pill o hint clone-only non presenti nella madre.
- `Prezzi & Preventivi` e `Listino Prezzi` hanno ora shell esterna madre-like dentro il runtime NEXT, con filtri, tabelle, CTA e menu azioni visibili coerenti con `Acquisti`.

## Rischi residui
- Il modulo resta `PARZIALE`:
  - i side effect reali della madre non sono stati riaperti;
  - `Nuovo preventivo`, import listino, modifica listino, eliminazioni e parte del dettaglio restano clone-safe;
  - la parity 1:1 e quindi esterna/visiva, non comportamentale completa sui writer.

## Prossimo passo consigliato
- Se si vuole chiudere altro delta reale restando clone-safe, il prossimo passo utile e separare con precisione i micro-comportamenti ancora non 1:1 da `src/pages/Acquisti.tsx` dentro:
  - `src/next/NextProcurementReadOnlyPanel.tsx` per i writer bloccati di `Ordini` / `Dettaglio ordine`;
  - `src/next/NextProcurementConvergedSection.tsx` per i workflow completi di `Nuovo preventivo` e `Modifica voce listino`.
