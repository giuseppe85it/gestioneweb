# CONTINUITY REPORT - IA interna filtri temporali report

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre, con sottosistema IA interno confinato a `/next/ia/interna*`.
- La strategia attiva continua a escludere scritture business, backend IA reale e riuso runtime dei moduli IA legacy.

## Modulo/area su cui si stava lavorando
- IA interna clone
- Estensione dei report read-only con filtro periodo e contesto temporale condiviso

## Stato attuale
- Il modulo IA interno supporta ora un blocco periodo condiviso per `report targa` e `report autista`.
- La preview mostra il periodo attivo, il livello di applicazione del filtro per sezione/fonte e conserva il periodo in memoria/artifact locali.
- La chat mock puo usare periodi espliciti da prompt oppure il periodo gia attivo nella UI.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI overview clone-safe del sottosistema IA
- Lookup mezzi e autisti reali read-only
- Preview report targa e report autista
- Filtri temporali condivisi sui report read-only
- Archivio artifact locale isolato
- Tracking e memoria locale del modulo
- Chat mock locale controllata

## Prossimo step di migrazione
- Valutare se aggiungere un terzo use case read-only sopra i layer gia stabili oppure affinare il report periodo con nuovi domini solo dopo verifica documentale delle date disponibili.

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/*
- documentazione prodotto clone/NEXT

## Contratti dati coinvolti
- storage/@lavori
- storage/@manutenzioni
- storage/@rifornimenti
- storage/@rifornimenti_autisti_tmp
- storage/@costiMezzo
- @documenti_mezzi
- @documenti_magazzino
- @documenti_generici
- storage/@autisti_sessione_attive
- storage/@storico_eventi_operativi
- storage/@segnalazioni_autisti_tmp
- storage/@controlli_mezzo_autisti

## Ultime modifiche eseguite
- Creato un contratto periodo riusabile per il sottosistema IA interno.
- Estesi i facade report per applicare il filtro solo alle sezioni con data leggibile.
- Aggiornati UI, chat mock, memoria locale e archivio artifact per mostrare e ricordare il periodo attivo.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiTracking.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- src/next/internal-ai/internalAiDriverReportFacade.ts
- src/next/internal-ai/internalAiReportPeriod.ts
- src/next/internal-ai/internal-ai.css
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il filtro periodo non va forzato sulle sezioni prive di date affidabili.
- La chat mock puo gestire il periodo solo restando locale, semplice e reversibile.
- Il periodo usato dai report va tracciato solo in memoria/artifact locali del modulo IA.

## Vincoli da non rompere
- Nessuna scrittura Firestore/Storage business.
- Nessun riuso runtime IA legacy o backend IA/PDF esistenti.
- Tutti i testi visibili devono restare in italiano.
- Ogni task IA futuro deve aggiornare la checklist unica e i registri clone/NEXT.

## Parti da verificare
- Affidabilita temporale del layer materiali se un domani si volesse filtrare anche quella sezione.
- Utilita reale dei segnali D10 per report autista finche il dominio D03 resta non canonico.

## Rischi aperti
- Alcuni record legacy possono avere data ricostruita o assente: il filtro resta quindi parziale per design e non va “allargato” senza nuove prove.
- La chat mock dipende dal parsing locale delle frasi periodo e non da un backend NLP reale.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Stream eventi autisti canonico definitivo

## Prossimo passo consigliato
- Consolidare un eventuale prossimo use case IA read-only mantenendo lo stesso criterio: periodo esplicito, fonti dichiarate, sezioni non filtrabili marcate e nessun reader raw nuovo.

## Cosa NON fare nel prossimo task
- Non estendere il filtro periodo a sezioni che oggi non espongono date stabili solo per uniformita visiva.
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
