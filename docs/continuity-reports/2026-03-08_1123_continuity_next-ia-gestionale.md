# CONTINUITY REPORT - IA Gestionale NEXT

## Contesto generale
- la legacy resta il sistema operativo corrente
- la NEXT cresce su route separate `/next/*` con shell frontend progressiva e ancora senza dati runtime o scritture

## Modulo/area su cui si stava lavorando
- IA Gestionale
- trasformazione del placeholder `/next/ia-gestionale` in una prima shell strutturata e leggibile

## Stato attuale
- la macro-area esiste ora come pagina reale della NEXT
- il perimetro v1 e fissato in UI come assistente business `read-only`

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO SOLO UI

## Cosa e gia stato importato/migrato
- shell UI reale
- route dedicata
- spiegazione di missione, limiti iniziali, spiegabilita e rollout futuro

## Prossimo step di migrazione
- eventuale innesto read-only contestuale dentro `Dossier Mezzo` o `Centro di Controllo`, senza backend o modelli runtime

## Moduli impattati
- `src/next/NextIAGestionalePage.tsx`
- `src/App.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- creata pagina NEXT dedicata per `IA Gestionale`
- fissato in UI il perimetro v1: `Dossier` + `Centro di Controllo`
- documentata la separazione tra IA Business NEXT e IA Audit Tecnico

## File coinvolti
- `src/next/NextIAGestionalePage.tsx`
- `src/App.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- `IA Gestionale` e una macro-area visibile della NEXT
- la v1 resta `read-only`
- le prime superfici ufficiali restano `Dossier Mezzo` e `Centro di Controllo`
- la capability di audit tecnico su repo/docs/dati resta separata

## Vincoli da non rompere
- nessuna integrazione runtime reale senza analisi impatto
- nessuna scrittura dati nuova
- nessuna copia delle pagine IA legacy

## Parti da verificare
- governance finale endpoint IA multipli
- eventuale perimetro dei primi reader reali per la v1

## Rischi aperti
- scambiare la shell corrente per una feature IA gia implementata
- allargare troppo presto il perimetro a documenti, PDF o audit tecnico runtime

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- scegliere se il primo aggancio read-only reale della IA v1 debba nascere dal `Dossier` o dal `Centro di Controllo`

## Cosa NON fare nel prossimo task
- non collegare ancora backend, modelli o Firestore
- non fare mock conversazionali o risultati IA finti
- non fondere IA business e audit tecnico nella stessa UX

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
