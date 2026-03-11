# CONTINUITY REPORT - Dossier Mezzo / DettaglioLavoro clone-safe

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre.
- La famiglia `Lavori` nel clone ha gia liste globali e dettaglio read-only dedicato; questo micro-task chiudeva solo il collegamento mancante dal Dossier.

## Modulo/area su cui si stava lavorando
- `Dossier Mezzo` clone
- aggancio al `DettaglioLavoro` clone-safe

## Stato attuale
- Dal Dossier clone i lavori del mezzo aprono ora il dettaglio clone-safe.
- Nessun nuovo modulo e stato aperto e nessun writer e stato introdotto.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Dossier Mezzo clone read-only
- liste `Lavori in attesa` / `Lavori eseguiti`
- `DettaglioLavoro` clone-safe
- collegamento Dossier -> dettaglio

## Prossimo step di migrazione
- Nessuno obbligato sulla famiglia `Lavori`; il residuo operativo resta `LavoriDaEseguire`, che continua a stare fuori dal clone.

## Moduli impattati
- `src/next/NextDossierMezzoPage.tsx`
- famiglia `Lavori`

## Contratti dati coinvolti
- `@lavori`

## Ultime modifiche eseguite
- collegati i teaser lavori del Dossier al dettaglio clone-safe
- collegati anche i modal `Mostra tutti`
- aggiornati registri permanenti NEXT

## File coinvolti
- `src/next/NextDossierMezzoPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Il Dossier clone non deve piu trattare i lavori del mezzo come residuo non navigabile se esiste gia una route clone-safe.
- Nessun riuso del dettaglio legacy madre.

## Vincoli da non rompere
- Clone sempre read-only
- nessuna scrittura su `@lavori`
- nessun allargamento del task oltre il collegamento

## Parti da verificare
- nessuna specifica emersa da questo micro-task

## Rischi aperti
- Il dettaglio clone continua a gestire i record senza `gruppoId` nel modo prudente gia definito; questo task non cambia quella logica.

## Punti da verificare collegati
- `NESSUNO`

## Prossimo passo consigliato
- Passare a un modulo ancora non coperto, senza riaprire la famiglia `Lavori` salvo richieste specifiche.

## Cosa NON fare nel prossimo task
- Non riaprire `LavoriDaEseguire` contando su questo micro-task come base per writer o edit mode.

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

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
