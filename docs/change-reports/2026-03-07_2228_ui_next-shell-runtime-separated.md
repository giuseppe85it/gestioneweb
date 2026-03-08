# CHANGE REPORT - Shell runtime NEXT separata

## Data
- 2026-03-07 22:28

## Tipo task
- ui

## Obiettivo
- Creare la shell reale della NEXT dentro il repo, visibile e navigabile su route dedicate, senza alterare il comportamento runtime della legacy.

## File modificati
- `src/App.tsx`
- `src/next/NextShell.tsx`
- `src/next/NextAreaPage.tsx`
- `src/next/nextData.ts`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Riassunto modifiche
- Aggiunte route separate `/next/*` con shell dedicata e 5 macro-aree placeholder navigabili.
- Introdotto un layout NEXT isolato con header, sidebar, content area e predisposizione visiva per scope/permessi futuri.
- Aggiornata la documentazione di stato per registrare la shell NEXT runtime come `SHELL CREATA`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La NEXT diventa visibile nel browser senza sostituire la home legacy.
- Nessun impatto su backend, dati runtime o flussi di scrittura.

## Rischio modifica
- NORMALE

## Moduli impattati
- Routing frontend
- Shell NEXT
- Documentazione stato progetto / migrazione NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: `Standard UI canonico cross-modulo per NEXT`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- shell globale
- home
- flotta
- dossier
- operativita
- IA Gestionale
- strumenti trasversali

## Stato migrazione prima
- NON INIZIATO

## Stato migrazione dopo
- SHELL CREATA

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il worktree contiene modifiche pregresse non legate a questo task su documenti `flow-master` e altri docs gia sporchi.
- Il controllo automatico con browser/processo background locale e stato bloccato dalla policy del runner.

## Build/Test eseguiti
- `npm run build` -> OK
- Tentativo di verifica runtime locale con processo background -> BLOCCATO DA POLICY

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

