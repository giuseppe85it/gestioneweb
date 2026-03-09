# CONTINUITY REPORT - Regola normalizzazione NEXT

## Contesto generale
- La NEXT sta importando domini in sola lettura mantenendo la legacy intatta.
- Dopo gli audit su `D04 Rifornimenti`, serviva chiarire una regola di processo per evitare blocchi automatici o proposte premature di modifica al madre.

## Modulo/area su cui si stava lavorando
- Regole operative di progetto.
- Perimetro solo documentale, senza patch runtime.

## Stato attuale
- `AGENTS.md` ora impone che, se il madre funziona gia in produzione, la prima scelta sia valutare un layer di normalizzazione dedicato nella NEXT.
- La stessa regola e allineata in `REGOLE_LAVORO_CODEX.md` e registrata nello storico decisioni.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- DA VERIFICARE

## Cosa e gia stato importato/migrato
- Nessun avanzamento runtime in questo task.
- Solo allineamento di regole operative.

## Prossimo step di migrazione
- Applicare questa regola ai prossimi task NEXT sui domini sensibili, in particolare quando il dato legacy e sporco ma leggibile tramite un mapping dedicato.

## Moduli impattati
- AGENTS.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Contratti dati coinvolti
- Nessuno direttamente.

## Ultime modifiche eseguite
- Salvata la regola "madre invariato, normalizzazione nel layer NEXT" come criterio operativo obbligatorio.
- Chiarito che un dominio sporco non va bloccato automaticamente se esiste una normalizzazione NEXT controllata.
- Chiarito che una proposta di modifica al runtime legacy richiede motivazione esplicita.

## File coinvolti
- AGENTS.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/product/STORICO_DECISIONI_PROGETTO.md
- docs/change-reports/2026-03-08_2105_docs_regola-layer-normalizzazione-next.md
- docs/continuity-reports/2026-03-08_2105_continuity_regola-normalizzazione-next.md

## Decisioni gia prese
- La prima scelta non e modificare il madre se il flusso funziona gia in produzione.
- La NEXT deve leggere i dati reali legacy tramite un layer di normalizzazione dedicato.
- UI, Dossier e IA della NEXT devono leggere solo il modello pulito interno.

## Vincoli da non rompere
- Nessuna modifica al runtime legacy senza motivazione esplicita.
- Nessuna importazione NEXT che porti direttamente shape sporche in UI o Dossier.
- La normalizzazione NEXT deve restare documentata e separata dai reader legacy.

## Parti da verificare
- Va verificato dominio per dominio quando la normalizzazione NEXT e davvero sufficiente e quando invece serve intervenire sul runtime sorgente.

## Rischi aperti
- Usare questa regola come scusa per introdurre layer NEXT opachi o non documentati sarebbe un errore.
- Copiare merge euristici legacy nella NEXT resta vietato anche con questa nuova regola.

## Punti da verificare collegati
- `DA VERIFICARE`

## Prossimo passo consigliato
- Nei prossimi task NEXT, distinguere sempre tra "dato sporco ma normalizzabile nel layer NEXT" e "sorgente insufficiente anche dopo normalizzazione".

## Cosa NON fare nel prossimo task
- Non proporre subito refactor del madre solo per pulire il sorgente.
- Non leggere shape legacy grezze direttamente in UI NEXT.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/FLUSSO_REALE_RIFORNIMENTI.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `AGENTS.md`
- `docs/product/REGOLE_LAVORO_CODEX.md`
