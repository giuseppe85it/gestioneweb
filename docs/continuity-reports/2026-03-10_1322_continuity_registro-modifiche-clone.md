# CONTINUITY REPORT - Registro modifiche clone

## Contesto generale
- Il progetto e nel nuovo corso `2026-03-10`: la strategia attiva per la NEXT e il clone fedele `read-only` della madre.

## Modulo/area su cui si stava lavorando
- Governance documentale del clone
- Registro permanente delle patch clone

## Stato attuale
- Esiste ora un registro ufficiale centrale delle modifiche clone in `docs/product/REGISTRO_MODIFICHE_CLONE.md`.
- `AGENTS.md` rende il suo aggiornamento obbligatorio per ogni patch futura sul clone.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Registro documentale clone
- Richiamo nel workflow di `STATO_MIGRAZIONE_NEXT.md`
- Regola vincolante in `AGENTS.md`

## Prossimo step di migrazione
- Ogni nuovo task su `src/next/*` deve aggiungere subito una nuova voce nel registro clone.

## Moduli impattati
- `src/next/*` come perimetro di governance
- documentazione prodotto clone

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Creato `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- Inserite le principali modifiche storiche del nuovo corso clone
- Aggiornati `AGENTS.md` e `docs/product/STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `AGENTS.md`

## Decisioni gia prese
- Il clone `read-only` deve avere un registro centrale permanente delle patch.
- Nessuna patch clone e completa senza aggiornare anche il registro.

## Vincoli da non rompere
- Madre intoccabile
- Nessuna scrittura nuova nel clone
- Solo file in whitelist

## Parti da verificare
- Coerenza futura tra `AGENTS.md`, report workflow e applicazione pratica del registro nei prossimi task.

## Rischi aperti
- Se il registro non viene aggiornato nei task successivi, si perde subito la disciplina introdotta.

## Punti da verificare collegati
- Nessun nuovo punto aggiunto a `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Riallineare e ridurre i file documentali del nuovo corso che appaiono duplicati o pre-clone, senza pulizia aggressiva.

## Cosa NON fare nel prossimo task
- Non archiviare o cancellare documenti attivi senza confronto esplicito tra nuovo corso clone e materiale pre-clone.

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
