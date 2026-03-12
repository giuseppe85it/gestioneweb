# CONTINUITY REPORT - Clone UI parity

## Contesto generale
- La fase attiva resta il clone `read-only` fedele della madre sotto `/next`.
- La copertura moduli e ormai ampia; il task recente ha chiuso soprattutto debiti di UI, routing e metadata.

## Modulo/area su cui si stava lavorando
- Shell NEXT e Centro di Controllo clone
- Perimetro task recente: parita UI del clone rispetto alla copertura runtime gia attiva

## Stato attuale
- La topbar clone espone ora i moduli principali gia attivi: Home, Gestione Operativa, Mezzi / Dossier, IA, Libretti Export, Cisterna, Colleghi, Fornitori, Autisti Inbox, Autisti Admin e App Autisti.
- I quick link del Centro Controllo restano nel perimetro `/next` quando la controparte clone esiste gia.
- `nextData` racconta meglio il runtime reale, inclusi `Autisti Inbox`, `Autisti Admin` e le sottoroute `Cisterna` gia aperte.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Shell UI
- Routing clone-safe
- Metadata route/modules
- Nessuna nuova logica business o scrittura

## Prossimo step di migrazione
- Chiudere il debito di integrazione dati piu concreto: merge reader `legacy + @next_clone_autisti:*` per `Autisti Inbox` e `Autisti Admin`.

## Moduli impattati
- `NextShell`
- `NextCentroControlloPage`
- `nextData`

## Contratti dati coinvolti
- Nessun contratto dati nuovo
- Resta aperto il riferimento ai record clone-local `@next_clone_autisti:*` come debito di integrazione, non toccato in questa patch

## Ultime modifiche eseguite
- Topbar clone riallineata alla copertura runtime reale
- Quick link del Centro Controllo ricondotti a `/next` quando possibile
- Metadata route/modules aggiornati per Autisti e Cisterna

## File coinvolti
- `src/next/NextShell.tsx`
- `src/next/next-shell.css`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Nessuna riattivazione scritture nel clone
- Nessuna rifondazione anticipata di `Autista 360`, `Mezzo 360` o child IA sensibili
- Parita UI prima della fase di integrazione dati piu profonda

## Vincoli da non rompere
- Madre intoccabile
- Tutte le modifiche runtime devono stare solo su `/next`
- Nessuna falsa esposizione di moduli non ancora clone-safe

## Parti da verificare
- Merge reader clone+legacy per `Autisti Inbox` e `Autisti Admin`
- Eventuale parita di deep-link per sottoroute dossier oggi assorbite come `view`

## Rischi aperti
- `Autisti Admin` reader-first legge ancora i dataset legacy ma non i record clone-local della terza tranche autisti
- I moduli IA child e le viste 360 restano fuori o bloccati per motivi architetturali, non per semplice assenza UI

## Punti da verificare collegati
- `Standard UI canonico cross-modulo per NEXT`
- `Governance endpoint IA/PDF multipli`

## Prossimo passo consigliato
- Mini-task tecnico per il merge reader `legacy + clone-local` lato Autisti, senza riaprire writer

## Cosa NON fare nel prossimo task
- Non importare 1:1 `Autista 360` o `Mezzo 360`
- Non riattivare rettifiche o `crea lavoro` dentro `Autisti Admin`

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
