# Change Report - 2026-03-26 06:31

## Titolo
D05 magazzino reale read-only chiuso per NEXT e IA interna

## Obiettivo
Completare il work-package D05 partito in modo parziale, consolidando il dominio magazzino come layer canonico read-only e chiudendo la rotta operativa reale `/next/gestione-operativa` su una superficie coerente con il clone.

## File toccati
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextOperativitaGlobalePage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cosa cambia davvero
- D05 usa ora un composito piu coerente e leggibile per inventario, movimenti materiali e attrezzature, senza limitazioni duplicate o CTA ambigue.
- Il motore IA distingue meglio tra prompt globali su stock e blocchi, prompt su materiali collegati ai mezzi e prompt sul confine `sola lettura`.
- `/next/gestione-operativa` non espone piu la superficie legacy della madre: mostra il workbench read-only gia presente nel clone.

## Impatto
- UI: la superficie operativa reale mostra banner D03/D05 e CTA coerenti `read-only`.
- IA: i 5 prompt bussola D05 atterrano tutti nel ramo corretto e con azione consigliata piu utile.
- Sicurezza: nessuna scrittura business riaperta.

## Verifiche
- `npm run build` -> OK
- `npx eslint src/next/domain/nextInventarioDomain.ts src/next/domain/nextMaterialiMovimentiDomain.ts src/next/domain/nextAttrezzatureCantieriDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextOperativitaGlobalePage.tsx src/next/NextGestioneOperativaPage.tsx` -> OK
- Smoke UI reale su `/next/ia/interna`:
  - `criticita di magazzino o inventario` -> D05 globale
  - `materiali collegati ai mezzi` -> D05 collegamenti mezzi
  - `Questo mezzo ha ricevuto materiali o attrezzature rilevanti?` con `TI233827` -> D05 mezzo-specifico
  - `stock bassi o segnali che possono bloccare il lavoro` -> D05 globale
  - `questa parte e davvero operativa o solo in lettura` -> D05 boundary
- Smoke UI reale su `/next/gestione-operativa`:
  - banner D03/D05 visibili
  - CTA `Apri inventario read-only`, `Apri movimenti materiali`, `Apri attrezzature read-only`

## Rischi residui
- D05 resta volutamente prudente: non esiste ancora una scorta minima canonica oltre il caso zero/negativo.
- Il legame tra materiali, manutenzioni e ordini non e ancora transazionale.
- I collegamenti mezzo/materiali restano in parte dipendenti dai writer legacy e quindi spiegati come prudenziali dove serve.
