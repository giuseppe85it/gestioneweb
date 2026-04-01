# Change Report - 2026-04-01 19:00

## Modifica
- Rifinitura professionale della riga alta Home NEXT per `Alert` e `Stato operativo`.

## File toccati
- `src/next/components/HomeAlertCard.tsx`
- `src/next/components/StatoOperativoCard.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettaglio operativo
- Introdotta una shell comune per le card della riga alta.
- Header e controlli restano fissi.
- Solo l'area elenco scorre internamente.
- Altezza esterna desktop coerente per entrambe le card.
- `Stato operativo` mostra 6 righe nel riepilogo Home.

## Verifica
- `npm run build`
