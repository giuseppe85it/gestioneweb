# CONTINUITY REPORT - Audit parita clone/NEXT vs madre

## Contesto generale
- Il progetto resta nella fase di clone/NEXT `read-only` della madre, con madre intoccabile e layer puliti da usare come base di convergenza.
- L'audit completo del 2026-03-29 ha fissato nel repo che la NEXT non e ancora a parita `100%` con la madre.

## Modulo/area su cui si stava lavorando
- Audit trasversale del clone/NEXT ufficiale sotto `src/next/*`
- Confronto con route madre, pagine legacy, domain NEXT, dipendenze reali e moduli fuori perimetro

## Stato attuale
- Stabile: esistono gia reader/read model puliti per `D01`, `D03`, `D04`, `D05`, `D06`, `D07/D08`, `D09`, `D10`.
- Stabile: `Dossier Gomme` e `Dossier Rifornimenti` risultano oggi i casi realmente `PARI`.
- In corso: molte route ufficiali restano `PARI MA RAW`.
- In corso: `Centro di Controllo`, `Procurement`, `Lavori` e backbone `Dossier Mezzo` risultano ancora `SPEZZATO`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Shell e routing `/next/*`
- Cloni read-only wrapperizzati di molte pagine madre
- Domain/read model puliti per piu aree core
- Sottosistema IA interna separato

## Prossimo step di migrazione
- Portare la route ufficiale `/next/centro-controllo` sul layer `D10/D03` mantenendo la UI reale della madre.

## Moduli impattati
- Centro di Controllo
- Mezzi
- Dossier Mezzo
- Procurement
- Lavori
- Autisti Inbox

## Contratti dati coinvolti
- `@mezzi_aziendali`
- `@lavori`
- `@manutenzioni`
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`
- `@materialiconsegnati`
- `@inventario`
- `@ordini`
- `@preventivi`
- `@listino_prezzi`
- `autisti_eventi`

## Ultime modifiche eseguite
- Creato l'audit completo di parita clone/NEXT vs madre.
- Aggiornato lo stato migrazione NEXT con il verdetto ufficiale dell'audit.
- Aggiornati registro modifiche clone e stato attuale progetto.

## File coinvolti
- `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/change-reports/2026-03-29_1024_docs_audit-completo-parita-clone-next-vs-madre.md`
- `docs/continuity-reports/2026-03-29_1024_continuity_audit-parita-clone-next-vs-madre.md`

## Decisioni gia prese
- `Targa 360` e `Autista 360` sono `FUORI PERIMETRO` della parity clone -> madre.
- Conta piu la route ufficiale montata in `src/App.tsx` che una superficie NEXT alternativa non agganciata al routing.
- Una superficie clone-fedele ma ancora raw va classificata `PARI MA RAW`, non `PARI`.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business reale nel clone.
- Nessun patch runtime in task documentali.
- Tutti i testi UI del gestionale devono restare in italiano.

## Parti da verificare
- Guard-rail e side effect residui delle sottopagine `Autisti Inbox` importate direttamente dal legacy.
- Copertura effettiva di alcuni report/PDF secondari nei moduli custom NEXT.
- Parita fine di modali e tabelle secondarie nei moduli `Mezzi`, `Dossier Mezzo`, `Capo`, `IA child routes`.

## Rischi aperti
- Falsa percezione di parita su route ufficiali ancora raw.
- Duplicazione architetturale nei moduli oggi `SPEZZATO`.
- Procurement incompleto finche `Preventivi` e `Listino` restano fuori dal layer pulito.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Aprire un task operativo `P0` sul solo `Centro di Controllo` per unire UI clone-fedele e layer `D10/D03` sulla route ufficiale.

## Cosa NON fare nel prossimo task
- Non toccare insieme `Centro di Controllo`, `Procurement` e `Lavori` nello stesso step.
- Non dichiarare `PARI` moduli che restano ancora appoggiati a route raw ufficiali.
- Non riaprire scritture, upload o delete nella madre per inseguire la parity.

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
- `docs/audit/AUDIT_COMPLETO_PARITA_CLONE_NEXT_VS_MADRE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
