# Change Report - 2026-03-29 1108 - Prompt 33 chiusura gap parita NEXT

## Obiettivo
Portare avanti la chiusura reale dei gap clone/NEXT vs madre, convertendo dove possibile le route ufficiali a `UI madre fuori + layer NEXT pulito sotto`, senza toccare la madre.

## File toccati
- `src/utils/storageSync.ts`
- `src/next/nextLegacyStorageOverlay.ts`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/NextMotherPage.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextAttrezzatureCantieriPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/REPORT_FINALE_PROMPT_33_PARITA_NEXT.md`
- `docs/change-reports/2026-03-29_1108_prompt33_chiusura-gap-parita-next.md`
- `docs/continuity-reports/2026-03-29_1108_continuity_prompt33_chiusura-gap-parita-next.md`

## Sintesi tecnica
- Introdotto un overlay clone-only per far prevalere in `storageSync` dataset legacy-shaped costruiti dai domain NEXT.
- Convertite le route ufficiali `Mezzi`, `Gestione Operativa`, `Inventario`, `Materiali consegnati`, `Attrezzature cantieri`, `Manutenzioni`, `Ordini`, `Dettaglio ordine`, `Lavori` e `Dettaglio lavoro` a UI madre vera sopra bridge pulito.
- Aggiunto serializer D02 per `@manutenzioni`.
- Prodotto il report finale reale con moduli chiusi e moduli ancora bloccati da file madre fuori perimetro.

## Verifiche
- `npx eslint ...` sui file toccati: OK
- `npm run build`: OK

## Impatto
- Migliora la parita esterna sulle route ufficiali convertite.
- Riduce la dipendenza da letture raw dirette nei moduli convertiti.
- Mantiene invariato il blocco scritture del clone.

## Rischi residui
- `Home`, `Centro di Controllo`, procurement core, dossier core, area capo, IA legacy, cisterna e autisti/inbox restano non chiusi per dipendenza da file madre con Firestore/Storage diretto o workflow non isolati.
