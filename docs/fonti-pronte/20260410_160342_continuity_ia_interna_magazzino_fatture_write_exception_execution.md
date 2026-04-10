# CONTINUITY REPORT

- Timestamp: 2026-04-10 16:03:42
- Task chiuso: deroga scrivente controllata IA interna NEXT per le sole fatture `Magazzino`
- Stato: PATCH COMPLETATA

## Punto raggiunto
- la IA interna NEXT puo ora aprire in modo controllato il flusso fatture `Magazzino` su `/next/magazzino?tab=documenti-costi`
- le sole azioni business ammesse sono:
  - `riconcilia_senza_carico` per fattura gia coperta da arrivo/materiale consolidato
  - `carica_stock_adblue` per fattura AdBlue non ancora caricata a stock

## Guard-rail attivi
- niente writer generici da `@documenti_magazzino`
- niente scritture su consegne, manutenzioni, ordini, preventivi
- blocco su documento non fattura, documento `daVerificare`, mismatch UDM, match debole o sorgente gia consolidata
- anti-doppio-carico basato su `stockLoadKeys`

## Verifiche gia fatte
- lint mirato `OK`
- build `OK`
- preview locale `OK` su `/next/magazzino?tab=documenti-costi`

## Rischi residui da tenere aperti
- audit separato sulla deroga scrivente fatture `Magazzino`
- rivalidazione handoff universale D05 sui prompt misti
- conferma sul campo dei match reali `MARIBA` / `AdBlue` senza eseguire scritture cieche

## File chiave da rileggere se si riapre il tema
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
