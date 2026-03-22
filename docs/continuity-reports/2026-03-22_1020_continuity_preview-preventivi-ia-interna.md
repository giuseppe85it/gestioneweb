# CONTINUITY REPORT - Preview preventivi IA interna

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e deve restare isolato, in italiano e senza scritture business.

## Modulo/area su cui si stava lavorando
- IA interna del clone NEXT
- Primo assorbimento sicuro della capability legacy `preventivi IA`

## Stato attuale
- La home `/next/ia/interna` espone una preview preventivi secondaria e read-only.
- Il blocco usa solo letture clone-safe e distingue `diretto`, `plausibile/supporto separato` e `fuori perimetro`.
- Build e lint mirato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Report targa/autista/combinato in sola lettura
- Archivio locale isolato e tracking locale del modulo
- Analisi economica preview-first
- Primo blocco documenti IA preview-first
- Primo blocco libretto IA preview-first
- Primo blocco preventivi IA preview-first

## Prossimo step di migrazione
- Valutare un secondo step preventivi con filtro periodo, artifact dedicato o revisione umana, sempre senza riuso runtime dei backend legacy.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts`
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto interno stub `preventivi-preview`
- Tipi preview preventivi read-only
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Aggiunta la facciata `internalAiPreventiviPreviewFacade` sopra i layer clone-safe `nextDocumentiCostiDomain` e supporto procurement.
- Aggiunto il contratto stub `preventivi-preview`.
- Integrata nella home IA una preview preventivi che separa record diretti, plausibili/supporti separati e fuori perimetro.
- Aggiornati `CHECKLIST_IA_INTERNA`, `STATO_AVANZAMENTO_IA_INTERNA`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiPreventiviPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il primo step preventivi resta preview-first, read-only e reversibile.
- Il runtime legacy preventivi non viene usato come backend canonico.
- Il procurement globale e le approvazioni restano solo supporto separato, non base diretta del blocco.
- Parsing IA reale, upload e scritture business restano fuori perimetro.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se serva un filtro periodo dedicato al blocco preventivi senza confondere procurement globale e preventivi mezzo-centrici.
- Se serva un artifact dedicato per la preview preventivi o basti il report generale nelle prossime tranche.

## Rischi aperti
- La preview preventivi iniziale appoggia ancora una parte della copertura al layer condiviso documenti/costi: futuri step devono evitare di confondere base mezzo-centrica e supporto procurement separato.
- Workflow approvativo e PDF timbrati hanno ancora un perimetro dedicato da definire e non vanno fusi nel blocco preventivi IA.

## Punti da verificare collegati
- Nessun nuovo punto aperto formale aggiunto in questo task.

## Prossimo passo consigliato
- Aprire un task separato se serve evolvere il blocco preventivi verso periodizzazione, artifact dedicato o revisione umana esplicita.

## Cosa NON fare nel prossimo task
- Non riattivare `Acquisti`, `estraiPreventivoIA`, OCR reale o upload Storage nel clone.
- Non scrivere su `@preventivi`, `@preventivi_approvazioni`, `@documenti_*` o dataset business per trasformare la preview in workflow operativo.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
