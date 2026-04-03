# Continuity Report - 2026-04-02 23:09

## Stato iniziale
- La shell top-level di `/next/materiali-da-ordinare` era gia riallineata a `src/pages/Acquisti.tsx`.
- Restava pero un delta strutturale reale: `Ordini`, `Arrivi` e parte del `Dettaglio ordine` passavano ancora dal ramo convergente come superficie principale, quindi l'utente non vedeva queste tre viste nella stessa gabbia `Acquisti`.

## Stato finale
- `Ordini`, `Arrivi` e `Dettaglio ordine` vengono ora renderizzati direttamente nella shell `Acquisti` del modulo unico:
  - stesso contenitore `acq-content`;
  - stessi titoli visibili madre per `Ordini in attesa` e `Ordini arrivati`;
  - stessa presenza del tab live `Dettaglio ordine` dentro il canvas principale.
- `NextProcurementConvergedSection` resta fuori dal percorso visivo principale di queste tre viste e continua a coprire solo `Prezzi & Preventivi` e `Listino Prezzi`.

## Rischi residui
- Il modulo resta `PARZIALE`:
  - la lista ordini/arrivi non espone ancora tutte le azioni secondarie della madre;
  - il dettaglio ordine resta locale clone-safe e non persistente sui writer business reali;
  - `Prezzi & Preventivi` e `Listino Prezzi` restano consultivi clone-safe.

## Prossimo passo consigliato
- Se si vuole chiudere altro delta reale senza toccare il domain, il passo successivo piu naturale e:
  - rifinire in `src/next/NextProcurementReadOnlyPanel.tsx` le azioni e i micro-comportamenti ancora diversi da `OrdiniListView` / `DettaglioOrdineView`;
  - chiudere in `src/next/NextProcurementConvergedSection.tsx` i delta residui di `Prezzi & Preventivi` e `Listino Prezzi`.
