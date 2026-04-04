# Continuity Report - 2026-04-04 11:06

## Contesto
- Modulo: `Euromecc`
- Focus: tab `Home` -> `Mappa impianto`

## Stato iniziale
- La mappa Home era ancora diversa dalla reference anche dopo il fix geometrico precedente.

## Intervento
- Rifatta solo la composizione SVG Home in `src/next/NextEuromeccPage.tsx`.
- Aggiornato solo il CSS scoped minimo per la gerarchia visiva delle nuove etichette strutturali.

## Stato finale
- Composizione Home piu vicina alla reference.
- `Focus area` e click nodo restano funzionanti.
- Fullscreen non peggiora.

## Prossima continuita
- Stato modulo resta `PARZIALE`.
- Restano fuori da questo task tutti i temi non grafici del modulo `Euromecc`.
