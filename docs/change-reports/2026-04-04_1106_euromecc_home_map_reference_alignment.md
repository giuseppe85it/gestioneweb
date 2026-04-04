# Change Report - 2026-04-04 11:06

## Modifica
- Riallineamento della `Mappa impianto` Home del modulo `Euromecc` alla reference utente.

## Obiettivo
- Rifare la composizione SVG della Home mantenendo pagina, `Focus area`, click nodo e fullscreen invariati.

## File toccati
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- aggiunti collettore superiore e barre strutturali etichettate;
- introdotti i gruppi doppi corretti per `Silo 2` e `Silo 6`;
- redistribuiti nodi centrali e inferiori in modo piu aderente alla reference;
- mantenute interazioni e focus area esistenti.

## Impatto
- solo composizione SVG della tab `Home` di `Euromecc`;
- nessuna modifica a fullscreen, domain, Firestore, route o sidebar.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx`
- `npm run build`
- verifica runtime locale su `/next/euromecc`

