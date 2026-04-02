# Change Report

## Data
2026-04-01

## Ambito
Riallineamento madre-like del modale procurement in `NextMaterialiDaOrdinarePage`.

## Audit eseguito
- Modale madre letto in:
  - `src/pages/MaterialiDaOrdinare.tsx`
  - `src/pages/MaterialiDaOrdinare.css`
- Controparte NEXT letta in:
  - `src/next/NextMaterialiDaOrdinarePage.tsx`

## Differenza reale trovata
Il markup del modale era gia allineato alla madre, ma nella NEXT il popup ereditava la variante embedded della pagina procurement e quindi non manteneva piu la stessa percezione visiva della madre su bordo, testo e card shell.

## Correzione applicata
- backdrop del modale riportato a shell madre-like esplicita;
- card dialog riportata a bordo, sfondo, ombra e raggi della madre;
- titolo e testo del contenuto riportati ai colori e alla gerarchia visiva della madre.

## Perimetro non toccato
- nessuna route cambiata
- nessun writer cambiato
- nessun runtime procurement secondario toccato

## Verifica
- `npm run build` -> OK
