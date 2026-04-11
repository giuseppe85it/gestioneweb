# Continuity Report - IA interna Magazzino full screen document review

Data: 2026-04-11  
Task: review documento full screen per IA interna `Magazzino`

## Cosa e stato fatto
- sostituita la review documentale principalmente testuale con un modale full screen operativo;
- mantenuta la scheda dossier sopra la chat come riepilogo compatto e punto di riapertura;
- separata in modo chiaro la proposta IA dalla decisione finale utente;
- mantenuta l'esecuzione inline solo nei casi gia ammessi dal perimetro.

## File runtime chiave
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## File documentali aggiornati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror in `docs/fonti-pronte/`

## Comportamento runtime attuale
- quando la IA analizza un allegato rilevante in contesto `Magazzino`, apre una review documento full screen;
- a sinistra mostra il documento in grande;
- a destra mostra dati estratti, righe materiali, match inventario, proposta IA e decisione utente;
- l'utente puo scegliere apertamente l'azione da intraprendere;
- l'esecuzione parte solo dopo scelta utente e solo se l'azione resta nel perimetro gia consentito;
- `Apri in Magazzino` o il fallback di modulo restano disponibili per approfondimento.

## Verifiche gia eseguite
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- runtime verificato su:
  - fattura materiali;
  - fattura `AdBlue`;
  - preventivo;
  - caso ambiguo.

## Rischi residui
- serve ulteriore verifica su documenti reali piu sporchi o multi-riga;
- la decisione utente non va ancora considerata storicizzata come workflow persistente cross-sessione;
- eventuali nuovi writer fuori perimetro restano bloccati.

## Prossimo punto sensato
- auditare i casi reali con documenti piu eterogenei per capire se la classificazione e il piano decisionale tengono senza introdurre falsi positivi o doppi carichi.
