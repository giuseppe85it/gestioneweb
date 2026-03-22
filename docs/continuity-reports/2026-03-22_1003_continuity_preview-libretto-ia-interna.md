# CONTINUITY REPORT - Preview libretto IA interna

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e deve restare isolato, in italiano e senza scritture business.

## Modulo/area su cui si stava lavorando
- IA interna del clone NEXT
- Primo assorbimento sicuro della capability legacy `libretto IA`

## Stato attuale
- La home `/next/ia/interna` espone una preview libretto secondaria e read-only.
- Il blocco usa solo letture clone-safe e distingue `diretto`, `plausibile` e `fuori perimetro`.
- Build e lint mirato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Report targa/autista/combinato in sola lettura
- Archivio locale isolato e tracking locale del modulo
- Analisi economica preview-first
- Preview documenti preview-first
- Primo blocco libretto IA preview-first

## Prossimo step di migrazione
- Valutare un secondo step libretto con artifact dedicato o viewer controllato, sempre senza riuso runtime dei backend legacy.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto interno stub `libretto-preview`
- Tipi preview libretto read-only
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Aggiunta la facciata `internalAiLibrettoPreviewFacade` sopra i layer clone-safe `nextAnagraficheFlottaDomain` e `nextLibrettiExportDomain`.
- Aggiunto il contratto stub `libretto-preview`.
- Integrata nella home IA una preview libretto che separa dati diretti, plausibili e fuori perimetro.
- Aggiornati `CHECKLIST_IA_INTERNA`, `STATO_AVANZAMENTO_IA_INTERNA`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiLibrettoPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il primo step libretto resta preview-first, read-only e reversibile.
- Il runtime legacy libretto non viene usato come backend canonico.
- OCR, Cloud Run, upload, scritture business e provider reali restano fuori perimetro.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se serva un artifact dedicato o un viewer controllato per il file libretto gia presente.
- Se serva una futura periodizzazione/storicizzazione del blocco libretto senza riattivare OCR o upload.

## Rischi aperti
- La preview libretto iniziale dipende dai dati gia presenti sul mezzo: i campi mancanti non vengono ricostruiti automaticamente.
- Il supporto file resta solo diagnostico: futuri step devono evitare di scivolare verso upload o viewer writer-heavy.

## Punti da verificare collegati
- Nessun nuovo punto aperto formale aggiunto in questo task.

## Prossimo passo consigliato
- Aprire un task separato se serve evolvere il blocco libretto verso artifact dedicato o revisione umana esplicita del file gia presente.

## Cosa NON fare nel prossimo task
- Non riattivare `IALibretto`, OCR reale, Cloud Run esterno o upload Storage nel clone.
- Non scrivere su `@mezzi_aziendali` o dataset business per trasformare la preview in workflow operativo.

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
