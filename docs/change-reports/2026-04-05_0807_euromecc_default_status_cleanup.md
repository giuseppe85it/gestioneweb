# Change Report - 2026-04-05 08:07

## Titolo
Pulizia dei `base status` statici della mappa `Euromecc`

## Obiettivo
Eliminare i warning gialli di default dalla Home map del modulo `Euromecc` quando le collection del modulo sono vuote.

## File toccati
- `src/next/euromeccAreas.ts`
- `docs/product/SPEC_MODULO_EUROMECC_NEXT.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- Tutti i `base` statici topologici che partivano da `check` sono stati portati a `ok`.
- Nessuna modifica al domain `nextEuromeccDomain.ts`: la logica resta invariata e continua a derivare gli stati reali da pending/issues/done.
- La spec tecnica chiarisce che `check` resta supportato, ma non deve essere usato come default statico della mappa.

## Impatto
- La mappa Home `Euromecc` parte pulita quando non esistono dati reali.
- I pallini colorati restano guidati solo dai dati reali o da future regole esplicite.
- Nessun impatto su Firestore, route, UI generale o fullscreen.

## Verifica
- `node_modules\\.bin\\eslint.cmd src/next/euromeccAreas.ts`
- `npm run build`
- verifica runtime su `/next/euromecc` con collection Euromecc vuote
