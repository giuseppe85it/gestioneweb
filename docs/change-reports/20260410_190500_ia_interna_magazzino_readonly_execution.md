# Change Report - 2026-04-10 19:05:00

## Titolo
IA interna NEXT - integrazione `Magazzino` read-only

## Tipo intervento
- Runtime NEXT
- Sottosistema IA interna
- Documentazione di stato

## Obiettivo
Permettere alla console `/next/ia/interna` di leggere, incrociare e spiegare il dominio `Magazzino` usando i reader NEXT reali, senza toccare la madre, senza aprire scritture business e senza inventare match non dimostrabili tra materiali, documenti e procurement.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- `nextMaterialiMovimentiDomain.ts` espone ora anche gli eventi `@cisterne_adblue` nel composito `readNextMagazzinoRealeSnapshot()`, cosi il dominio D05 puo leggere inventario, movimenti materiali, attrezzature e AdBlue dallo stesso read model.
- `internalAiUnifiedIntelligenceEngine.ts` costruisce ora un percorso Magazzino read-only che incrocia:
  - stock attuale inventario
  - movimenti materiali consegnati
  - eventi AdBlue / giacenza AdBlue leggibile
  - documenti magazzino e fatture
  - costi materiali di supporto
  - procurement di supporto (`ordini`, `arrivi`, `preventivi`, `approvazioni`, `listino`)
- Quando il dominio Magazzino e coinvolto, la risposta usa blocchi strutturati:
  - `Stock`
  - `Movimenti`
  - `Documenti / Fatture`
  - `Preventivi`
  - `Costi di supporto`
  - `Criticita / DA VERIFICARE`
- `internalAiUniversalContracts.ts` registra `next.magazzino` come modulo canonico e aggiunge hook dedicati per:
  - workbench generale
  - inventario
  - materiali consegnati
  - documenti e costi
  - AdBlue
- `internalAiUniversalRequestResolver.ts` e `internalAiUniversalHandoff.ts` instradano ora i prompt/documenti D05 verso `/next/magazzino` e le sue viste canoniche, invece di lasciare il dominio appeso a `next.operativita` o ai vecchi path.
- `NextMagazzinoPage.tsx` consuma il payload `iaHandoff`, applica il prefill corretto e resta sul modulo canonico senza uscire verso runtime legacy.
- Nessun file backend `backend/internal-ai/server/*` e stato toccato: il path locale del motore unificato era gia sufficiente per servire il dominio Magazzino in sola lettura.

## Vincoli rispettati
- Madre legacy non toccata
- Nessuna scrittura business aperta per l'IA
- Nessun writer esposto su `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`, `@ordini`, `@preventivi`, `@listino_prezzi`
- Nessun refactor largo del sottosistema chat
- Nessuna auto-certificazione del dominio `Magazzino` come `CHIUSO`

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/domain/nextMaterialiMovimentiDomain.ts src/next/internal-ai/internalAiUniversalContracts.ts src/next/internal-ai/internalAiUniversalRequestResolver.ts src/next/internal-ai/internalAiUniversalHandoff.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> `OK`
- `npm run build` -> `OK`
- Preview locale verificata su `/next/ia/interna`
- Prompt runtime verificato:
  - `quanta giacenza ho del materiale AdBlue e quali documenti o preventivi risultano collegati`
- Esito runtime verificato:
  - risposta `Magazzino reale`
  - blocchi `Stock`, `Movimenti`, `Documenti / Fatture`, `Preventivi`, `Costi di supporto`, `Criticita / DA VERIFICARE`
  - riferimenti ai dataset reali `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`, `@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`
- Nota: non sono stati eseguiti submit browser mutanti o scritture business sui dataset reali.

## Esito
- Patch runtime completata nel perimetro autorizzato.
- La IA interna NEXT puo ora leggere e incrociare in modo strutturato il dominio `Magazzino` come capability reale read-only.
- Il sottosistema resta `PARZIALE`: su alcuni prompt misti materiale/documenti/preventivi il planner universale puo ancora suggerire un handoff prudente non sempre canonico verso `Magazzino`.
