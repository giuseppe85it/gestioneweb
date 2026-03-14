# CONTINUITY REPORT - UI sottosistema IA interna

## Contesto generale
- Il clone NEXT resta in fase `read-only` fedele alla madre con innesti controllati sopra `/next/*`.
- Il sottosistema `/next/ia/interna*` continua a crescere in perimetro isolato, senza backend IA reale e senza scritture business.

## Modulo/area su cui si stava lavorando
- UI/UX del sottosistema IA interna
- home assistente e preview report mezzo

## Stato attuale
- La home mostra ora chat centrale, compositore ampio e suggerimenti rapidi ridotti.
- Archivio, recenti, modalita secondarie e dettagli tecnici sono ancora disponibili ma meno invasivi.
- La preview report mezzo e piu ordinata e gerarchica, con header forte, card di sintesi e blocchi separati per sezioni, fonti e azioni.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell UI del sottosistema IA
- chat locale controllata
- ricerca guidata targhe
- memoria locale del modulo
- preview report mezzo read-only
- redesign visuale della home e del report

## Prossimo step di migrazione
- Valutare in task separato il report autista o il report combinato, solo dopo decisione chiara sul perimetro dati e sulla priorita business.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Contratti dati coinvolti
- nessuno nuovo
- letture dati esistenti del sottosistema IA interno restano invariate

## Ultime modifiche eseguite
- Home IA semplificata con focus sulla conversazione.
- Report mezzo reso piu vicino alla logica visiva del dossier.
- Testi visibili riallineati in italiano nelle aree toccate.
- Documentazione obbligatoria del clone e della checklist IA aggiornata.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna modifica a facade, domain o backend in questo task.
- Guard rail, audit e dettagli tecnici devono restare disponibili ma secondari rispetto alla chat e al report.
- I report non attivi (`autista`, `combinato`) vanno mostrati come non disponibili, non simulati come pronti.

## Vincoli da non rompere
- nessuna scrittura business
- nessun riuso runtime IA legacy
- testi visibili in italiano
- perimetro clone/NEXT isolato e in sola lettura

## Parti da verificare
- Verifica UX reale su schermate strette o mobile dopo ulteriori estensioni del modulo.
- Allineamento visuale futuro tra report IA e dossier mezzi se il dossier viene ulteriormente aggiornato.

## Rischi aperti
- Il redesign non risolve da solo eventuali limiti di copertura dei blocchi dati del report.
- Una futura estensione funzionale della home puo reintrodurre rumore tecnico se non mantiene la gerarchia visiva appena definita.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Tenere i prossimi task IA separati tra UI, perimetro dati e backend, evitando patch miste sul sottosistema.

## Cosa NON fare nel prossimo task
- Non riaprire logica dati o writer business dentro un task nato come sola UI.
- Non mescolare report autista/combinato con redesign della home senza prima chiudere il loro perimetro dati.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
