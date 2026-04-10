# CONTINUITY REPORT

- Timestamp: 2026-04-10 18:12:42
- Task chiuso: trasformazione UX IA interna `Magazzino` da prompt-driven a document-driven
- Stato: PATCH COMPLETATA

## Punto raggiunto
- `/next/ia/interna` puo ora lavorare in modo attachment-first sui documenti `Magazzino`
- la chat genera automaticamente una proposta azione prudente senza richiedere prompt rigidi
- il flusso confermato e:
  - allegato
  - classificazione automatica
  - action card
  - apertura del modulo target
  - conferma finale nel modulo target

## Guard-rail attivi
- nessun writer business nuovo oltre ai due casi gia approvati:
  - `riconcilia_senza_carico`
  - `carica_stock_adblue`
- i casi ambigui restano `DA VERIFICARE`
- la conferma utente nel modulo target resta obbligatoria
- nessun backend OCR/live-read aggiuntivo e stato aperto

## Verifiche gia fatte
- lint mirato `OK`
- build `OK`
- preview locale `OK` su `/next/ia/interna`
- scenari dummy verificati:
  - `MARIBA`
  - `AdBlue`
  - documento ambiguo

## Rischi residui da tenere aperti
- audit separato su PDF/immagini reali con segnali documentali deboli
- rivalidazione degli handoff persistiti/storici oltre al solo runtime fresco
- conferma sul campo che i casi con filename poveri degradino sempre in `DA VERIFICARE`

## File chiave da rileggere se si riapre il tema
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
