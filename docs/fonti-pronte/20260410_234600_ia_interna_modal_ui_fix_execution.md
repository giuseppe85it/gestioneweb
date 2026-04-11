# CHANGE REPORT

- Timestamp: 2026-04-10 23:46:00
- Task: fix UI del pannello classificazione/proposta nel modale IA interna
- Rischio: NORMALE
- Esito: PATCH COMPLETATA

## Obiettivo
Rendere chiaramente visibile sopra la chat del modale IA interna:
- cosa la IA ha letto
- tipo documento rilevato
- azione proposta
- motivazione sintetica
- eventuale stato `DA VERIFICARE`

senza toccare motore documentale, writer business o barrier.

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cosa e stato cambiato
- la proposal card documento e stata spostata fuori dal composer compresso e montata in una fascia dedicata sopra i messaggi chat;
- il pannello ora scrolla in vista quando arriva una nuova classificazione;
- la card espone campi espliciti:
  - `Documento letto`
  - `Tipo rilevato`
  - `Azione proposta`
  - `Motivazione`
  - `Presidio`
- gli stili locali aggiungono:
  - `min-height` reale
  - `max-height` con `overflow: auto`
  - card con gerarchia visiva piu forte

## Impatto
- UI: il modale rapido della Home rende leggibile l'esito del flusso documentale `Magazzino`.
- Logica: nessuna modifica alla classificazione o al routing documentale.
- Sicurezza: nessuna modifica ai writer business.

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> `OK` sul TSX, warning noto sul CSS ignorato dalla config ESLint del repo
- `npm run build` -> `OK`
- runtime verificato sul modale IA aperto dalla Home:
  - allegato `.tmp-ui-fattura_mariba_534909.pdf`
  - proposal shell visibile a circa `320px`
  - testo leggibile `Fattura materiali di Magazzino` -> `Riconcilia documento`

## Rischi residui
- il fix risolve la leggibilita ma non cambia i limiti intrinseci del motore documentale sui file con segnali deboli
- il warning ESLint sul CSS dipende dalla configurazione del repo, non dal fix
