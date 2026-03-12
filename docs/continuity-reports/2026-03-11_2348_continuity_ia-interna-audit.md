# CONTINUITY REPORT - IA interna gestionale

## Contesto generale
- il progetto ha una madre legacy intoccabile e una NEXT/clone sotto `/next` destinata a diventare la nuova madre
- il task corrente non ha toccato runtime o codice applicativo: ha solo prodotto un audit architetturale documentale sulla futura IA interna

## Modulo/area su cui si stava lavorando
- governance architetturale della futura IA interna
- perimetro: collocazione sicura, isolamento, riusi possibili, vincoli e roadmap

## Stato attuale
- esistono gia UI legacy e clone per la famiglia IA documentale/libretti
- esistono pattern forti di preview PDF e shell clone riusabili
- non esiste ancora un sottosistema IA interno dedicato, isolato e governato con preview/approval/rollback

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- DA VERIFICARE

## Cosa e gia stato importato/migrato
- shell clone e route IA clone-safe gia presenti nel runtime
- nessun backend IA nuovo
- nessun archivio artifact IA
- nessun workflow di approvazione o rollback

## Prossimo step di migrazione
- aprire un task separato di progettazione/scaffolding non operativo del modulo IA isolato nella shell clone

## Moduli impattati
- documentazione architetturale
- futura area IA interna

## Contratti dati coinvolti
- nessuno modificato
- riferimenti chiave: `@impostazioni_app/gemini`, collection `storage/<key>`, `@documenti_*`, `@analisi_economica_mezzi`

## Ultime modifiche eseguite
- creato documento permanente di linee guida IA interna
- creato documento stato avanzamento IA interna
- tracciato il task con change report e continuity report

## File coinvolti
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/change-reports/2026-03-11_2348_docs_audit-architetturale-ia-interna.md
- docs/continuity-reports/2026-03-11_2348_continuity_ia-interna-audit.md

## Decisioni gia prese
- la futura IA va innestata prima nella shell clone `/next`, non nella madre
- il backend IA futuro deve essere separato dalle funzioni IA/PDF legacy gia presenti nel repo
- preview, approvazione umana, rollback e audit log sono obbligatori prima di ogni operazione non solo read-only

## Vincoli da non rompere
- madre intoccabile
- nessuna nuova scrittura business senza approvazione umana
- nessun riuso runtime delle funzioni IA legacy come backend canonico del nuovo sottosistema
- nessuna modifica applicativa in task documentali come questo

## Parti da verificare
- policy Firestore effettive
- policy Storage effettive
- ownership e canale canonico dei backend IA/PDF oggi esistenti
- strategia segreti lato server e modello permessi reale

## Rischi aperti
- backend IA/PDF attuale frammentato tra callable, HTTP Functions, Cloud Run e server locale/edge
- chiave Gemini oggi gestita anche dal client
- auth anonima e assenza `firestore.rules` nel repo rendono rischiosa qualunque implementazione IA scrivente

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- definire in un task separato i contratti minimi di `ai_sessions`, `ai_requests`, `analysis_artifacts`, audit log e tracking persistente, senza ancora implementare runtime produttivo

## Cosa NON fare nel prossimo task
- non collegare la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf` o al Cloud Run libretto
- non aggiungere scritture su dataset business
- non usare segreti provider dal client

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
