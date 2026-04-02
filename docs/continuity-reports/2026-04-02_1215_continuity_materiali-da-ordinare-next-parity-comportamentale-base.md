# Continuity Report - 2026-04-02 12:15

## Stato iniziale
- `/next/materiali-da-ordinare` aveva parity grafica desktop piu vicina alla madre, ma restavano gap pratici:
  - ricerca top-level attiva solo su `Fabbisogni`;
  - `iaHandoff` non precompilava davvero il form procurement;
  - le righe temporanee perdevano il fornitore;
  - la conferma read-only non chiudeva la bozza locale come nel flusso madre.

## Stato finale
- Il modulo unico procurement mantiene la convergenza top-level e si comporta in modo piu coerente con la madre sui flussi pratici locali:
  - prefill applicato;
  - bozza locale persistita;
  - ricerca cross-tab attiva;
  - reset bozza dopo conferma read-only.

## Rischi residui
- Il modulo procurement top-level resta `PARZIALE`:
  - nessun writer business reale;
  - niente upload preventivi reale;
  - niente PDF reali;
  - menu azioni riga ancora prudenziale.

## Prossimo passo consigliato
- Audit separato delle azioni riga e dei PDF procurement per decidere cosa importare ancora dalla madre senza sbloccare scritture business.
