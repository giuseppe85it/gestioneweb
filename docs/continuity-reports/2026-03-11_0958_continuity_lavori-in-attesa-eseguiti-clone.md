# CONTINUITY REPORT - Lavori in attesa e Lavori eseguiti clone

## Contesto generale
- Il progetto resta nella fase di clone `read-only` fedele della madre su `src/next/*`.

## Modulo/area su cui si stava lavorando
- Famiglia `Lavori`
- Quick link del `Centro Controllo`
- Domain lavori read-only

## Stato attuale
- Sono ora aperte nel clone le due route reali `/next/lavori-in-attesa` e `/next/lavori-eseguiti`.
- `Lavori Da Eseguire` e `DettaglioLavoro` restano fuori perimetro.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Due pagine clone dedicate solo consultive per backlog globale ed eseguiti
- Quick link del `Centro Controllo` risolti verso le due nuove route
- `nextLavoriDomain.ts` esteso con snapshot globale che include anche `MAGAZZINO` / senza targa

## Prossimo step di migrazione
- Audit o patch piccola su una route madre ancora importante e non aperta, evitando di entrare nei writer `Lavori Da Eseguire` e `DettaglioLavoro`

## Moduli impattati
- `Centro di Controllo`
- `Operativita Globale`
- `Lavori in attesa`
- `Lavori eseguiti`

## Contratti dati coinvolti
- Nessun contratto dati nuovo

## Ultime modifiche eseguite
- Aggiunte le route clone `/next/lavori-in-attesa` e `/next/lavori-eseguiti`
- Attivati i quick link clone corrispondenti nel `Centro Controllo`
- Esteso il layer lavori read-only per snapshot globale e gruppi `MAGAZZINO`
- Mantenuto il blocco totale di dettaglio, PDF, share, download e azioni scriventi

## File coinvolti
- src/App.tsx
- src/next/NextCentroControlloPage.tsx
- src/next/NextLavoriInAttesaPage.tsx
- src/next/NextLavoriEseguitiPage.tsx
- src/next/domain/nextLavoriDomain.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Decisioni gia prese
- Le due liste vengono aperte come route clone dedicate, coerenti con la madre
- `Lavori Da Eseguire` non viene aperto perche e writer di creazione
- `DettaglioLavoro` non viene aperto perche e route scrivente

## Vincoli da non rompere
- Madre intoccabile
- Nessuna scrittura nel clone
- Nessun drill-down a route legacy scriventi
- Nessuna azione esterna PDF/share/download

## Parti da verificare
- Se in un task futuro serva una route clone separata per `DettaglioLavoro` solo dopo separazione completa dai writer
- Se convenga aggiungere un ingresso secondario a queste liste anche da `Operativita Globale`

## Rischi aperti
- Il dominio `Lavori` resta sensibile per writer legacy e accoppiamento col dettaglio
- Le nuove liste clone non equivalgono ancora alle pagine madre sul piano degli export PDF o del drill-down

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Matrice ruoli/permessi definitiva

## Prossimo passo consigliato
- Task piccolo su una famiglia reale ancora mancante o su una route oggi solo embedded, senza aprire writer

## Cosa NON fare nel prossimo task
- Non aprire `Lavori Da Eseguire` senza nuovo audit
- Non riattivare PDF, share o dettaglio scrivente dentro queste due liste

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
