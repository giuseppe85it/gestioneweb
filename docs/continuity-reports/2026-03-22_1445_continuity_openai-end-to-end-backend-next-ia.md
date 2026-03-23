# CONTINUITY REPORT - Backend IA separato / Provider OpenAI

## Contesto generale
- Il progetto resta nella fase di clone NEXT `read-only` della madre, con sottosistema IA interna isolato sotto `/next/ia/interna*`.
- Il backend IA separato esiste gia con adapter server-side, persistenza IA dedicata, retrieval read-only iniziale e primo workflow preview/approval/rollback.

## Modulo/area su cui si stava lavorando
- Backend IA separato della NEXT
- Verifica reale del primo provider server-side sul caso d'uso `sintesi guidata del report gia letto`

## Stato attuale
- Il provider reale OpenAI e verificato end-to-end nel backend IA separato.
- Il workflow `preview -> approvazione -> rifiuto -> rollback` funziona sul solo contenitore IA dedicato.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone `/next/ia/interna*`
- bridge frontend verso adapter server-side
- persistenza IA dedicata server-side
- retrieval read-only iniziale
- primo workflow reale con provider lato server

## Prossimo step di migrazione
- Rendere piu stabile il bootstrap del processo server-side rispetto alle variabili ambiente del runner, senza esporre segreti lato client e senza allargare i casi d'uso.

## Moduli impattati
- backend/internal-ai
- src/next/internal-ai
- documentazione stato progetto / stato NEXT / checklist IA

## Contratti dati coinvolti
- `process.env.OPENAI_API_KEY`
- `backend/internal-ai/runtime-data/ai_preview_workflows.json`
- `backend/internal-ai/runtime-data/ai_traceability_log.json`

## Ultime modifiche eseguite
- Registrato che l'adapter legge il segreto solo da `process.env.OPENAI_API_KEY`.
- Verificato realmente `health`, `artifacts.preview`, `approve_preview`, `reject_preview` e `rollback_preview`.
- Aggiornati i registri permanenti della NEXT e del sottosistema IA interno.

## File coinvolti
- backend/internal-ai/README.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Il provider reale ammesso in questo perimetro e solo server-side.
- Il caso d'uso reale resta confinato alla sola preview/proposta del report gia letto, senza scritture business automatiche.

## Vincoli da non rompere
- Nessuna scrittura Firestore/Storage business.
- Nessun segreto lato client e nessun riuso runtime dei backend legacy come canale canonico.
- Nessun allargamento a nuovi casi d'uso senza task dedicato.

## Parti da verificare
- Bootstrap piu robusto del processo server-side rispetto alla mancata ereditarieta della variabile ambiente utente Windows nella shell corrente.
- Strategia di deploy reale del backend IA separato oltre il runner locale.

## Rischi aperti
- Il runner locale puo non ereditare automaticamente `OPENAI_API_KEY` pur avendola configurata a livello utente.
- Il flusso reale resta ancora limitato a una sola capability e non copre scritture o retrieval business completi.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` per governance finale backend IA/PDF e policy infrastrutturali.

## Prossimo passo consigliato
- Stabilizzare l'avvio del backend IA separato in un adapter/server process coerente con l'ambiente di esecuzione reale, mantenendo `process.env.OPENAI_API_KEY` solo lato server e senza esporre segreti al frontend.

## Cosa NON fare nel prossimo task
- Non aprire scritture business automatiche.
- Non spostare segreti lato client o in file versionati.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
