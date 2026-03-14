# CONTINUITY REPORT - Pulizia dossier-like preview IA interna

## Contesto generale
- Il clone NEXT resta in fase `read-only` fedele alla madre con innesti controllati sopra `/next/*`.
- Il sottosistema `/next/ia/interna*` continua a crescere come modulo isolato, senza backend IA reale e senza scritture business.

## Modulo/area su cui si stava lavorando
- UI/UX della home IA interna
- report/preview del sottosistema IA

## Stato attuale
- La home mostra soprattutto chat e richiesta targa; archivio, recenti e tecnico sono piu secondari.
- La preview report e stata pulita in chiave dossier:
  - hero iniziale;
  - executive summary;
  - sezioni principali leggibili;
  - dettagli tecnici dietro espansioni.
- Anche la preview di analisi economica segue lo stesso schema di sintesi prima e dettagli dopo.

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
- preview analisi economica read-only
- preview overlay separata dalla home
- dettaglio tecnico compresso in espansioni secondarie

## Prossimo step di migrazione
- Valutare in task separato se portare lo stesso schema `sintesi prima / dettagli dopo` anche su eventuali future modalita report autista o combinato.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Contratti dati coinvolti
- nessuno nuovo
- letture dati esistenti del sottosistema IA interno restano invariate

## Ultime modifiche eseguite
- Ridotte le spiegazioni tecniche e i pannelli secondari subito visibili.
- Spostate fonti, limiti, stati e azioni in dettagli comprimibili.
- Introdotta una lettura piu business-first delle sezioni del report.
- Rafforzato il contrasto visivo e il tono professionale del modulo.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna modifica a facade, domain o backend in questo task.
- La preview deve restare orientata alla lettura del mezzo, non alla spiegazione tecnica dei layer.
- Fonti e limiti devono restare accessibili, ma non in primo piano.

## Vincoli da non rompere
- nessuna scrittura business
- nessun riuso runtime IA legacy
- testi visibili in italiano
- perimetro clone/NEXT isolato e in sola lettura

## Parti da verificare
- Verifica manuale browser della leggibilita delle espansioni su viewport piccole.
- Verifica che futuri ampliamenti del report non riportino subito in primo piano tutti i dettagli tecnici.

## Rischi aperti
- Il task migliora la UX ma non modifica la copertura dati del report.
- Se entrano nuove sezioni nel report, la classificazione visiva puo richiedere un aggiustamento UI dedicato.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Tenere separati i prossimi task tra UI, perimetro dati dei report e capability legacy da assorbire.

## Cosa NON fare nel prossimo task
- Non riportare subito in chiaro tutti i dettagli tecnici del report.
- Non mescolare pulizia UI con modifiche ai domain o ai writer business.

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
