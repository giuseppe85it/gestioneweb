# CONTINUITY REPORT - Cisterna base clone

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre.
- Il blocco Cisterna era stato auditato come area da spacchettare: solo la route base aveva un sotto-perimetro consultivo realistico.

## Modulo/area su cui si stava lavorando
- Cisterna
- Step 1: route base read-only

## Stato attuale
- E aperta `/next/cisterna` come controparte clone-safe della sola route madre base.
- Restano bloccate `/cisterna/ia` e `/cisterna/schede-test`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY PARZIALE

## Cosa e gia stato importato/migrato
- Archivio documenti cisterna del mese
- Report mensile cisterna
- Tabelle/ripartizioni per targa e dettaglio mese

## Prossimo step di migrazione
- Valutare solo in task separato se affinare la resa della route base o migliorare ulteriormente i warning sui mesi incompleti, senza aprire writer.

## Moduli impattati
- src/next/domain/nextCisternaDomain.ts
- src/next/NextCisternaPage.tsx
- src/next/NextCentroControlloPage.tsx

## Contratti dati coinvolti
- `@documenti_cisterna`
- `@cisterna_schede_ia`
- `@cisterna_parametri_mensili`
- `@rifornimenti_autisti_tmp`

## Ultime modifiche eseguite
- Aggiunta la route clone `/next/cisterna`
- Creato il domain clone-safe dedicato Cisterna
- Collegato il quick link `/cisterna` dal Centro Controllo clone
- Riallineati metadata e access map per il nuovo modulo attivo

## File coinvolti
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/domain/nextCisternaDomain.ts
- src/next/NextCisternaPage.tsx
- src/next/nextData.ts
- src/next/nextAccess.ts

## Decisioni gia prese
- Il clone non riusa `CisternaCaravatePage.tsx` per evitare writer e raw reads nella UI.
- Il domain usa `dupChosen` persistito quando esiste, altrimenti fallback al bollettino con piu litri.
- Se nel mese e presente una scheda manuale, quella diventa fonte verita; altrimenti il clone usa il supporto autisti.
- Se la derivazione non e pienamente ricostruibile, il clone mostra warning e riduce il report invece di inventare dati.

## Vincoli da non rompere
- Madre intoccabile
- Nessuna scrittura su dataset cisterna
- Nessun endpoint IA, upload o export PDF nel clone
- Nessuna navigazione operativa verso IA o Schede Test

## Parti da verificare
- Eventuale affinamento visuale della route base senza introdurre CTA ambigue
- Eventuale scelta futura su apertura o blocco definitivo dei link ai file archivio

## Rischi aperti
- La route base resta dipendente da dataset legacy sporchi e da parametri mensili non sempre presenti.
- Le sottoroute writer `Cisterna IA` e `Schede Test` restano completamente fuori perimetro e non vanno miscelate al prossimo task.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Passare a un altro modulo auditato e piu semplice, senza tentare ora di importare IA o editor schede di Cisterna.

## Cosa NON fare nel prossimo task
- Non aprire `/cisterna/ia`
- Non aprire `/cisterna/schede-test`
- Non aggiungere export PDF o salvataggi del cambio nel clone

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
