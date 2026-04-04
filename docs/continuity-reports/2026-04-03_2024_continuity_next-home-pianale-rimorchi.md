# Continuity Report

- Data: 2026-04-03
- Ambito: Home NEXT
- Task: riclassificare `pianale` dal widget `Motrici e trattori` al widget `Rimorchi`

## Stato finale
- patch completata
- modifica confinata a `src/next/NextHomePage.tsx`
- nessun impatto su domain, shell, route o madre

## Decisione implementativa
- non e stato toccato `nextCentroControlloDomain`
- la Home usa il campo `categoria` gia disponibile nei record `D10AssetLocationItem`
- il rebucket e solo locale alla dashboard, quindi la decisione prodotto NEXT resta isolata e spiegabile

## Verifica operativa
- lint file toccato: OK
- build: OK
- runtime `/next`: una targa `pianale` reale (`TI285997`) risulta nel widget `Rimorchi` e non nel widget `Motrici e trattori`
- runtime `/next/autisti-admin`: nessuna regressione

## Residui
- nessuno nel perimetro del prompt
