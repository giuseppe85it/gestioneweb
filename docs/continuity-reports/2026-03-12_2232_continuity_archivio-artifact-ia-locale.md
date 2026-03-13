# CONTINUITY REPORT - Archivio artifact IA locale

## Contesto generale
- il sottosistema IA interna clone esiste gia sotto `/next/ia/interna*`
- i task precedenti hanno gia chiuso audit, scaffolding isolato, fix tracking, report targa in anteprima e checklist unica
- mancava un archivio artifact persistente che restasse isolato dai dati business

## Modulo/area su cui si stava lavorando
- archivio artifact del sottosistema IA interno
- integrazione con il use case `report targa in anteprima`

## Stato attuale
- la persistenza Firestore/Storage dedicata resta non sicura allo stato del repo
- e attivo invece un archivio artifact persistente solo locale, namespaced e confinato al clone
- l'archivio distingue `preview`, `draft` e `archiviato`
- gli artifact con payload preview possono essere riaperti nella UI IA interna

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY con archivio locale isolato

## Cosa e gia stato importato/migrato
- report targa in anteprima read-only
- repository artifact con persistenza locale isolata
- UI archivio artifact base
- checklist unica IA aggiornata

## Prossimo step di migrazione
- mantenere questo archivio solo locale finche non si chiudono policy Firestore/Storage e identity reale
- usare la checklist unica per decidere se e quando passare da `IN CORSO` a `FATTO` sul blocco archivio persistente

## Moduli impattati
- `NextInternalAiPage`
- repository locale del sottosistema IA interno
- documentazione IA/NEXT

## Contratti dati coinvolti
- solo model locali di `analysis_artifacts`, `ai_requests`, `ai_sessions` e `ai_audit_log`

## Ultime modifiche eseguite
- esteso il modello artifact con payload, fonti, tag e versionamento
- attivata persistenza locale isolata tramite `localStorage` namespaced del clone
- aggiunta UI per vedere, aprire e archiviare gli artifact
- aggiornata la documentazione per registrare il blocco archivio persistente come `IN CORSO`

## File coinvolti
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- src/next/NextIntelligenzaArtificialePage.tsx
- src/next/nextData.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-12_2232_patch_archivio-artifact-ia-locale.md
- docs/continuity-reports/2026-03-12_2232_continuity_archivio-artifact-ia-locale.md

## Decisioni gia prese
- non usare Firestore o Storage per l'archivio artifact IA finche policy e identity non sono dimostrate
- usare come primo step solo un archivio locale isolato del clone
- mantenere zero scritture sui dataset business

## Vincoli da non rompere
- nessuna modifica alla madre
- nessun riuso runtime dei moduli IA legacy
- nessun segreto lato client
- nessun impatto sui flussi correnti fuori da `/next/ia/interna*`

## Parti da verificare
- policy Firestore effettive
- policy Storage effettive
- identity reale oltre l'auth anonima
- contratto server-side dedicato per artifact, audit log e tracking

## Rischi aperti
- la persistenza locale e per-dispositivo e non condivisa tra utenti o browser
- il passaggio a persistenza server-side resta bloccato finche i punti di sicurezza aperti non vengono chiusi

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- mantenere l'archivio locale come baseline sicura e preparare, in un task separato, il contratto dati server-side dedicato senza ancora attivare scritture reali

## Cosa NON fare nel prossimo task
- non spostare gli artifact su dataset business esistenti
- non usare Storage business come scorciatoia
- non introdurre provider IA reali o backend legacy nella pipeline artifact

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

