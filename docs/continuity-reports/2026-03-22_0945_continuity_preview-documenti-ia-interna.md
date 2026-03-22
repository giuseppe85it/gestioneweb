# CONTINUITY REPORT - Preview documenti IA interna

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e deve restare isolato, in italiano e senza scritture business.

## Modulo/area su cui si stava lavorando
- IA interna del clone NEXT
- Primo assorbimento sicuro della capability legacy `documenti IA`

## Stato attuale
- La home `/next/ia/interna` espone una preview documenti secondaria e read-only.
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
- Primo blocco documenti IA preview-first

## Prossimo step di migrazione
- Valutare un secondo step documenti con filtro periodo e artifact dedicato, sempre senza riuso runtime dei backend legacy.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts`
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto interno stub `documents-preview`
- Tipi preview documenti read-only
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Aggiunta la facciata `internalAiDocumentsPreviewFacade` sopra il layer clone-safe `nextDocumentiCostiDomain`.
- Aggiunto il contratto stub `documents-preview`.
- Integrata nella home IA una preview documenti che separa record diretti, plausibili e fuori perimetro.
- Aggiornati `CHECKLIST_IA_INTERNA`, `STATO_AVANZAMENTO_IA_INTERNA`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiDocumentsPreviewFacade.ts
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il primo step documenti resta preview-first, read-only e reversibile.
- Il runtime legacy documenti non viene usato come backend canonico.
- OCR, upload, scritture business e provider reali restano fuori perimetro.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se serva un filtro periodo dedicato al blocco documenti senza introdurre inferenze deboli.
- Se serva un artifact dedicato per la preview documenti o basti il report generale nelle prossime tranche.

## Rischi aperti
- La preview documenti iniziale usa ancora il layer condiviso documenti/costi: futuri step devono evitare di confondere base documentale e analisi economica.
- Procurement e approvazioni hanno segnali utili ma non vanno promossi a backend canonico del blocco documenti senza normalizzazione dedicata.

## Punti da verificare collegati
- Nessun nuovo punto aperto formale aggiunto in questo task.

## Prossimo passo consigliato
- Aprire un task separato se serve evolvere il blocco documenti verso periodizzazione, artifact dedicato o revisione umana esplicita.

## Cosa NON fare nel prossimo task
- Non riattivare `IADocumenti`, `estrazioneDocumenti`, OCR reale o upload Storage nel clone.
- Non scrivere su `@documenti_*`, `@preventivi` o dataset business per trasformare la preview in workflow operativo.

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
