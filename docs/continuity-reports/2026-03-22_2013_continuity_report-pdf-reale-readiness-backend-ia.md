# CONTINUITY REPORT - Report PDF reale IA + readiness backend IA

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile.
- Il sottosistema IA interno e gia backend-first, con artifact dedicati, provider server-side controllato, repo understanding e fallback locale esplicito.

## Modulo/area su cui si stava lavorando
- overview `/next/ia/interna`
- flusso report -> artifact -> anteprima PDF
- readiness Firebase/Storage del backend IA separato

## Stato attuale
- I report strutturati richiesti in chat vengono ora aperti in una modale con PDF reale generato dal perimetro IA, mentre il thread conserva solo una conferma breve.
- Il backend IA separato ha ora un `package.json` dedicato, ma il bridge Firebase/Storage business read-only resta non attivo.

## Cosa e gia stato importato/migrato
- chat conversazionale controllata
- artifact IA dedicati
- workflow preview/approval/rollback
- repo understanding controllato
- PDF report on demand dal contenuto gia verificato dell'artifact IA

## Prossimo step di migrazione
- decidere se persistere anche il PDF come binario lato server nel contenitore IA dedicato, senza toccare business data
- aprire solo dopo un vero adapter Firebase read-only dedicato con `firebase-admin`, credenziali e policy verificate

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiReportPdf.ts
- src/next/internal-ai/internal-ai.css
- backend/internal-ai/package.json
- backend/internal-ai/server/internal-ai-firebase-readiness.js

## Contratti dati coinvolti
- nessun nuovo contratto business
- readiness server-side del backend IA separato piu esplicita e tracciabile

## Ultime modifiche eseguite
- La modale report usa ora una vera preview PDF inline invece di una sola preview documento testuale.
- Il download passa a PDF, mantenendo copia contenuto e condivisione browser dove disponibile.
- Aggiunto il package dedicato `backend/internal-ai/package.json` per governare meglio il perimetro futuro Firebase/Storage del backend IA.
- La readiness continua a esporre whitelist candidate ma non attiva nessun bridge business live.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiReportPdf.ts
- src/next/internal-ai/internal-ai.css
- backend/internal-ai/package.json
- backend/internal-ai/README.md
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- I report strutturati restano separati dalla chat.
- Il PDF puo essere generato nel perimetro IA senza usare il legacy come backend canonico.
- Firebase/Storage business read-only non vanno aperti finche mancano package governance completa, `firebase-admin`, credenziali e policy verificabili.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun segreto lato client
- nessun backend legacy come canale canonico
- testi visibili in italiano

## Parti da verificare
- persistenza server-side del PDF come artifact separato
- introduzione futura di `firebase-admin` nel package `backend/internal-ai`
- credenziale server-side dedicata e policy Firestore/Storage verificabili

## Rischi aperti
- il PDF non e ancora persistito come file dedicato lato server
- il package dedicato del backend IA esiste, ma non governa ancora davvero Firebase/Storage
- un futuro bridge live Firebase/Storage resta ad alto rischio se aperto prima delle policy/credenziali corrette

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- consolidare il report PDF come artifact IA completo solo se serve davvero lato server
- non aprire il bridge Firebase/Storage live finche non e pronto un adapter read-only dedicato e tracciabile

## Cosa NON fare nel prossimo task
- non introdurre writer business
- non agganciare il legacy come backend canonico
- non raccontare Firebase/Storage business read-only come gia attivi

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- docs/STATO_ATTUALE_PROGETTO.md
- AGENTS.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
