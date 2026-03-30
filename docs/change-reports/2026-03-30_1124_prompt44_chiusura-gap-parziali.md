# Change Report - Prompt 44 - Chiusura gap parziali

- Data: 2026-03-30 11:24
- Prompt: 44
- Obiettivo: chiudere solo i moduli `PARZIALI` confermati dall'audit finale post prompt 42, senza riaprire i moduli `DA VERIFICARE` e senza toccare la madre.

## File toccati
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/nextInventarioCloneState.ts`
- `src/next/nextMaterialiMovimentiCloneState.ts`
- `src/next/nextFlottaCloneState.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `docs/audit/BACKLOG_GAP_PARZIALI_EXECUTION.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cambiamenti principali
- Inventario:
  - rimosso il pannello solo-bloccato;
  - aggiunti add/edit/delete, variazione quantita, foto e anteprima PDF locali al clone;
  - aggiunto supporto persistente a delete locali nel clone state e merge nel domain.
- Materiali consegnati:
  - sostituito il pannello bloccato con una route NEXT nativa;
  - aggiunti registra consegna, delete con ripristino stock clone e PDF locale;
  - introdotto clone state dedicato dei movimenti materiali e merge nel domain.
- Mezzi:
  - `/next/mezzi` ora monta una pagina NEXT nativa con save/delete/foto/libretto locali;
  - esteso il layer D01 con patch clone mezzo, delete locale e creazione di nuovi mezzi clone-only.
- Capo costi:
  - sostituita la chiamata reale `stamp_pdf` con un PDF locale di timbro clone-safe.
- Documentazione:
  - creato backlog persistente dei soli gap `PARZIALI`;
  - riallineati stato migrazione, matrice esecutiva e registro clone.

## Verifiche eseguite
- `npx eslint src/next/NextInventarioPage.tsx src/next/NextMaterialiConsegnatiPage.tsx src/next/NextMezziPage.tsx src/next/NextCapoCostiMezzoPage.tsx src/next/nextInventarioCloneState.ts src/next/nextMaterialiMovimentiCloneState.ts src/next/nextFlottaCloneState.ts src/next/domain/nextInventarioDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts src/next/nextAnagraficheFlottaDomain.ts` -> OK
- `npm run build` -> OK

## Esito
- Moduli ex `PARZIALI` del backlog prompt 44: `CHIUSO`
- Moduli `DA VERIFICARE`: non toccati da questo run
