# CONTINUITY REPORT - Unified Intelligence Engine e console unica

## Contesto generale
- Il progetto resta nel perimetro clone NEXT read-only, con madre intoccabile e sottosistema IA interno isolato.
- Il task e stato ripreso da un worktree locale gia modificato dopo interruzione stream; la consegna finale ha mantenuto il lavoro coerente gia presente e ha completato solo il minimo mancante.

## Modulo/area su cui si stava lavorando
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- wiring console `/next/ia/interna`

## Stato attuale
- Esiste un Global Read Registry read-only che censisce le fonti mappate nel documento canonico dati.
- Esiste un motore unificato che collega entita, interpreta query libere e genera output thread/report/modale/PDF.
- La pagina `/next/ia/interna` espone filtri operativi per targa, ambiti e output e mostra un riepilogo sobrio del registry.
- Build e lint del perimetro toccato risultano verdi.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- adapter read-only per storage doc, collection, prefix Storage e localStorage isolato;
- entity linker con agganci per targa, mezzoId, badge/nome autista, refId, documentId e label normalizzate;
- query spec unica con output preference e ambiti combinabili;
- riuso dell'infrastruttura artifact esistente per preview/PDF/report senza nuove scritture business.

## Prossimo step di migrazione
- Solo se richiesto, affinare in un task dedicato i link forti delle fonti piu sporche o temporanee senza aprire nuova infrastruttura.

## Moduli impattati
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `docs/data/MAPPA_COMPLETA_DATI.md` come fonte canonica del perimetro
- storage keys e collection gia presenti nel clone, incluse fonti `tmp`, documentali, costi, procurement, materiali, rifornimenti, segnalazioni, controlli, cisterna e local storage clone-safe

## Ultime modifiche eseguite
- completato il parser/output del motore unificato;
- risolti gli ultimi errori TypeScript/lint del worktree interrotto;
- resa visibile in pagina la console unificata minima senza redesign tecnico extra.

## File coinvolti
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Non escludere fonti sporche o ambigue se sono mappate: includerle con adapter prudente e limiti espliciti.
- Non leggere segreti client: la fonte configurazione Gemini resta `guarded`.
- Non aprire backend live o scritture business per completare il motore.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun backend live nuovo.
- Nessun segreto lato client.
- Nessuna espansione infrastrutturale fuori perimetro.

## Parti da verificare
- Da verificare se serva una graduazione ancora piu fine dei link `alta/media/bassa` sulle fonti `tmp`.
- Da verificare se in un task futuro convenga rendere espliciti in UI alcuni filtri temporali del motore unificato.

## Rischi aperti
- Alcune fonti raw e `tmp` sono lette ma non hanno chiavi forti uniformi, quindi il motore puo solo dichiarare match parziali.
- Il registry totale non sostituisce una bonifica strutturale dei domini sporchi.

## Punti da verificare collegati
- Nessun nuovo file extra richiesto.

## Prossimo passo consigliato
- Task piccolo su un solo cluster di fonti sporche, se necessario, per rafforzare il linking senza cambiare il perimetro del motore.

## Cosa NON fare nel prossimo task
- Non rifare da zero il motore unificato.
- Non aprire nuova infrastruttura live.
- Non riportare la console a classificazioni tecniche come focus primario del prodotto.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
