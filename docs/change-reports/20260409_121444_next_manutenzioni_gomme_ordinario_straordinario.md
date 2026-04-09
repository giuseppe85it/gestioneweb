# Change Report - 2026-04-09 12:14:44

## Prompt
- `PROMPT 27`

## Obiettivo
- Separare nel modulo NEXT `Manutenzioni` il cambio gomme ordinario per asse dagli eventi gomme straordinari, senza toccare viewer tecnico, Euromecc o madre legacy.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- aggiunto nel record clone-side il contratto retrocompatibile:
  - `gommeInterventoTipo?: "ordinario" | "straordinario"`
  - `gommeStraordinario?: { asseId; quantita; motivo }`
- lasciato il cambio gomme ordinario come flusso strutturato per asse e come unica sorgente dello stato finale gomme per asse;
- introdotto nel form `Nuova / Modifica` un ramo esplicito `Gomme straordinarie` con motivo, asse facoltativo e quantita facoltativa;
- aggiornato il quadro del modulo per mostrare separatamente:
  - `Stato gomme ordinario per asse`
  - `Eventi gomme straordinari`
- aggiornato anche l'export PDF tabellare per rendere visibile la distinzione fra ordinario e straordinario.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> `OK`
- `npm run build` -> `OK`

## Limiti noti
- i record legacy gomme senza assi non vengono piu promossi nello stato per asse e vengono trattati in modo prudente come straordinari;
- il modulo resta `PARZIALE` e non e chiudibile senza audit separato.
