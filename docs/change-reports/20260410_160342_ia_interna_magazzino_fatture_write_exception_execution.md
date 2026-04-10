# CHANGE REPORT

- Timestamp: 2026-04-10 16:03:42
- Task: deroga scrivente controllata IA interna NEXT per le sole fatture `Magazzino`
- Rischio: ELEVATO
- Esito: PATCH COMPLETATA

## Obiettivo
Abilitare in modo controllato la IA interna NEXT a gestire scritture business solo su due casi documentali del dominio `Magazzino`:
- fattura materiali gia arrivati e gia caricati a stock -> sola riconciliazione senza carico
- fattura AdBlue arrivata ma non ancora caricata a stock -> carico stock AdBlue

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `CONTEXT_CLAUDE.md`

## Cosa e stato cambiato
- `nextDocumentiCostiDomain.ts` espone ora sui support docs di `@documenti_magazzino` i metadata necessari a un match forte (`tipoDocumento`, `numeroDocumento`, `nomeFile`, `fileUrl`, `daVerificare`).
- `NextMagazzinoPage.tsx` classifica ogni riga documento in `riconcilia_senza_carico`, `carica_stock_adblue`, `DA VERIFICARE` o `fuori_perimetro`.
- Caso `MARIBA`: se la riga fattura e coperta da arrivo procurement compatibile e da materiale gia presente in inventario, l'azione ammessa e solo `Riconcilia senza carico`; la patch aggiunge il `sourceLoadKey` a `stockLoadKeys` e non incrementa la giacenza.
- Caso `AdBlue`: se la riga fattura e realmente AdBlue, con quantita leggibile, UDM `lt`, nessun mismatch unita e nessuna sorgente gia consolidata, l'azione ammessa e solo `Carica stock AdBlue`; la patch crea o aggiorna la voce inventario e incrementa la giacenza.
- Documenti non fattura, documenti `daVerificare`, mismatch UDM, match deboli o sorgenti gia consolidate restano bloccati con esito esplicito.
- `internalAiUniversalDocumentRouter.ts`, `internalAiUniversalRequestResolver.ts` e `internalAiUniversalHandoff.ts` instradano ora le fatture materiali al modulo canonico `Magazzino` sulla vista `documenti-costi`; i prompt `fattura AdBlue` non cadono piu sulla vista cisterna come percorso primario.
- `internalAiUniversalContracts.ts` e `internalAiUnifiedIntelligenceEngine.ts` dichiarano la deroga come eccezione mirata sul dominio D05, non come riapertura generale di writer business.

## Impatto
- UI: il tab `Documenti e costi` espone il nuovo pannello `Azione controllata IA su fattura magazzino` e CTA esplicite solo per i due casi ammessi.
- Dati: nessun dataset nuovo; la riconciliazione usa `stockLoadKeys` esistenti per collegare la sorgente fattura ed evitare il doppio carico.
- Sicurezza: nessuna apertura su consegne, manutenzioni, ordini, preventivi o altri writer Magazzino fuori dai due casi fattura.

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextDocumentiCostiDomain.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> `OK`
- `npm run build` -> `OK`
- preview locale su `/next/magazzino?tab=documenti-costi` -> `OK`
- verificato il render del pannello `Azione controllata IA su fattura magazzino`
- nessuna scrittura business reale eseguita durante la verifica runtime

## Rischi residui
- serve audit separato sul matching reale documento/materiale/fornitore nei casi `MARIBA` e `AdBlue`
- il dominio `Magazzino` resta multi-writer repo-wide e non transazionale fuori dal perimetro NEXT governato
- il planner/handoff universale D05 va ancora rivalidato sui prompt misti materiale/documenti/preventivi
