# CONTINUITY REPORT - Strumenti Trasversali NEXT

## Contesto generale
- la legacy resta il sistema operativo corrente
- la NEXT cresce su route separate `/next/*` con shell frontend progressiva e ancora senza dati runtime o scritture

## Modulo/area su cui si stava lavorando
- Strumenti Trasversali
- trasformazione del placeholder `/next/strumenti-trasversali` in una prima shell strutturata e leggibile

## Stato attuale
- la macro-area esiste ora come pagina reale della NEXT
- il perimetro chiarisce servizi condivisi, PDF standard, utility comuni e richiamo cross-area

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO SOLO UI

## Cosa e gia stato importato/migrato
- shell UI reale
- route dedicata
- spiegazione del confine tra strumenti condivisi, moduli business e IA Gestionale

## Prossimo step di migrazione
- eventuale import del primo servizio tecnico comune davvero utile, ad esempio grammatica PDF standard o shell di ricerca globale, sempre senza writer reali

## Moduli impattati
- `src/next/NextStrumentiTrasversaliPage.tsx`
- `src/App.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- creata pagina NEXT dedicata per `Strumenti Trasversali`
- fissato in UI il confine tra PDF standard, utility comuni e `IA Gestionale`
- documentato il ruolo di supporto cross-area verso cockpit, dossier e workflow globali

## File coinvolti
- `src/next/NextStrumentiTrasversaliPage.tsx`
- `src/App.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- `Strumenti Trasversali` e una macro-area propria della shell NEXT
- i PDF standard restano tooling tecnico distinto dai PDF intelligenti dell'IA
- la macro-area resta `read-only` e senza servizi runtime in questa fase

## Vincoli da non rompere
- nessuna integrazione runtime reale senza analisi impatto
- nessuna scrittura dati nuova
- nessuna confusione tra tooling tecnico e `IA Gestionale`

## Parti da verificare
- perimetro concreto del primo servizio trasversale da importare davvero
- standard canonico cross-modulo per PDF e ricerca globale

## Rischi aperti
- scambiare la shell corrente per servizi tecnici gia implementati
- spostare nei tool trasversali logiche che devono restare nei moduli business

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- decidere quale servizio trasversale conviene prototipare per primo in modalita read-only senza toccare la legacy

## Cosa NON fare nel prossimo task
- non collegare ancora backend, Firestore o tool legacy reali
- non trasformare l'area in una dashboard tecnica con mock ingannevoli
- non confondere questa macro-area con IA business o audit tecnico

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/architecture/FUNZIONI_TRASVERSALI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
