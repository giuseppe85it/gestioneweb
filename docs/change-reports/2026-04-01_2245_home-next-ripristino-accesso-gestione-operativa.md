# Change Report - 2026-04-01 22:45

## Obiettivo
Ripristinare un accesso diretto e visibile a `Gestione Operativa` nella Home NEXT senza rompere la nuova architettura appena applicata.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica eseguita
- Inserito un link dedicato `Gestione Operativa` nel set usato dai `Preferiti` della Home.
- La lista `quickFavorites` forza ora `Gestione Operativa` come primo elemento visibile della card `Navigazione rapida`.
- Le sezioni dell'overlay non sono state toccate: il collegamento diretto e visibile solo nei `Preferiti`, cosi non si riapre il vecchio rumore di duplicazioni operative nel menu completo.

## Verifiche
- `npm run build` -> OK
- Restano solo warning preesistenti su `jspdf` e chunk size.
