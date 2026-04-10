# CHANGE REPORT

- Timestamp: 2026-04-10 18:12:42
- Task: trasformazione UX IA interna `Magazzino` da prompt-driven a document-driven
- Rischio: ELEVATO
- Esito: PATCH COMPLETATA

## Obiettivo
Permettere alla chat `/next/ia/interna` di lavorare in modo naturale sui documenti `Magazzino`:
- allegato come trigger principale del flusso
- classificazione automatica prudente del documento
- proposta azione in UI
- handoff semplice verso `Magazzino` o `DA VERIFICARE`
- nessuna nuova scrittura business oltre ai due casi gia approvati sulle fatture

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`

## Cosa e stato cambiato
- `NextInternalAiPage.tsx` accetta ora submit anche con solo allegato, genera un prompt base prudente e mostra una proposal card automatica con:
  - tipo documento rilevato
  - azione proposta
  - motivazione sintetica
  - confidenza
  - eventuale singola domanda di sblocco
  - CTA verso il modulo target
- `internalAiUniversalDocumentRouter.ts` riconosce meglio fatture materiali `Magazzino`, fatture `AdBlue` e documenti ambigui anche quando i segnali disponibili arrivano solo da nome file o excerpt allegato.
- `internalAiUniversalHandoff.ts` instrada i casi forti al modulo canonico `Magazzino`, mantiene prudente il payload nei casi ambigui e filtra meglio riferimenti sporchi su `targa/materiale`.
- Il flusso utente diventa:
  - allegato
  - classificazione automatica
  - proposta azione
  - apertura del modulo target
  - conferma nel modulo target
  - esecuzione solo nei due casi gia governati `riconcilia_senza_carico` e `carica_stock_adblue`

## Impatto
- UI: `/next/ia/interna` non richiede piu prompt tecnici per usare bene il flusso documentale `Magazzino`.
- Routing: le fatture materiali `Magazzino` e `AdBlue` vanno in modo piu affidabile verso `/next/magazzino?tab=documenti-costi`.
- Sicurezza: nessun nuovo writer business; i casi ambigui restano `DA VERIFICARE`.

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiUniversalDocumentRouter.ts src/next/internal-ai/internalAiUniversalHandoff.ts` -> `OK`
- `npm run build` -> `OK`
- preview locale su `/next/ia/interna` -> `OK`
- verificati tre scenari runtime con allegati dummy:
  - `fattura_mariba_534909.pdf` -> proposta `Riconcilia documento`
  - `fattura_adblue_aprile.pdf` -> proposta `Carica stock AdBlue`
  - `documento_ambiguo.pdf` -> proposta `DA VERIFICARE`
- verificata la comparsa della proposta automatica e della CTA verso `Magazzino` o `DA VERIFICARE`
- nessuna scrittura business reale eseguita durante la verifica runtime

## Rischi residui
- la classificazione automatica dipende ancora dalla qualita dei segnali documentali disponibili nel clone (`nome file`, `excerpt/testo`, metadata allegato)
- serve audit separato su PDF/immagini reali con segnali deboli o filename poco informativi
- serve rivalidare gli handoff persistiti/storici oltre alle nuove classificazioni generate in runtime
