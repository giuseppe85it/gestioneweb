# CONTINUITY REPORT - DettaglioLavoro clone

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre.
- La famiglia `Lavori` era gia aperta parzialmente con le due liste globali clone-safe.

## Modulo/area su cui si stava lavorando
- Lavori
- Step 2: dettaglio read-only clone-safe

## Stato attuale
- Sono aperte `/next/lavori-in-attesa`, `/next/lavori-eseguiti` e ora anche `/next/dettagliolavori/:lavoroId`.
- `LavoriDaEseguire` resta chiuso; nessun writer su `@lavori` e stato riattivato.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Liste globali lavori read-only
- Dettaglio lavoro read-only con resolver dedicato per `lavoroId`

## Prossimo step di migrazione
- Valutare solo in task separato se collegare il nuovo dettaglio clone-safe anche dal dossier clone, senza toccare `LavoriDaEseguire`.

## Moduli impattati
- src/next/domain/nextLavoriDomain.ts
- src/next/NextLavoriInAttesaPage.tsx
- src/next/NextLavoriEseguitiPage.tsx
- src/next/NextDettaglioLavoroPage.tsx

## Contratti dati coinvolti
- `storage/@lavori`
- `storage/@mezzi_aziendali`

## Ultime modifiche eseguite
- Aggiunta route clone `/next/dettagliolavori/:lavoroId`
- Esteso il domain lavori con resolver read-only sicuro per `gruppoId`
- Collegato il dettaglio dalle due liste globali clone-safe

## File coinvolti
- src/App.tsx
- src/next/domain/nextLavoriDomain.ts
- src/next/NextDettaglioLavoroPage.tsx
- src/next/NextLavoriInAttesaPage.tsx
- src/next/NextLavoriEseguitiPage.tsx
- src/next/nextData.ts

## Decisioni gia prese
- Il clone usa la route `/next/dettagliolavori/:lavoroId` con path param, piu robusta per deep link rispetto al query param legacy.
- Se il record non ha `gruppoId`, il clone mostra solo il record principale e non aggrega tutti gli orfani legacy.
- `LavoriDaEseguire` resta fuori perimetro perche e un writer di creazione gruppi.

## Vincoli da non rompere
- Madre intoccabile
- Nessuna scrittura su `@lavori`
- Nessun riuso della UI legacy `DettaglioLavoro.tsx`

## Parti da verificare
- Eventuale aggancio futuro del dettaglio clone-safe dal dossier clone
- Eventuale affinamento visivo del dettaglio senza introdurre affordance scriventi

## Rischi aperti
- Il dataset legacy contiene record senza `gruppoId` e senza targa; la strategia read-only resta corretta solo finche il clone non prova a dedurre relazioni ulteriori.
- La famiglia `Lavori` resta ancora incompleta finche `LavoriDaEseguire` rimane fuori perimetro.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Passare a un modulo diverso gia auditato, non writer-heavy, invece di forzare ora `LavoriDaEseguire`.

## Cosa NON fare nel prossimo task
- Non riaprire la UI legacy scrivente del dettaglio.
- Non introdurre aggregazioni automatiche dei record senza `gruppoId`.

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
