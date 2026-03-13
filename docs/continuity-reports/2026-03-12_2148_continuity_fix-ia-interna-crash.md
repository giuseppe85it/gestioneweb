# CONTINUITY REPORT - Fix crash IA interna clone

## Contesto generale
- Il clone `/next` resta il perimetro sicuro per il sottosistema IA interno non operativo.
- Il subtree `/next/ia/interna*` era stato appena introdotto come scaffolding isolato.

## Modulo/area su cui si stava lavorando
- tracking locale IA interna
- pagina `NextInternalAiPage`

## Stato attuale
- La pagina IA interna non deve piu entrare in loop di render.
- Tracking, mock repository e route restano isolati e non operativi.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- route isolate
- shell UI
- tracking in-memory
- mock repository

## Prossimo step di migrazione
- N/A sul bugfix; il prossimo passo resta esterno a questo task e riguarda solo la progettazione del backend IA dedicato.

## Moduli impattati
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Corretto lo snapshot del tracking per `useSyncExternalStore`.
- Eliminato il punto che causava warning `getSnapshot should be cached` e `Maximum update depth exceeded`.
- Ricontrollate le liste del subtree IA senza allargare la patch.

## File coinvolti
- `src/next/internal-ai/internalAiTracking.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Nessun allargamento del fix fuori dal subtree IA clone.
- Nessun cambiamento architetturale dello scaffolding.

## Vincoli da non rompere
- Nessuna modifica alla madre.
- Nessuna scrittura business.
- Nessun riuso runtime IA legacy.

## Parti da verificare
- Se dovessero ricomparire warning di key, verificare prima il render effettivo in browser sul subtree IA senza toccare moduli esterni.

## Rischi aperti
- Nessuno specifico oltre al normale debito storico di lint del repository fuori perimetro.

## Punti da verificare collegati
- `NO`

## Prossimo passo consigliato
- Continuare sul sottosistema IA solo con task isolati e verificabili, mantenendo tracking e artifact mock fino a definizione del backend dedicato.

## Cosa NON fare nel prossimo task
- Non introdurre persistenza reale nel tracking come scorciatoia.
- Non collegare il subtree IA a backend legacy per “risolvere” il mock.

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
