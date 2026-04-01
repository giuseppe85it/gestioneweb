# Change Report - 2026-04-01 19:15

## Oggetto
Layout desktop deterministico della coppia alta Home NEXT `Alert` + `Stato operativo`.

## Perimetro
- `src/next/components/HomeAlertCard.tsx`
- `src/next/components/StatoOperativoCard.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica applicata
- Impostata una griglia desktop esplicita a due colonne per la riga alta Home:
  - `Alert` = `1.15fr`
  - `Stato operativo` = `1fr`
- Impostata altezza esterna uguale della coppia su desktop:
  - `620px`
- Resa interna delle card a colonna:
  - header fisso
  - controlli/filtro/tab fissi
  - sola area lista scrollabile internamente
- Riallineato `Stato operativo` a 5 righe utili nella vista compatta Home.

## Esito verifica
- `npm run build` = OK
- Nessuna modifica a logica dati, modali, click behavior o writer.
