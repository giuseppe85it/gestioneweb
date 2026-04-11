# CHANGE REPORT

- Timestamp: 2026-04-11 08:39:21
- Task: conferma, esecuzione ed esito inline IA interna NEXT per i documenti `Magazzino`
- Rischio: ELEVATO
- Esito: PATCH COMPLETATA

## Obiettivo
Portare nel modale/chat `/next/ia/interna` il completamento del flusso documentale `Magazzino`, senza passaggio obbligatorio nel modulo `/next/magazzino`, ma solo per i due casi gia approvati:
- `riconcilia_senza_carico`
- `carica_stock_adblue`

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/utils/cloneWriteBarrier.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`

## Cosa e stato cambiato
- `NextInternalAiPage.tsx` non mostra piu solo la proposta e la CTA verso `Magazzino`:
  - risolve in background i route documento `Magazzino` del dossier;
  - abilita `Conferma riconciliazione` o `Conferma carico AdBlue` solo quando il match e abbastanza forte;
  - esegue inline l'azione e mostra l'esito finale nella stessa scheda.
- Creato `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`:
  - carica il contesto `Documenti e costi` realmente disponibile nel clone;
  - riusa in modo controllato le decisioni ammesse `riconcilia_senza_carico` e `carica_stock_adblue`;
  - ricalcola lo stato dopo l'esecuzione per restituire un esito finale coerente.
- `internal-ai.css` estende la scheda dossier con stati inline distinti:
  - positivo
  - warning
  - neutro
  - griglia finale esito
- `cloneWriteBarrier.ts` non apre writer nuovi:
  - introduce solo una scoped allowance temporanea `internal_ai_magazzino_inline_magazzino`;
  - la scoped allowance consente esclusivamente `storageSync.setItemSync` su `@inventario` mentre l'azione inline e in corso;
  - non apre consegne, manutenzioni, ordini, preventivi, listino o writer business generali.

## Comportamento finale implementato
- caso `riconcilia_senza_carico`:
  - conferma inline dal modale/chat;
  - esecuzione inline senza aumento stock;
  - esito con documento collegato, materiale coinvolto, costo/prezzo disponibile e stato finale.
- caso `carica_stock_adblue`:
  - conferma inline dal modale/chat;
  - esecuzione inline senza passaggio obbligatorio nel modulo;
  - esito con materiale AdBlue aggiornato, quantita caricata, unita e documento collegato.
- caso ambiguo o match debole:
  - nessuna scrittura;
  - stato `DA VERIFICARE`;
  - nessun bottone inline;
  - al massimo una sola domanda breve e mirata.
- `Apri in Magazzino` resta sempre disponibile come fallback, approfondimento e ispezione manuale.

## Vincoli rispettati
- nessun writer business nuovo oltre ai due casi gia approvati
- nessuna scrittura su consegne
- nessuna scrittura su manutenzioni
- nessuna scrittura su ordini
- nessuna scrittura su preventivi
- nessuna scrittura su listino
- nessun riuso runtime dei moduli IA legacy
- nessun peggioramento della scheda dossier documento

## Verifiche eseguite
- `npx eslint src/utils/cloneWriteBarrier.ts src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx` -> `OK`
- `npm run build` -> `OK`
- runtime verificato su `http://127.0.0.1:4173/next/ia/interna` con:
  - `fattura_mariba_534909.pdf`
  - `fattura_adblue_aprile.pdf`
  - `documento_ambiguo.pdf`
- esiti runtime verificati:
  - classificazione e scheda dossier corrette per i tre allegati;
  - caso ambiguo prudenzialmente bloccato in `DA VERIFICARE`;
  - fallback `Apri in Magazzino` funzionante verso `/next/magazzino?tab=documenti-costi`;
  - nessuna scrittura business eseguita fuori dai due casi ammessi.

## Limite reale emerso nel task
- Nel dataset live corrente il support snapshot `@documenti_magazzino` espone:
  - `Righe supporto: 3`
  - `Pronte: 0`
  - `Bloccate: 3`
- La patch inline e quindi chiusa come UX/runtime clone-side, ma la prova end-to-end di una esecuzione reale inline su una riga pronta `MARIBA` o `AdBlue` resta `DA VERIFICARE`.

## Rischi residui
- serve audit separato sul matching reale documento/materiale/fornitore nei casi `MARIBA` e `AdBlue`
- la scoped allowance sul barrier va rivalidata insieme all'audit della deroga scrivente fatture
- il dominio `Magazzino` resta repo-wide multi-writer e non transazionale fuori dal perimetro NEXT governato
