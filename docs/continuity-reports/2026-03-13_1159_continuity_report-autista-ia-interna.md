# CONTINUITY REPORT - IA interna report autista

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre, con sottosistema IA interno confinato a `/next/ia/interna*`.
- La strategia attiva continua a escludere scritture business, backend IA reale e riuso runtime dei moduli IA legacy.

## Modulo/area su cui si stava lavorando
- IA interna clone
- Estensione del primo use case sicuro da `report targa` a `report autista`

## Stato attuale
- Il modulo IA interno supporta ora due preview distinte: `report targa` e `report autista`.
- Lookup, memoria recente, artifact locali e chat mock gestiscono entrambi i flussi.
- Il perimetro resta totalmente read-only e confinato al clone.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI overview clone-safe del sottosistema IA
- Lookup mezzi e autisti reali read-only
- Preview report targa e report autista
- Archivio artifact locale isolato
- Tracking e memoria locale del modulo
- Chat mock locale controllata

## Prossimo step di migrazione
- Valutare un terzo use case read-only sopra i layer gia stabili, evitando di aprire nuovi reader raw o di trattare il dominio D03 come canonico.

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/*
- documentazione prodotto clone/NEXT

## Contratti dati coinvolti
- storage/@colleghi
- storage/@mezzi_aziendali
- storage/@rifornimenti
- storage/@rifornimenti_autisti_tmp
- storage/@autisti_sessione_attive
- storage/@storico_eventi_operativi
- storage/@segnalazioni_autisti_tmp
- storage/@controlli_mezzo_autisti

## Ultime modifiche eseguite
- Creato lookup autisti clone-safe con autosuggest reale.
- Introdotto facade `report autista` read-only con fonti esplicite e dati mancanti.
- Estesi tracking, memoria locale, artifact e chat mock per distinguere anche il flusso autista.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiTracking.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiDriverLookup.ts
- src/next/internal-ai/internalAiDriverReportFacade.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- La fonte primaria per lookup autista resta il layer clone-safe `@colleghi`, non letture raw nuove.
- I segnali operativi autista sono ammessi solo tramite layer NEXT gia esistenti e con limiti espliciti.
- La chat mock puo essere estesa solo quando il riuso resta locale, semplice e reversibile.

## Vincoli da non rompere
- Nessuna scrittura Firestore/Storage business.
- Nessun riuso runtime IA legacy o backend IA/PDF esistenti.
- Tutti i testi visibili devono restare in italiano.
- Ogni task IA futuro deve aggiornare la checklist unica e i registri clone/NEXT.

## Parti da verificare
- Qualita del matching nome dichiarato su mezzo quando manca `autistaId`.
- Utilita futura dei segnali D10 per report autista finche il dominio D03 resta non canonico.

## Rischi aperti
- Il dominio eventi autisti resta `DA VERIFICARE` e non va promosso a sorgente canonica del report.
- Le associazioni indirette via nome restano solo di supporto e devono rimanere marcate come parziali.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Stream eventi autisti canonico definitivo

## Prossimo passo consigliato
- Consolidare un prossimo use case IA read-only che riusi solo layer clone gia esistenti e che mantenga separati target, fonti e limiti come fatto ora tra targa e autista.

## Cosa NON fare nel prossimo task
- Non leggere raw direttamente `@autisti_sessione_attive` o `@storico_eventi_operativi` dalla UI IA.
- Non introdurre persistenza server-side artifact o tracking finche policy Firestore/Storage e identity non sono chiuse.
- Non allargare il modulo IA interno ai backend legacy o a provider reali.

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
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
