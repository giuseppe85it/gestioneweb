# CONTINUITY REPORT - IA interna report targa in anteprima

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre sotto `/next`.
- Il sottosistema IA interno puo crescere solo dentro `/next/ia/interna*`, senza backend reale e senza scritture business.

## Modulo/area su cui si stava lavorando
- IA interna clone
- primo use case reale: report targa in anteprima

## Stato attuale
- `/next/ia/interna` permette ricerca targa e composizione di una anteprima report in sola lettura.
- Il risultato puo essere salvato solo come sessione/richiesta/bozza simulata locale del sottosistema IA.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- routing isolato
- shell UI
- facade read-only per report targa
- repository locale simulato
- tracking in memoria

## Prossimo step di migrazione
- Raffinare il modello del report con ulteriori sezioni solo se esistono gia layer NEXT equivalenti e gia verificati.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`

## Contratti dati coinvolti
- nessuno nuovo
- letture indirette da `storage/@mezzi_aziendali`, `storage/@lavori`, `storage/@manutenzioni`, `storage/@rifornimenti`, `storage/@rifornimenti_autisti_tmp`, `storage/@materialiconsegnati`, `storage/@costiMezzo`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@analisi_economica_mezzi`

## Ultime modifiche eseguite
- Creato il facade read-only per il report targa usando il composito Dossier NEXT.
- Aggiunta la UI di ricerca e anteprima dentro `/next/ia/interna`.
- Aggiunto il salvataggio come bozza simulata locale e aggiornati sessioni/richieste/bozze/audit.
- Riallineati i testi visibili del subtree IA interno in italiano.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/internal-ai.css`

## Decisioni gia prese
- Nessun riuso runtime dei moduli IA legacy.
- Nessuna scrittura Firestore/Storage business.
- Nessuna persistenza reale delle bozze in questo step.
- Riutilizzo preferenziale dei layer NEXT read-only gia normalizzati.

## Vincoli da non rompere
- Madre intoccabile.
- Nessun segreto lato client.
- Nessun backend IA reale nel clone.
- Nessun hook globale fuori dal perimetro IA interno.

## Parti da verificare
- Se servono ulteriori domini per la preview, verificarli prima in `src/next/domain/*` e nella documentazione dati.
- Validare in task separato se e quando una persistenza dedicata IA puo esistere senza toccare dati business.

## Rischi aperti
- I limiti dei layer NEXT riusati entrano anche nella preview IA: vanno mostrati, non nascosti.
- Le bozze simulate sono solo in memoria e non devono essere confuse con archivio persistente.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Consolidare la matrice delle fonti e valutare un secondo use case read-only solo se esiste gia un layer NEXT equivalente e sicuro.

## Cosa NON fare nel prossimo task
- Non aggiungere writer o backend reali per “completare” il report.
- Non saltare i layer NEXT per leggere dataset grezzi piu in fretta.
- Non salvare bozze o artifact su Storage/Firestore business.

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
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
