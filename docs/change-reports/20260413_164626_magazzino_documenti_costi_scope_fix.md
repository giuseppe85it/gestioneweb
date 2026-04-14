# CHANGE REPORT - 2026-04-13 16:46:26

## Titolo
Correzione perimetro dati del tab `Magazzino -> Documenti e costi`

## Obiettivo
Impedire che `/next/magazzino?tab=documenti-costi` mostri documenti/costi globali IA e limitarlo al solo dominio Magazzino senza toccare domain, writer o barrier.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`
- `docs/change-reports/20260413_164626_magazzino_documenti_costi_scope_fix.md`
- `docs/continuity-reports/20260413_164626_continuity_magazzino_documenti_costi_scope_fix.md`

## Dati reali verificati
- il tab legge `readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false })`
- il tab legge `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`
- il tab legge `readNextProcurementSnapshot({ includeCloneOverlays: false })`
- il discriminante affidabile per i documenti Magazzino e `sourceKey = "@documenti_magazzino"` con `sourceType = "documento_magazzino"`

## Modifica applicata
- ristretto `materialiCostItems` ai soli record `@documenti_magazzino`
- esclusi dalla vista i record `costo_mezzo`
- mantenuti ordini, arrivi, preventivi e listino procurement come supporto read-only del dominio materiali
- riallineata la copy della sezione `Costi materiali e prezzi` al nuovo perimetro reale

## Verifiche
- `npx eslint src/next/NextMagazzinoPage.tsx` -> `OK`
- `npm run build` -> `OK`
- browser verificato su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi`
- browser verificato su `http://127.0.0.1:4174/next/ia/documenti`

## Esito
- in Magazzino la sezione `Costi materiali e prezzi` non mostra piu righe da `costo_mezzo`
- `/next/ia/documenti` resta archivio globale IA senza regressioni visibili

## Rischi residui
- il tab continua a leggere anche lo snapshot flotta `readNextDocumentiCostiFleetSnapshot()` per KPI e supporti; il perimetro corretto e garantito dalla selezione dei record visibili, non da un nuovo reader dedicato
- restano errori console preesistenti su backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`
